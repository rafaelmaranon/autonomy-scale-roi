import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { InsightsActionSchema, INSIGHTS_FUNCTION_SCHEMA, normalizePayload, type InsightsAction } from '@/lib/insights-schema'

export const dynamic = 'force-dynamic'

const URL_REGEX = /https?:\/\/[^\s)]+/i

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { message, context } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'message is required' }, { status: 400 })
    }

    const inputs = context?.inputs || {}
    const outputs = context?.outputs || {}
    const company = context?.company || 'Waymo'

    // Detect if message contains a URL — fetch article content server-side
    const urlMatch = message.match(URL_REGEX)
    let articleContent = ''
    let fetchedUrl = ''
    if (urlMatch) {
      fetchedUrl = urlMatch[0]
      try {
        const res = await fetch(fetchedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AutonomyROI/1.0)' },
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) {
          const html = await res.text()
          // Strip HTML tags, keep text, trim to ~6000 chars for token budget
          articleContent = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 6000)
        }
      } catch {
        articleContent = '[Could not fetch article content. The page may be paywalled or blocked.]'
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(inputs, outputs, company, articleContent, fetchedUrl)

    // Call OpenAI with function calling
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        tools: [{ type: 'function', function: INSIGHTS_FUNCTION_SCHEMA }],
        tool_choice: { type: 'function', function: { name: 'insights_action' } },
        temperature: 0.4,
        max_tokens: 1500,
      }),
    })

    const latency = Date.now() - startTime

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text().catch(() => '')
      console.error('[insights] OpenAI error:', openaiRes.status, errBody)
      let detail = `OpenAI ${openaiRes.status}`
      try { detail = JSON.parse(errBody)?.error?.message || detail } catch {}
      await logAnalytics('insights_message', { action: 'error', latency, error: detail })
      return NextResponse.json({ ok: false, error: detail }, { status: 502 })
    }

    const aiData = await openaiRes.json()
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    const fnCall = toolCall?.function

    if (!fnCall?.arguments) {
      await logAnalytics('insights_message', { action: 'no_function_call', latency })
      return NextResponse.json({ ok: false, error: 'No tool call returned from AI' })
    }

    // Parse, normalize, and validate with Zod
    const rawStr = fnCall.arguments
    let rawObj: any
    try {
      rawObj = JSON.parse(rawStr)
    } catch {
      console.error('[insights] JSON parse failed:', rawStr)
      return NextResponse.json({ ok: false, error: 'AI returned invalid JSON' })
    }

    // Normalize aliases before Zod
    const normalized = normalizePayload(rawObj)
    const result = InsightsActionSchema.safeParse(normalized)

    if (!result.success) {
      console.error('[insights] schema invalid', result.error.flatten(), normalized)
      await logAnalytics('insights_message', { action: 'parse_error', latency })
      return NextResponse.json({
        ok: false,
        error: 'AI returned invalid response schema',
        debug: { zod: result.error.flatten(), payload: normalized },
      }, { status: 502 })
    }

    const parsed: InsightsAction = result.data

    // Log to analytics
    await logAnalytics('insights_message', {
      action_type: parsed.action,
      latency,
      url_domain: fetchedUrl ? new URL(fetchedUrl).hostname : undefined,
      city_query: parsed.action === 'city_request' ? (parsed as any).city_query : undefined,
    })

    // Log to ai_logs for debugging
    try {
      await supabaseAdmin.from('ai_logs').insert({
        question: message,
        context,
        response: JSON.stringify(parsed),
        latency_ms: latency,
        model: 'gpt-4o',
        success: true,
      })
    } catch {}

    // Canonical response: rename action → type
    const { action: actionType, ...rest } = parsed as any
    return NextResponse.json({ ok: true, action: { type: actionType, ...rest } })

  } catch (err: any) {
    console.error('[insights] Server error:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  company: string,
  articleContent: string,
  fetchedUrl: string,
): string {
  let prompt = `You are an expert analyst for autonomous vehicle economics. You help users understand ${company}'s financial model and expansion data.

You MUST call the insights_action function with exactly ONE of these actions:

1. action="answer" — for questions about the scenario, charts, break-even, levers, strategy.
2. action="city_request" — when the user wants to request a city for Waymo (e.g. "I want Waymo in Austin", "deploy in Berlin", "my city is Lagos").
3. action="url_extract" — when the user pastes a URL (news article, blog post) containing data about autonomous vehicles.

RULES:
- For action="city_request": if the user says vague things like "my city", "near me", "here" WITHOUT naming a specific place, set needs_clarification=true and ask them to specify city + country/state. Never guess.
- For action="url_extract": extract numeric datapoints (fleet size, trips, miles, revenue, cities count, etc.). Every candidate MUST have confidence="pending" and status="proposed". If the article has no usable numeric data, return an empty candidates array.
- For action="answer": be concise, executive-friendly. Reference actual numbers from the context. Include 2-3 key levers if relevant.

Current scenario (${company}):
- Cities/Year: ${inputs.citiesPerYear || 'N/A'}
- Vehicles/City: ${inputs.vehiclesPerCity?.toLocaleString?.() || 'N/A'}
- Annual R&D: $${inputs.annualRDSpend || 'N/A'}B
- Ramp Time: ${inputs.rampTimePerCity || 'N/A'} years
- Profit/Mile: $${inputs.profitPerMile || 'N/A'}
- Simulation: ${inputs.startYear || 'N/A'} to ${(inputs.startYear || 0) + (inputs.yearsToSimulate || 0)}

Key results:
- Break-even Year: ${outputs.breakEvenYear || 'Never'}
- Cumulative Net Cash: ${outputs.cumulativeNetCash ? '$' + (outputs.cumulativeNetCash / 1e9).toFixed(1) + 'B' : 'N/A'}
- Paid Trips/Week: ${outputs.paidTripsPerWeek ? (outputs.paidTripsPerWeek / 1000).toFixed(0) + 'K' : 'N/A'}
- Fleet Size: ${outputs.fleetSize ? (outputs.fleetSize / 1000).toFixed(0) + 'K' : 'N/A'}`

  if (articleContent && fetchedUrl) {
    prompt += `

The user pasted a URL: ${fetchedUrl}
Article content (trimmed):
---
${articleContent}
---
Extract any numeric datapoints about autonomous vehicles (fleet size, trips, miles, revenue, cities, etc.) and return action="url_extract" with candidates. Set source_url to "${fetchedUrl}" for all candidates.`
  }

  return prompt
}

// ---------------------------------------------------------------------------
// Analytics helper
// ---------------------------------------------------------------------------

async function logAnalytics(eventType: string, payload: Record<string, any>) {
  try {
    await supabaseAdmin.from('analytics_events').insert({ event_type: eventType, payload })
  } catch {}
}

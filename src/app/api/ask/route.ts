import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { question, context } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      )
    }

    const inputs = context.inputs || {}
    const outputs = context.outputs || {}

    // Prepare the prompt for OpenAI
    const systemPrompt = `You are an expert in autonomy economics and strategic business analysis. You help executives understand the financial implications of large-scale autonomous vehicle investments.

Current scenario inputs:
- Cities per Year: ${inputs.citiesPerYear}
- Vehicles per City: ${inputs.vehiclesPerCity?.toLocaleString()}
- Annual R&D Spend: $${inputs.annualRDSpend}B
- Ramp Time per City: ${inputs.rampTimePerCity} years
- Profit per Mile: $${inputs.profitPerMile}
- Simulation: ${inputs.startYear} to ${inputs.startYear + inputs.yearsToSimulate}

Key results:
- Break-even Year: ${outputs.breakEvenYear || 'Never'}
- Cumulative Net Cash (final): $${outputs.cumulativeNetCash ? (outputs.cumulativeNetCash / 1e9).toFixed(1) + 'B' : 'N/A'}
- Paid Trips/Week (final): ${outputs.paidTripsPerWeek ? (outputs.paidTripsPerWeek / 1000).toFixed(0) + 'K' : 'N/A'}
- Fleet Size (final): ${outputs.fleetSize ? (outputs.fleetSize / 1000).toFixed(0) + 'K' : 'N/A'}
- Cumulative Miles (final): ${outputs.cumulativeMiles ? (outputs.cumulativeMiles / 1e9).toFixed(1) + 'B' : 'N/A'}

Respond in clear, executive-friendly language. Structure your answer as:
🎯 **Direct answer** (1-2 sentences)
📊 **Top levers** (ranked by impact, 3-4 items with why it matters + directional impact)
💡 **Recommended next** (1 concrete action)

Be specific and analytical. Reference the actual numbers. Avoid generic fluff.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    const latency = Date.now() - startTime

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      
      // Log failed AI request
      await supabaseAdmin
        .from('ai_logs')
        .insert({
          question,
          context,
          response: `Error: ${errorData.error?.message || 'OpenAI API error'}`,
          latency_ms: latency,
          model: 'gpt-4',
          success: false
        })

      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    const aiData = await openaiResponse.json()
    const aiResponse = aiData.choices[0]?.message?.content || 'No response generated'

    // Log successful AI request to Supabase
    await supabaseAdmin
      .from('ai_logs')
      .insert({
        question,
        context,
        response: aiResponse,
        latency_ms: latency,
        model: 'gpt-4',
        success: true
      })

    return NextResponse.json({ response: aiResponse })

  } catch (error) {
    const latency = Date.now() - startTime
    console.error('AI API error:', error)

    // Log error to Supabase
    try {
      await supabaseAdmin
        .from('ai_logs')
        .insert({
          question: 'Error occurred',
          context: {},
          response: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          latency_ms: latency,
          model: 'gpt-4',
          success: false
        })
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

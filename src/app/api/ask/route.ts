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

    // Prepare the prompt for OpenAI
    const systemPrompt = `You are an expert in autonomy economics and strategic business analysis. You help executives understand the financial implications of large-scale autonomy investments.

Current scenario context:
- Fixed Investment: $${context.inputs.fixedInvestment}B
- Profit per Mile: $${context.inputs.profitPerMile}
- Cities per Year: ${context.inputs.citiesPerYear}
- Target Cities: ${context.inputs.targetCities}
- Vehicles per City: ${context.inputs.vehiclesPerCity.toLocaleString()}
- Miles per Vehicle per Year: ${context.inputs.milesPerVehiclePerYear.toLocaleString()}
- City Ramp Time: ${context.inputs.cityRampTime} years

Results:
- Break-even Year: ${context.outputs.breakEvenYear ? `Year ${context.outputs.breakEvenYear}` : 'Never'}
- 5Y ROI: ${context.outputs.roiYear5.toFixed(1)}%
- 10Y ROI: ${context.outputs.roiYear10.toFixed(1)}%
- Required Cities for 5Y Break-even: ${context.outputs.requiredCitiesFor5YearBreakeven}

Respond in clear, executive-friendly language with 5-7 bullet insights. Focus on:
- Key drivers of break-even timing
- Most sensitive levers for ROI improvement
- Strategic risks and opportunities
- Actionable recommendations

Avoid generic fluff. Be specific and analytical.`

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

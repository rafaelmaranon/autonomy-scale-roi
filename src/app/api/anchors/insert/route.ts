import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const REQUIRED_FIELDS = ['company', 'metric', 'year', 'value', 'unit'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (body[field] == null || body[field] === '') {
        return NextResponse.json({ ok: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Force pending/proposed for safety
    const row = {
      company: body.company,
      metric: body.metric,
      year: Number(body.year),
      month: body.month ? Number(body.month) : null,
      value: Number(body.value),
      unit: body.unit,
      city: body.city || null,
      confidence: 'pending',
      status: 'proposed',
      source_title: body.source_title || null,
      source_publisher: body.source_publisher || null,
      source_date: body.source_date || null,
      source_url: body.source_url || null,
      metadata: body.metadata || (body.evidence_quote ? { evidence_quote: body.evidence_quote } : null),
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('historical_anchors')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('[anchors/insert] Error:', error.message)
      return NextResponse.json({ ok: false, error: 'Failed to insert anchor' }, { status: 500 })
    }

    // Log analytics
    try {
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'anchors_inserted',
        payload: { metric: row.metric, year: row.year, city: row.city, source_url: row.source_url },
      })
    } catch {}

    return NextResponse.json({ ok: true, anchor_id: inserted?.id })

  } catch (err) {
    console.error('[anchors/insert] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

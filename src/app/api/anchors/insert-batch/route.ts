import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const REQUIRED_FIELDS = ['company', 'metric', 'year', 'value', 'unit'] as const

export async function POST(request: NextRequest) {
  try {
    const { candidates } = await request.json()

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ ok: false, error: 'candidates array is required' }, { status: 400 })
    }

    if (candidates.length > 20) {
      return NextResponse.json({ ok: false, error: 'Maximum 20 candidates per batch' }, { status: 400 })
    }

    // Validate and sanitize each candidate
    const rows = []
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      for (const field of REQUIRED_FIELDS) {
        if (c[field] == null || c[field] === '') {
          return NextResponse.json({ ok: false, error: `Candidate ${i}: missing ${field}` }, { status: 400 })
        }
      }
      rows.push({
        company: c.company,
        metric: c.metric,
        year: Number(c.year),
        month: c.month ? Number(c.month) : null,
        value: Number(c.value),
        unit: c.unit,
        city: c.city || null,
        confidence: 'pending',
        status: 'proposed',
        source_title: c.source_title || null,
        source_publisher: c.source_publisher || null,
        source_date: c.source_date || null,
        source_url: c.source_url || null,
        metadata: c.evidence_quote ? { evidence_quote: c.evidence_quote } : null,
      })
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('historical_anchors')
      .insert(rows)
      .select('id')

    if (error) {
      console.error('[anchors/insert-batch] Error:', error.message)
      return NextResponse.json({ ok: false, error: 'Failed to insert anchors' }, { status: 500 })
    }

    // Log analytics
    try {
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'anchors_inserted',
        payload: {
          count: rows.length,
          metrics: [...new Set(rows.map(r => r.metric))],
          source_url: rows[0]?.source_url,
        },
      })
    } catch {}

    return NextResponse.json({
      ok: true,
      inserted_count: inserted?.length || rows.length,
      anchor_ids: inserted?.map(r => r.id) || [],
    })

  } catch (err) {
    console.error('[anchors/insert-batch] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

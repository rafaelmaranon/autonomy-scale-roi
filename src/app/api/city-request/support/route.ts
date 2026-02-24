import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { city } = await request.json()

    if (!city || typeof city !== 'string') {
      return NextResponse.json({ ok: false, error: 'City name required' }, { status: 400 })
    }

    // Find the city_requested row
    const { data: existing, error: findError } = await supabaseAdmin
      .from('historical_anchors')
      .select('id, value, city')
      .eq('metric', 'city_requested')
      .ilike('city', city.trim())
      .limit(1)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ ok: false, error: 'City not found' }, { status: 404 })
    }

    // Increment value (used as request_count)
    const newCount = (existing.value || 1) + 1
    const { error: updateError } = await supabaseAdmin
      .from('historical_anchors')
      .update({ value: newCount })
      .eq('id', existing.id)

    if (updateError) {
      console.error('[city-request/support] Update error:', updateError.message)
      return NextResponse.json({ ok: false, error: 'Failed to update' }, { status: 500 })
    }

    // Log analytics
    try {
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'city_support',
        payload: { city: existing.city, new_count: newCount },
      })
    } catch {}

    return NextResponse.json({ ok: true, city: existing.city, count: newCount })

  } catch (err) {
    console.error('[city-request/support] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

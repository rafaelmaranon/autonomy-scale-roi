import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { result, contributor_name, contributor_link, show_contributor } = await request.json()

    if (!result?.place_name || result?.lat == null || result?.lon == null) {
      return NextResponse.json({ ok: false, error: 'Invalid geocode result' }, { status: 400 })
    }

    const cityShort = result.place_name.split(',')[0].trim()

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from('historical_anchors')
      .select('id, city')
      .eq('metric', 'city_requested')
      .ilike('city', cityShort)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        message: `${result.place_name} has already been requested!`,
        anchor_id: existing[0].id,
      })
    }

    // Insert
    const row = {
      company: 'Waymo',
      metric: 'city_requested',
      city: cityShort,
      year: new Date().getFullYear(),
      value: 1,
      unit: 'count',
      confidence: 'pending',
      status: 'proposed',
      metadata: {
        lat: result.lat,
        lon: result.lon,
        place_name: result.place_name,
        country: result.country || '',
        region: result.region || '',
        mapbox_id: result.mapbox_id || '',
      },
      ...(contributor_name ? { contributor_name } : {}),
      ...(contributor_link ? { contributor_link } : {}),
      ...(show_contributor != null ? { show_contributor } : {}),
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('historical_anchors')
      .insert(row)
      .select()
      .single()

    if (insertError) {
      console.error('[city-request/commit] Insert error:', insertError.message)
      return NextResponse.json({ ok: false, error: 'Failed to save city request' }, { status: 500 })
    }

    // Log analytics
    try {
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'city_request_commit',
        payload: {
          city: cityShort,
          place_name: result.place_name,
          mapbox_id: result.mapbox_id,
          lat: result.lat,
          lon: result.lon,
          has_contributor: !!contributor_name,
        },
      })
    } catch {}

    return NextResponse.json({
      ok: true,
      duplicate: false,
      anchor_id: inserted?.id,
      city: cityShort,
      place_name: result.place_name,
      lat: result.lat,
      lon: result.lon,
    })

  } catch (err) {
    console.error('[city-request/commit] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { geocodePlace } from '@/lib/mapbox'
import { supabaseAdmin } from '@/lib/supabase'
import { isVagueCityQuery } from '@/lib/insights-schema'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ ok: false, error: 'City query is required (min 2 characters)' }, { status: 400 })
    }

    const trimmed = query.trim()

    // Block vague queries
    if (isVagueCityQuery(trimmed)) {
      return NextResponse.json({
        ok: false,
        error: 'Please specify a real city name with country or state (e.g. "Austin, TX" or "Berlin, Germany").',
      }, { status: 400 })
    }

    // Check Mapbox token
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      return NextResponse.json({ ok: false, error: 'Geocoding service unavailable (token not configured)' }, { status: 500 })
    }

    // Geocode with enhanced error handling
    let geo
    try {
      geo = await geocodePlace(trimmed)
      if (!geo) {
        return NextResponse.json({ ok: false, error: `No match found for "${trimmed}". Try a more specific city name.` }, { status: 404 })
      }
    } catch (err: any) {
      console.error('[city-request/preview] Geocoding failed:', err)
      return NextResponse.json({ 
        ok: false, 
        error: 'Geocoding service temporarily unavailable. Please try again.',
        debug: err.message 
      }, { status: 503 })
    }

    // Check for existing request (duplicate)
    const { data: existing } = await supabaseAdmin
      .from('historical_anchors')
      .select('id, city')
      .eq('metric', 'city_requested')
      .ilike('city', geo.place_name.split(',')[0].trim())
      .limit(1)

    // Log analytics
    try {
      await supabaseAdmin.from('analytics_events').insert({
        event_type: 'city_request_preview',
        payload: { query: trimmed, place_name: geo.place_name, mapbox_id: geo.mapbox_id },
      })
    } catch {}

    return NextResponse.json({
      ok: true,
      result: {
        place_name: geo.place_name,
        lat: geo.lat,
        lon: geo.lon,
        mapbox_id: geo.mapbox_id,
        country: geo.country,
        region: geo.region,
      },
      already_requested: existing && existing.length > 0,
    })

  } catch (err) {
    console.error('[city-request/preview] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

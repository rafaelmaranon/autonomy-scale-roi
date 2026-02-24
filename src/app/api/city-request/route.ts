import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { geocodePlace } from '@/lib/mapbox'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { city } = await request.json()

    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      return NextResponse.json(
        { error: 'City name is required (min 2 characters)' },
        { status: 400 }
      )
    }

    const trimmed = city.trim()

    // 1. Geocode with Mapbox
    const geo = await geocodePlace(trimmed)
    if (!geo) {
      return NextResponse.json(
        { error: `Could not find "${trimmed}" on the map. Try a more specific city name.` },
        { status: 404 }
      )
    }

    // 2. Check for duplicate requests (same city name, case-insensitive)
    const { data: existing } = await supabaseAdmin
      .from('historical_anchors')
      .select('id, city')
      .eq('metric', 'city_requested')
      .ilike('city', trimmed)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        duplicate: true,
        place_name: geo.place_name,
        message: `${geo.place_name} has already been requested!`,
      })
    }

    // 3. Insert into historical_anchors
    const currentYear = new Date().getFullYear()
    const row = {
      company: 'Waymo',
      metric: 'city_requested',
      city: geo.place_name.split(',')[0].trim(), // normalized short name
      year: currentYear,
      value: 1,
      unit: 'count',
      confidence: 'pending',
      status: 'proposed',
      metadata: {
        lat: geo.lat,
        lon: geo.lon,
        place_name: geo.place_name,
        country: geo.country,
        region: geo.region,
        mapbox_id: geo.mapbox_id,
      },
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('historical_anchors')
      .insert(row)
      .select()
      .single()

    if (insertError) {
      console.error('[city-request] Insert error:', insertError.message)
      return NextResponse.json(
        { error: 'Failed to save city request' },
        { status: 500 }
      )
    }

    // 4. Log analytics event
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          event_type: 'city_request',
          payload: {
            city: row.city,
            place_name: geo.place_name,
            mapbox_id: geo.mapbox_id,
            lat: geo.lat,
            lon: geo.lon,
          },
        })
    } catch (logErr) {
      console.error('[city-request] Analytics log failed:', logErr)
    }

    return NextResponse.json({
      success: true,
      place_name: geo.place_name,
      city: row.city,
      lat: geo.lat,
      lon: geo.lon,
      anchor_id: inserted?.id,
    })

  } catch (err) {
    console.error('[city-request] Server error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

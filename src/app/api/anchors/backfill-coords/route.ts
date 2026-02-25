import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { geocodePlace } from '@/lib/mapbox'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Find all city rows missing coordinates in metadata
    const { data: rows, error: fetchError } = await supabaseAdmin
      .from('historical_anchors')
      .select('id, city, metadata')
      .not('city', 'is', null)
      .order('city')

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 })
    }

    // Filter to rows missing lat/lon
    const missing = (rows || []).filter(r => {
      const meta = r.metadata as { lat?: number; lon?: number } | null
      return !meta?.lat || !meta?.lon
    })

    if (missing.length === 0) {
      return NextResponse.json({ ok: true, message: 'All city rows already have coordinates', updated: 0 })
    }

    const results: { city: string; status: string }[] = []

    for (const row of missing) {
      const geo = await geocodePlace(row.city!)
      if (geo) {
        const newMetadata = {
          ...(row.metadata as object || {}),
          lat: geo.lat,
          lon: geo.lon,
          place_name: geo.place_name,
          country: geo.country,
          region: geo.region,
        }

        const { error: updateError } = await supabaseAdmin
          .from('historical_anchors')
          .update({ metadata: newMetadata })
          .eq('id', row.id)

        if (updateError) {
          results.push({ city: row.city!, status: `error: ${updateError.message}` })
        } else {
          results.push({ city: row.city!, status: `geocoded → ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` })
        }
      } else {
        results.push({ city: row.city!, status: 'geocode failed — no result from Mapbox' })
      }
    }

    const updated = results.filter(r => r.status.startsWith('geocoded')).length

    return NextResponse.json({ ok: true, updated, total_missing: missing.length, results })

  } catch (err) {
    console.error('[anchors/backfill-coords] Error:', err)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

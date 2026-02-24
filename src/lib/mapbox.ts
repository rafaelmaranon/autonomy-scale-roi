// Mapbox forward geocoding helper
// Uses the Mapbox Geocoding API v5

export interface GeocodeResult {
  place_name: string
  lat: number
  lon: number
  country: string
  region: string
  mapbox_id: string
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN not set')
    return null
  }

  const encoded = encodeURIComponent(query.trim())
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error('[Mapbox] Geocode failed:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null

    const [lon, lat] = feature.center
    const context = feature.context || []

    const region = context.find((c: any) => c.id?.startsWith('region'))?.text || ''
    const country = context.find((c: any) => c.id?.startsWith('country'))?.text || ''

    return {
      place_name: feature.place_name || query,
      lat,
      lon,
      country,
      region,
      mapbox_id: feature.id || '',
    }
  } catch (err) {
    console.error('[Mapbox] Geocode error:', err)
    return null
  }
}

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
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&types=place,locality&limit=1`

  // Add timeout and retry logic
  const maxRetries = 2
  const timeoutMs = 8000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Mapbox] Geocoding "${query}" (attempt ${attempt + 1}/${maxRetries + 1})`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AutonomyROI/1.0'
        }
      })
      
      clearTimeout(timeoutId)

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error')
        console.error(`[Mapbox] Geocode failed (${res.status}):`, errorText)
        
        // Don't retry on client errors (4xx)
        if (res.status >= 400 && res.status < 500) {
          return null
        }
        
        // Retry on server errors (5xx) or network issues
        if (attempt < maxRetries) {
          console.log(`[Mapbox] Retrying in ${1000 * (attempt + 1)}ms...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        return null
      }

      const data = await res.json()
      const feature = data.features?.[0]
      if (!feature) {
        console.log(`[Mapbox] No results found for "${query}"`)
        return null
      }

      const [lon, lat] = feature.center
      const context = feature.context || []

      const region = context.find((c: any) => c.id?.startsWith('region'))?.text || ''
      const country = context.find((c: any) => c.id?.startsWith('country'))?.text || ''

      console.log(`[Mapbox] Successfully geocoded "${query}" -> ${feature.place_name}`)
      return {
        place_name: feature.place_name || query,
        lat,
        lon,
        country,
        region,
        mapbox_id: feature.id || '',
      }
    } catch (err: any) {
      console.error(`[Mapbox] Geocode error (attempt ${attempt + 1}):`, {
        name: err.name,
        message: err.message,
        cause: err.cause,
        code: err.code
      })
      
      // Don't retry on AbortError (timeout)
      if (err.name === 'AbortError') {
        console.error(`[Mapbox] Request timed out after ${timeoutMs}ms`)
        return null
      }
      
      // Retry on network errors
      if (attempt < maxRetries) {
        console.log(`[Mapbox] Retrying in ${1000 * (attempt + 1)}ms...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      
      return null
    }
  }
  
  return null
}

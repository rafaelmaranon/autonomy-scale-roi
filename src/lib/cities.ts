// Major world cities dataset for autonomy network visualization
// Curated list of 100+ major metropolitan areas with real coordinates

export interface City {
  name: string
  country: string
  lat: number
  lon: number
  region: string
  population?: number // Optional for future ranking
}

export const WORLD_CITIES: City[] = [
  // North America
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060, region: 'North America' },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437, region: 'North America' },
  { name: 'Chicago', country: 'USA', lat: 41.8781, lon: -87.6298, region: 'North America' },
  { name: 'San Francisco', country: 'USA', lat: 37.7749, lon: -122.4194, region: 'North America' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832, region: 'North America' },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332, region: 'North America' },
  { name: 'Miami', country: 'USA', lat: 25.7617, lon: -80.1918, region: 'North America' },
  { name: 'Boston', country: 'USA', lat: 42.3601, lon: -71.0589, region: 'North America' },
  { name: 'Seattle', country: 'USA', lat: 47.6062, lon: -122.3321, region: 'North America' },
  { name: 'Washington DC', country: 'USA', lat: 38.9072, lon: -77.0369, region: 'North America' },
  { name: 'Atlanta', country: 'USA', lat: 33.7490, lon: -84.3880, region: 'North America' },
  { name: 'Dallas', country: 'USA', lat: 32.7767, lon: -96.7970, region: 'North America' },
  { name: 'Houston', country: 'USA', lat: 29.7604, lon: -95.3698, region: 'North America' },
  { name: 'Phoenix', country: 'USA', lat: 33.4484, lon: -112.0740, region: 'North America' },
  { name: 'Austin', country: 'USA', lat: 30.2672, lon: -97.7431, region: 'North America' },
  { name: 'Detroit', country: 'USA', lat: 42.3314, lon: -83.0458, region: 'North America' },
  { name: 'Minneapolis', country: 'USA', lat: 44.9778, lon: -93.2650, region: 'North America' },
  { name: 'Las Vegas', country: 'USA', lat: 36.1699, lon: -115.1398, region: 'North America' },
  { name: 'San Diego', country: 'USA', lat: 32.7157, lon: -117.1611, region: 'North America' },
  { name: 'Tampa', country: 'USA', lat: 27.9506, lon: -82.4572, region: 'North America' },
  { name: 'Pittsburgh', country: 'USA', lat: 40.4406, lon: -79.9959, region: 'North America' },
  { name: 'Baltimore', country: 'USA', lat: 39.2904, lon: -76.6122, region: 'North America' },
  { name: 'New Orleans', country: 'USA', lat: 29.9511, lon: -90.0715, region: 'North America' },
  { name: 'Philadelphia', country: 'USA', lat: 39.9526, lon: -75.1652, region: 'North America' },
  { name: 'St Louis', country: 'USA', lat: 38.6270, lon: -90.1994, region: 'North America' },
  { name: 'Buffalo', country: 'USA', lat: 42.8864, lon: -78.8784, region: 'North America' },
  { name: 'Denver', country: 'USA', lat: 39.7392, lon: -104.9903, region: 'North America' },
  { name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207, region: 'North America' },
  { name: 'Montreal', country: 'Canada', lat: 45.5017, lon: -73.5673, region: 'North America' },

  // Europe
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, region: 'Europe' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, region: 'Europe' },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050, region: 'Europe' },
  { name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038, region: 'Europe' },
  { name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964, region: 'Europe' },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041, region: 'Europe' },
  { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lon: 18.0686, region: 'Europe' },
  { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lon: 12.5683, region: 'Europe' },
  { name: 'Oslo', country: 'Norway', lat: 59.9139, lon: 10.7522, region: 'Europe' },
  { name: 'Helsinki', country: 'Finland', lat: 60.1699, lon: 24.9384, region: 'Europe' },
  { name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738, region: 'Europe' },
  { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lon: 8.5417, region: 'Europe' },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lon: 2.1734, region: 'Europe' },
  { name: 'Milan', country: 'Italy', lat: 45.4642, lon: 9.1900, region: 'Europe' },
  { name: 'Munich', country: 'Germany', lat: 48.1351, lon: 11.5820, region: 'Europe' },
  { name: 'Frankfurt', country: 'Germany', lat: 50.1109, lon: 8.6821, region: 'Europe' },
  { name: 'Brussels', country: 'Belgium', lat: 50.8503, lon: 4.3517, region: 'Europe' },
  { name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122, region: 'Europe' },
  { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lon: 14.4378, region: 'Europe' },
  { name: 'Budapest', country: 'Hungary', lat: 47.4979, lon: 19.0402, region: 'Europe' },
  { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784, region: 'Europe' },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6176, region: 'Europe' },
  { name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603, region: 'Europe' },
  { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393, region: 'Europe' },

  // Asia
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, region: 'Asia' },
  { name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737, region: 'Asia' },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074, region: 'Asia' },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780, region: 'Asia' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, region: 'Asia' },
  { name: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lon: 114.1694, region: 'Asia' },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, region: 'Asia' },
  { name: 'Delhi', country: 'India', lat: 28.7041, lon: 77.1025, region: 'Asia' },
  { name: 'Bangalore', country: 'India', lat: 12.9716, lon: 77.5946, region: 'Asia' },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018, region: 'Asia' },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456, region: 'Asia' },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lon: 120.9842, region: 'Asia' },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lon: 101.6869, region: 'Asia' },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lon: 106.6297, region: 'Asia' },
  { name: 'Taipei', country: 'Taiwan', lat: 25.0330, lon: 121.5654, region: 'Asia' },
  { name: 'Osaka', country: 'Japan', lat: 34.6937, lon: 135.5023, region: 'Asia' },
  { name: 'Guangzhou', country: 'China', lat: 23.1291, lon: 113.2644, region: 'Asia' },
  { name: 'Shenzhen', country: 'China', lat: 22.5431, lon: 114.0579, region: 'Asia' },
  { name: 'Chengdu', country: 'China', lat: 30.5728, lon: 104.0668, region: 'Asia' },
  { name: 'Hangzhou', country: 'China', lat: 30.2741, lon: 120.1551, region: 'Asia' },
  { name: 'Nanjing', country: 'China', lat: 32.0603, lon: 118.7969, region: 'Asia' },
  { name: 'Hyderabad', country: 'India', lat: 17.3850, lon: 78.4867, region: 'Asia' },
  { name: 'Chennai', country: 'India', lat: 13.0827, lon: 80.2707, region: 'Asia' },
  { name: 'Pune', country: 'India', lat: 18.5204, lon: 73.8567, region: 'Asia' },
  { name: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639, region: 'Asia' },

  // Middle East
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, region: 'Middle East' },
  { name: 'Tel Aviv', country: 'Israel', lat: 32.0853, lon: 34.7818, region: 'Middle East' },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753, region: 'Middle East' },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lon: 51.5310, region: 'Middle East' },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.3117, lon: 47.4818, region: 'Middle East' },
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.2539, lon: 54.3773, region: 'Middle East' },

  // Africa
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, region: 'Africa' },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792, region: 'Africa' },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473, region: 'Africa' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, region: 'Africa' },
  { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219, region: 'Africa' },
  { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898, region: 'Africa' },
  { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lon: 10.1815, region: 'Africa' },
  { name: 'Accra', country: 'Ghana', lat: 5.6037, lon: -0.1870, region: 'Africa' },
  { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.1450, lon: 40.4897, region: 'Africa' },

  // Oceania
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, region: 'Oceania' },
  { name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631, region: 'Oceania' },
  { name: 'Brisbane', country: 'Australia', lat: -27.4698, lon: 153.0251, region: 'Oceania' },
  { name: 'Perth', country: 'Australia', lat: -31.9505, lon: 115.8605, region: 'Oceania' },
  { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633, region: 'Oceania' },

  // South America
  { name: 'São Paulo', country: 'Brazil', lat: -23.5558, lon: -46.6396, region: 'South America' },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729, region: 'South America' },
  { name: 'Buenos Aires', country: 'Argentina', lat: -34.6118, lon: -58.3960, region: 'South America' },
  { name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428, region: 'South America' },
  { name: 'Bogotá', country: 'Colombia', lat: 4.7110, lon: -74.0721, region: 'South America' },
  { name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693, region: 'South America' },
  { name: 'Caracas', country: 'Venezuela', lat: 10.4806, lon: -66.9036, region: 'South America' },
  { name: 'Quito', country: 'Ecuador', lat: -0.1807, lon: -78.4678, region: 'South America' },
  { name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lon: -56.1645, region: 'South America' }
]

// Lookup a city by name (case-insensitive, trimmed). Returns coords or null.
export function findCityByName(name: string): City | null {
  const normalized = name.trim().toLowerCase()
  return WORLD_CITIES.find(c => c.name.toLowerCase() === normalized) || null
}

// Resolve coordinates for an anchor row: prefer metadata (Mapbox-geocoded), fallback to WORLD_CITIES
export function resolveCityCoords(
  cityName: string,
  metadata?: { lat?: number; lon?: number } | null
): { lat: number; lon: number } | null {
  if (metadata?.lat != null && metadata?.lon != null) return { lat: metadata.lat, lon: metadata.lon }
  const match = findCityByName(cityName)
  if (match) return { lat: match.lat, lon: match.lon }
  return null
}

// Deterministic city selection based on preset and target cities
export function selectCities(targetCities: number, presetName: string = 'Base Case'): City[] {
  // Create a seeded shuffle based on preset name for consistency
  const seed = presetName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Simple seeded random function
  let seedValue = seed
  const seededRandom = () => {
    seedValue = (seedValue * 9301 + 49297) % 233280
    return seedValue / 233280
  }
  
  // Create a shuffled copy of cities based on the seed
  const shuffledCities = [...WORLD_CITIES]
  for (let i = shuffledCities.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[shuffledCities[i], shuffledCities[j]] = [shuffledCities[j], shuffledCities[i]]
  }
  
  // Return the first N cities
  return shuffledCities.slice(0, Math.min(targetCities, WORLD_CITIES.length))
}

// Split cities into production vs validating based on deployment timeline
export function categorizeCities(
  selectedCities: City[],
  citiesPerYear: number,
  rampTime: number,
  currentYear: number = 10
): { production: City[]; validating: City[] } {
  const production: City[] = []
  const validating: City[] = []
  
  let cityIndex = 0
  for (let year = 1; year <= currentYear; year++) {
    const citiesAddedThisYear = Math.min(citiesPerYear, selectedCities.length - cityIndex)
    if (citiesAddedThisYear <= 0) break
    
    const yearsActive = currentYear - year + 1
    const citiesThisYear = selectedCities.slice(cityIndex, cityIndex + citiesAddedThisYear)
    
    if (yearsActive >= rampTime) {
      production.push(...citiesThisYear)
    } else {
      validating.push(...citiesThisYear)
    }
    
    cityIndex += citiesAddedThisYear
  }
  
  return { production, validating }
}

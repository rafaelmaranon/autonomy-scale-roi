'use client'

import { useState, useEffect } from 'react'
import { ROIInputs } from '@/lib/roi-calculator'

interface WorldMapProps {
  inputs: ROIInputs
}

// Global cities with approximate coordinates (normalized to 0-100 for easy scaling)
const GLOBAL_CITIES = [
  { name: 'New York', x: 26, y: 35 },
  { name: 'San Francisco', x: 15, y: 38 },
  { name: 'Los Angeles', x: 17, y: 42 },
  { name: 'Chicago', x: 25, y: 33 },
  { name: 'Toronto', x: 24, y: 30 },
  { name: 'Mexico City', x: 20, y: 50 },
  { name: 'São Paulo', x: 32, y: 70 },
  { name: 'London', x: 49, y: 28 },
  { name: 'Paris', x: 50, y: 30 },
  { name: 'Berlin', x: 52, y: 27 },
  { name: 'Madrid', x: 48, y: 35 },
  { name: 'Rome', x: 52, y: 37 },
  { name: 'Amsterdam', x: 50, y: 26 },
  { name: 'Stockholm', x: 54, y: 22 },
  { name: 'Dubai', x: 58, y: 45 },
  { name: 'Mumbai', x: 65, y: 50 },
  { name: 'Bangalore', x: 66, y: 52 },
  { name: 'Delhi', x: 66, y: 46 },
  { name: 'Singapore', x: 72, y: 58 },
  { name: 'Tokyo', x: 82, y: 40 },
  { name: 'Seoul', x: 80, y: 38 },
  { name: 'Beijing', x: 78, y: 35 },
  { name: 'Shanghai', x: 79, y: 42 },
  { name: 'Hong Kong', x: 77, y: 48 },
  { name: 'Sydney', x: 87, y: 75 },
  { name: 'Melbourne', x: 85, y: 78 },
  { name: 'Johannesburg', x: 54, y: 68 },
  { name: 'Cairo', x: 54, y: 44 },
  { name: 'Lagos', x: 50, y: 55 },
  { name: 'Nairobi', x: 56, y: 58 },
  { name: 'Tel Aviv', x: 55, y: 42 },
  { name: 'Istanbul', x: 54, y: 37 },
  { name: 'Moscow', x: 58, y: 22 },
  { name: 'Warsaw', x: 53, y: 26 },
  { name: 'Vienna', x: 53, y: 30 },
  { name: 'Zurich', x: 51, y: 31 },
  { name: 'Barcelona', x: 49, y: 37 },
  { name: 'Milan', x: 51, y: 34 },
  { name: 'Oslo', x: 52, y: 20 },
  { name: 'Copenhagen', x: 52, y: 23 }
]

interface CityDotProps {
  city: typeof GLOBAL_CITIES[0]
  status: 'production' | 'validating' | 'inactive'
  delay: number
}

function CityDot({ city, status, delay }: CityDotProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (status !== 'inactive') {
      const timer = setTimeout(() => setIsVisible(true), delay * 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [status, delay])

  if (status === 'inactive') return null

  const dotStyle = status === 'production' 
    ? 'bg-blue-500 w-3 h-3' 
    : 'bg-yellow-500 w-2.5 h-2.5'

  return (
    <div
      className={`absolute rounded-full transition-all duration-500 transform ${
        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      } ${dotStyle}`}
      style={{
        left: `${city.x}%`,
        top: `${city.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      title={`${city.name} - ${status === 'production' ? 'Production' : 'Validating'}`}
    />
  )
}

export function WorldMap({ inputs }: WorldMapProps) {
  // Calculate city rollout status
  const getCityStatuses = () => {
    const statuses: ('production' | 'validating' | 'inactive')[] = []
    const currentYear = Math.min(10, Math.ceil(inputs.targetCities / inputs.citiesPerYear))
    
    let cityIndex = 0
    for (let year = 1; year <= currentYear; year++) {
      const citiesAddedThisYear = Math.min(
        inputs.citiesPerYear, 
        inputs.targetCities - (year - 1) * inputs.citiesPerYear
      )
      
      if (citiesAddedThisYear <= 0) break
      
      for (let i = 0; i < citiesAddedThisYear && cityIndex < GLOBAL_CITIES.length; i++) {
        const yearsActive = currentYear - year + 1
        if (yearsActive >= inputs.cityRampTime) {
          statuses[cityIndex] = 'production'
        } else {
          statuses[cityIndex] = 'validating'
        }
        cityIndex++
      }
    }
    
    // Fill remaining cities as inactive
    while (cityIndex < GLOBAL_CITIES.length) {
      statuses[cityIndex] = 'inactive'
      cityIndex++
    }
    
    return statuses
  }

  const cityStatuses = getCityStatuses()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Deployment</h3>
      
      {/* World Map Container */}
      <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
        {/* Simple world map SVG background */}
        <svg
          viewBox="0 0 100 60"
          className="absolute inset-0 w-full h-full opacity-20"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Simplified world continents */}
          {/* North America */}
          <path
            d="M10,20 L25,15 L30,25 L25,40 L15,45 L10,35 Z"
            fill="#9ca3af"
          />
          {/* South America */}
          <path
            d="M25,45 L35,50 L32,75 L28,80 L25,70 Z"
            fill="#9ca3af"
          />
          {/* Europe */}
          <path
            d="M45,15 L55,20 L58,30 L52,35 L45,30 Z"
            fill="#9ca3af"
          />
          {/* Africa */}
          <path
            d="M48,35 L58,40 L60,65 L55,75 L48,70 L45,50 Z"
            fill="#9ca3af"
          />
          {/* Asia */}
          <path
            d="M55,15 L85,20 L90,35 L85,45 L75,50 L65,45 L58,30 Z"
            fill="#9ca3af"
          />
          {/* Australia */}
          <path
            d="M80,70 L90,72 L92,80 L85,82 L78,78 Z"
            fill="#9ca3af"
          />
        </svg>

        {/* City dots */}
        {GLOBAL_CITIES.map((city, index) => (
          <CityDot
            key={city.name}
            city={city}
            status={cityStatuses[index]}
            delay={index}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Production</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Validating</span>
        </div>
      </div>
    </div>
  )
}

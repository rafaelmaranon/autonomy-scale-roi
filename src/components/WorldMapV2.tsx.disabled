'use client'

import { useState, useEffect, useRef } from 'react'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'

interface WorldMapV2Props {
  inputs: ROIInputs
  outputs: ROIOutputs
}

interface CityData {
  name: string
  x: number
  y: number
  country: string
  wikiUrl: string
}

// Global cities with Wikipedia URLs
const GLOBAL_CITIES: CityData[] = [
  { name: 'New York', x: 26, y: 35, country: 'USA', wikiUrl: 'https://en.wikipedia.org/wiki/New_York_City' },
  { name: 'San Francisco', x: 15, y: 38, country: 'USA', wikiUrl: 'https://en.wikipedia.org/wiki/San_Francisco' },
  { name: 'Los Angeles', x: 17, y: 42, country: 'USA', wikiUrl: 'https://en.wikipedia.org/wiki/Los_Angeles' },
  { name: 'Chicago', x: 25, y: 33, country: 'USA', wikiUrl: 'https://en.wikipedia.org/wiki/Chicago' },
  { name: 'Toronto', x: 24, y: 30, country: 'Canada', wikiUrl: 'https://en.wikipedia.org/wiki/Toronto' },
  { name: 'Mexico City', x: 20, y: 50, country: 'Mexico', wikiUrl: 'https://en.wikipedia.org/wiki/Mexico_City' },
  { name: 'São Paulo', x: 32, y: 70, country: 'Brazil', wikiUrl: 'https://en.wikipedia.org/wiki/São_Paulo' },
  { name: 'London', x: 49, y: 28, country: 'UK', wikiUrl: 'https://en.wikipedia.org/wiki/London' },
  { name: 'Paris', x: 50, y: 30, country: 'France', wikiUrl: 'https://en.wikipedia.org/wiki/Paris' },
  { name: 'Berlin', x: 52, y: 27, country: 'Germany', wikiUrl: 'https://en.wikipedia.org/wiki/Berlin' },
  { name: 'Madrid', x: 48, y: 35, country: 'Spain', wikiUrl: 'https://en.wikipedia.org/wiki/Madrid' },
  { name: 'Rome', x: 52, y: 37, country: 'Italy', wikiUrl: 'https://en.wikipedia.org/wiki/Rome' },
  { name: 'Amsterdam', x: 50, y: 26, country: 'Netherlands', wikiUrl: 'https://en.wikipedia.org/wiki/Amsterdam' },
  { name: 'Stockholm', x: 54, y: 22, country: 'Sweden', wikiUrl: 'https://en.wikipedia.org/wiki/Stockholm' },
  { name: 'Dubai', x: 58, y: 45, country: 'UAE', wikiUrl: 'https://en.wikipedia.org/wiki/Dubai' },
  { name: 'Mumbai', x: 65, y: 50, country: 'India', wikiUrl: 'https://en.wikipedia.org/wiki/Mumbai' },
  { name: 'Bangalore', x: 66, y: 52, country: 'India', wikiUrl: 'https://en.wikipedia.org/wiki/Bangalore' },
  { name: 'Delhi', x: 66, y: 46, country: 'India', wikiUrl: 'https://en.wikipedia.org/wiki/Delhi' },
  { name: 'Singapore', x: 72, y: 58, country: 'Singapore', wikiUrl: 'https://en.wikipedia.org/wiki/Singapore' },
  { name: 'Tokyo', x: 82, y: 40, country: 'Japan', wikiUrl: 'https://en.wikipedia.org/wiki/Tokyo' },
  { name: 'Seoul', x: 80, y: 38, country: 'South Korea', wikiUrl: 'https://en.wikipedia.org/wiki/Seoul' },
  { name: 'Beijing', x: 78, y: 35, country: 'China', wikiUrl: 'https://en.wikipedia.org/wiki/Beijing' },
  { name: 'Shanghai', x: 79, y: 42, country: 'China', wikiUrl: 'https://en.wikipedia.org/wiki/Shanghai' },
  { name: 'Hong Kong', x: 77, y: 48, country: 'Hong Kong', wikiUrl: 'https://en.wikipedia.org/wiki/Hong_Kong' },
  { name: 'Sydney', x: 87, y: 75, country: 'Australia', wikiUrl: 'https://en.wikipedia.org/wiki/Sydney' },
  { name: 'Melbourne', x: 85, y: 78, country: 'Australia', wikiUrl: 'https://en.wikipedia.org/wiki/Melbourne' },
  { name: 'Johannesburg', x: 54, y: 68, country: 'South Africa', wikiUrl: 'https://en.wikipedia.org/wiki/Johannesburg' },
  { name: 'Cairo', x: 54, y: 44, country: 'Egypt', wikiUrl: 'https://en.wikipedia.org/wiki/Cairo' },
  { name: 'Lagos', x: 50, y: 55, country: 'Nigeria', wikiUrl: 'https://en.wikipedia.org/wiki/Lagos' },
  { name: 'Nairobi', x: 56, y: 58, country: 'Kenya', wikiUrl: 'https://en.wikipedia.org/wiki/Nairobi' },
  { name: 'Tel Aviv', x: 55, y: 42, country: 'Israel', wikiUrl: 'https://en.wikipedia.org/wiki/Tel_Aviv' },
  { name: 'Istanbul', x: 54, y: 37, country: 'Turkey', wikiUrl: 'https://en.wikipedia.org/wiki/Istanbul' },
  { name: 'Moscow', x: 58, y: 22, country: 'Russia', wikiUrl: 'https://en.wikipedia.org/wiki/Moscow' },
  { name: 'Warsaw', x: 53, y: 26, country: 'Poland', wikiUrl: 'https://en.wikipedia.org/wiki/Warsaw' },
  { name: 'Vienna', x: 53, y: 30, country: 'Austria', wikiUrl: 'https://en.wikipedia.org/wiki/Vienna' },
  { name: 'Zurich', x: 51, y: 31, country: 'Switzerland', wikiUrl: 'https://en.wikipedia.org/wiki/Zurich' },
  { name: 'Barcelona', x: 49, y: 37, country: 'Spain', wikiUrl: 'https://en.wikipedia.org/wiki/Barcelona' },
  { name: 'Milan', x: 51, y: 34, country: 'Italy', wikiUrl: 'https://en.wikipedia.org/wiki/Milan' },
  { name: 'Oslo', x: 52, y: 20, country: 'Norway', wikiUrl: 'https://en.wikipedia.org/wiki/Oslo' },
  { name: 'Copenhagen', x: 52, y: 23, country: 'Denmark', wikiUrl: 'https://en.wikipedia.org/wiki/Copenhagen' }
]

// Industry competitors with their known cities
const INDUSTRY_OVERLAY = {
  waymo: { color: '#34d399', cities: ['San Francisco', 'Los Angeles', 'Phoenix'] },
  tesla: { color: '#f59e0b', cities: ['San Francisco', 'Los Angeles', 'Austin', 'Shanghai'] },
  baidu: { color: '#ef4444', cities: ['Beijing', 'Shanghai', 'Guangzhou'] },
  cruise: { color: '#8b5cf6', cities: ['San Francisco'] }
}

interface CityDotProps {
  city: CityData
  status: 'production' | 'validating' | 'inactive'
  delay: number
  onClick: (city: CityData, status: string) => void
  scale: number
  showIndustry: boolean
}

function CityDot({ city, status, delay, onClick, scale, showIndustry }: CityDotProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [justTransitioned, setJustTransitioned] = useState(false)

  useEffect(() => {
    if (status !== 'inactive') {
      const timer = setTimeout(() => {
        setIsVisible(true)
        if (status === 'production') {
          setJustTransitioned(true)
          setTimeout(() => setJustTransitioned(false), 300)
        }
      }, delay * 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [status, delay])

  if (status === 'inactive' && !showIndustry) return null

  const baseSize = status === 'production' ? 6 : 5
  const dotSize = Math.max(baseSize / scale, 3) // Consistent size while zooming

  const isIndustryCity = Object.values(INDUSTRY_OVERLAY).some(company => 
    company.cities.includes(city.name)
  )

  return (
    <g>
      {/* Industry overlay dots */}
      {showIndustry && isIndustryCity && (
        <>
          {Object.entries(INDUSTRY_OVERLAY).map(([company, data]) => {
            if (!data.cities.includes(city.name)) return null
            return (
              <circle
                key={`${city.name}-${company}`}
                cx={city.x}
                cy={city.y}
                r={dotSize + 2}
                fill={data.color}
                opacity={0.4}
                className="transition-all duration-300"
              />
            )
          })}
        </>
      )}
      
      {/* Main city dot */}
      {status !== 'inactive' && (
        <g>
          {/* Glow effect for production cities */}
          {status === 'production' && (
            <circle
              cx={city.x}
              cy={city.y}
              r={dotSize + 3}
              fill="#3b82f6"
              opacity={0.3}
              className="transition-all duration-500"
              style={{
                filter: 'blur(2px)'
              }}
            />
          )}
          
          {/* Main dot */}
          <circle
            cx={city.x}
            cy={city.y}
            r={dotSize}
            fill={status === 'production' ? '#3b82f6' : '#eab308'}
            className={`cursor-pointer transition-all duration-500 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            } ${justTransitioned ? 'animate-pulse' : ''}`}
            onClick={() => onClick(city, status)}
            style={{
              transform: isVisible ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${city.x}px ${city.y}px`
            }}
          />
        </g>
      )}
    </g>
  )
}

interface CityDetailCardProps {
  city: CityData | null
  status: string
  vehicles: number
  yearsActive: number
  annualMiles: number
  onClose: () => void
  position: { x: number; y: number }
}

function CityDetailCard({ city, status, vehicles, yearsActive, annualMiles, onClose, position }: CityDetailCardProps) {
  if (!city) return null

  return (
    <div
      className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-64"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900">{city.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${
            status === 'production' ? 'text-blue-600' : 'text-yellow-600'
          }`}>
            {status === 'production' ? 'Production' : 'Validating'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Vehicles:</span>
          <span className="font-medium">{vehicles.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Years Active:</span>
          <span className="font-medium">{yearsActive}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Annual Miles:</span>
          <span className="font-medium">{(annualMiles / 1e6).toFixed(1)}M</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <a
          href={city.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Learn more →
        </a>
      </div>
    </div>
  )
}

export function WorldMapV2({ inputs, outputs }: WorldMapV2Props) {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null)
  const [selectedCityStatus, setSelectedCityStatus] = useState<string>('')
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 })
  const [viewMode, setViewMode] = useState<'network' | 'industry'>('network')
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  // Calculate dynamic subtitle metrics
  const year10Data = outputs.yearlyData[9] || outputs.yearlyData[outputs.yearlyData.length - 1]
  const totalCities = Math.min(inputs.targetCities, 10 * inputs.citiesPerYear)
  const totalVehicles = year10Data ? Math.floor(year10Data.totalVehicles) : 0
  const annualMiles = year10Data ? year10Data.yearlyMiles : 0

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
    
    while (cityIndex < GLOBAL_CITIES.length) {
      statuses[cityIndex] = 'inactive'
      cityIndex++
    }
    
    return statuses
  }

  const cityStatuses = getCityStatuses()

  const handleCityClick = (city: CityData, status: string, event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      setSelectedCity(city)
      setSelectedCityStatus(status)
      setCardPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const newScale = Math.max(0.5, Math.min(3, scale + (e.deltaY > 0 ? -0.1 : 0.1)))
    setScale(newScale)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const exportSnapshot = () => {
    // This would implement PNG export functionality
    console.log('Export snapshot functionality would be implemented here')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Projected Global Autonomy Network – Year 10
            </h2>
            <p className="text-gray-600">
              {totalCities} Cities · {totalVehicles.toLocaleString()} Vehicles · {(annualMiles / 1e9).toFixed(1)}B Annual Miles
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('network')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'network' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Your Network
              </button>
              <button
                onClick={() => setViewMode('industry')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'industry' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Industry Comparison
              </button>
            </div>
            
            {/* Export Button */}
            <button
              onClick={exportSnapshot}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Export Network Snapshot
            </button>
          </div>
        </div>

        {/* Industry Legend */}
        {viewMode === 'industry' && (
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-600">Industry:</span>
            {Object.entries(INDUSTRY_OVERLAY).map(([company, data]) => (
              <div key={company} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: data.color }}
                />
                <span className="text-gray-700 capitalize">{company}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* World Map Container */}
      <div className="relative h-96 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 100 60"
          className="absolute inset-0 w-full h-full cursor-move"
          style={{
            background: '#0f172a', // Dark ocean background
            transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* World continents - muted slate gray */}
          <g fill="#475569" opacity={0.8}>
            {/* North America */}
            <path d="M10,20 L25,15 L30,25 L25,40 L15,45 L10,35 Z" />
            {/* South America */}
            <path d="M25,45 L35,50 L32,75 L28,80 L25,70 Z" />
            {/* Europe */}
            <path d="M45,15 L55,20 L58,30 L52,35 L45,30 Z" />
            {/* Africa */}
            <path d="M48,35 L58,40 L60,65 L55,75 L48,70 L45,50 Z" />
            {/* Asia */}
            <path d="M55,15 L85,20 L90,35 L85,45 L75,50 L65,45 L58,30 Z" />
            {/* Australia */}
            <path d="M80,70 L90,72 L92,80 L85,82 L78,78 Z" />
          </g>

          {/* City dots */}
          {GLOBAL_CITIES.map((city, index) => (
            <CityDot
              key={city.name}
              city={city}
              status={cityStatuses[index]}
              delay={index}
              onClick={(city, status) => handleCityClick(city, status, event as any)}
              scale={scale}
              showIndustry={viewMode === 'industry'}
            />
          ))}
        </svg>

        {/* City Detail Card */}
        {selectedCity && (
          <CityDetailCard
            city={selectedCity}
            status={selectedCityStatus}
            vehicles={inputs.vehiclesPerCity}
            yearsActive={Math.min(10, Math.ceil(inputs.targetCities / inputs.citiesPerYear))}
            annualMiles={inputs.vehiclesPerCity * inputs.milesPerVehiclePerYear}
            onClose={() => setSelectedCity(null)}
            position={cardPosition}
          />
        )}
      </div>
    </div>
  )
}

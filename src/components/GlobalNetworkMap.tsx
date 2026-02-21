'use client'

import { useState, useEffect } from 'react'
// @ts-ignore - react-simple-maps doesn't have proper React 19 types yet
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'
import { City, selectCities, categorizeCities } from '@/lib/cities'

interface GlobalNetworkMapProps {
  inputs: ROIInputs
  outputs: ROIOutputs
  selectedPreset: string
}

interface TooltipData {
  city: City
  status: 'production' | 'validating'
  vehicles: number
  yearEntered: number
}

export function GlobalNetworkMap({ inputs, outputs, selectedPreset }: GlobalNetworkMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [viewMode, setViewMode] = useState<'network' | 'industry'>('network')

  // Calculate dynamic subtitle metrics
  const year10Data = outputs.yearlyData[9] || outputs.yearlyData[outputs.yearlyData.length - 1]
  const totalCities = Math.min(inputs.targetCities, 10 * inputs.citiesPerYear)
  const totalVehicles = year10Data ? Math.floor(year10Data.totalVehicles) : 0
  const annualMiles = year10Data ? year10Data.yearlyMiles : 0

  // Select and categorize cities
  const selectedCities = selectCities(totalCities, selectedPreset)
  const { production, validating } = categorizeCities(
    selectedCities,
    inputs.citiesPerYear,
    inputs.cityRampTime,
    10 // Year 10
  )

  const handleMarkerHover = (city: City, status: 'production' | 'validating', event: any) => {
    const yearEntered = status === 'production' 
      ? Math.max(1, 10 - inputs.cityRampTime) 
      : Math.max(1, 10 - inputs.cityRampTime + 1)
    
    setTooltip({
      city,
      status,
      vehicles: inputs.vehiclesPerCity,
      yearEntered
    })
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }

  const handleMarkerLeave = () => {
    setTooltip(null)
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
          
          {/* View Mode Toggle - Small and Clean */}
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
        </div>
      </div>

      {/* Real World Map */}
      <div className="relative" style={{ height: '480px' }}>
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{
            scale: 140,
            center: [0, 0]
          }}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <ZoomableGroup>
            <Geographies geography="/maps/world-110m.json">
              {({ geographies }: any) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#e5e7eb"
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#e5e7eb' },
                      pressed: { outline: 'none', fill: '#e5e7eb' }
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Production Cities - Blue with Glow */}
            {production.map((city) => (
              <Marker
                key={`production-${city.name}`}
                coordinates={[city.lon, city.lat]}
                onMouseEnter={(event: any) => handleMarkerHover(city, 'production', event)}
                onMouseLeave={handleMarkerLeave}
              >
                <g>
                  {/* Glow effect */}
                  <circle
                    r={8}
                    fill="#3b82f6"
                    opacity={0.3}
                    style={{ filter: 'blur(2px)' }}
                  />
                  {/* Main dot */}
                  <circle
                    r={4}
                    fill="#3b82f6"
                    className="cursor-pointer transition-all duration-200 hover:r-5"
                  />
                </g>
              </Marker>
            ))}

            {/* Validating Cities - Yellow, Crisp */}
            {validating.map((city) => (
              <Marker
                key={`validating-${city.name}`}
                coordinates={[city.lon, city.lat]}
                onMouseEnter={(event: any) => handleMarkerHover(city, 'validating', event)}
                onMouseLeave={handleMarkerLeave}
              >
                <circle
                  r={3.5}
                  fill="#eab308"
                  className="cursor-pointer transition-all duration-200 hover:r-4"
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* Minimal Legend - Bottom Left */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full bg-blue-500"
                style={{ filter: 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.5))' }}
              />
              <span className="text-gray-700">Production</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-700">Validating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="min-w-48">
            <h3 className="font-semibold text-gray-900 mb-2">{tooltip.city.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  tooltip.status === 'production' ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {tooltip.status === 'production' ? 'Production' : 'Validating'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicles:</span>
                <span className="font-medium">{tooltip.vehicles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year Entered:</span>
                <span className="font-medium">{tooltip.yearEntered}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

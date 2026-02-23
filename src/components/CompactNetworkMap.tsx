'use client'

import { useState, useRef } from 'react'
// @ts-ignore - react-simple-maps doesn't have proper React 19 types yet
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
// lucide-react icons removed - zoom controls no longer used
import { SimInputs, SimOutputs, SimYearData } from '@/lib/sim-types'
import { City, selectCities, categorizeCities } from '@/lib/cities'

interface CompactNetworkMapProps {
  inputs: SimInputs
  outputs: SimOutputs
  selectedPreset: string
  yearData: SimYearData
  onHover?: (yearIndex: number) => void
  onMouseLeave?: () => void
}

interface TooltipData {
  city: City
  status: 'production' | 'validating'
  vehicles: number
  yearEntered: number
}

export function CompactNetworkMap({ inputs, outputs, selectedPreset, yearData, onHover, onMouseLeave }: CompactNetworkMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 0])
  const mapRef = useRef<any>(null)

  // Calculate cities based on current year data
  const currentYear = yearData.year
  const yearsActive = currentYear - inputs.startYear
  const totalCities = Math.min(inputs.citiesPerYear * yearsActive, inputs.citiesPerYear * inputs.yearsToSimulate)
  const selectedCities = selectCities(totalCities, selectedPreset)
  const { production, validating } = categorizeCities(
    selectedCities,
    inputs.citiesPerYear,
    inputs.rampTimePerCity,
    yearsActive
  )

  const handleMarkerHover = (city: City, status: 'production' | 'validating', event: any) => {
    const yearEntered = status === 'production' 
      ? Math.max(1, 10 - inputs.rampTimePerCity) 
      : Math.max(1, 10 - inputs.rampTimePerCity + 1)
    
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 4))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setCenter([0, 0])
  }

  return (
    <div className="relative w-full h-full">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button onClick={handleZoomIn} className="w-7 h-7 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-sm font-bold shadow-sm">+</button>
        <button onClick={handleZoomOut} className="w-7 h-7 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-sm font-bold shadow-sm">−</button>
      </div>
      {/* Map */}
      <div 
        className="w-full h-full overflow-hidden"
        onMouseMove={(e) => {
          if (onHover && outputs.yearlyData.length > 0) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const progress = Math.max(0, Math.min(1, x / rect.width))
            const yearIndex = Math.floor(progress * (outputs.yearlyData.length - 1))
            onHover(yearIndex)
          }
        }}
        onMouseLeave={() => {
          if (onMouseLeave) {
            onMouseLeave()
          }
        }}
      >
        <ComposableMap
          ref={mapRef}
          projection="geoNaturalEarth1"
          projectionConfig={{
            scale: 140,
            center: [0, 0] as [number, number]
          }}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates, zoom: z }: any) => { setCenter(coordinates); setZoom(z); }}>
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

            {/* Production Cities */}
            {production.map((city) => (
              <Marker
                key={`production-${city.name}`}
                coordinates={[city.lon, city.lat]}
                onMouseEnter={(event: any) => handleMarkerHover(city, 'production', event)}
                onMouseLeave={handleMarkerLeave}
              >
                <g>
                  <circle
                    r={6}
                    fill="#3b82f6"
                    opacity={0.3}
                    style={{ filter: 'blur(1px)' }}
                  />
                  <circle
                    r={3}
                    fill="#3b82f6"
                    className="cursor-pointer transition-all duration-200"
                  />
                </g>
              </Marker>
            ))}

            {/* Validating Cities */}
            {validating.map((city) => (
              <Marker
                key={`validating-${city.name}`}
                coordinates={[city.lon, city.lat]}
                onMouseEnter={(event: any) => handleMarkerHover(city, 'validating', event)}
                onMouseLeave={handleMarkerLeave}
              >
                <circle
                  r={2.5}
                  fill="#eab308"
                  className="cursor-pointer transition-all duration-200"
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Compact Legend */}
      <div className="flex items-center justify-center space-x-3 mt-2 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" style={{ filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))' }} />
          <span>Production</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Validating</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 pointer-events-none text-xs"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="min-w-32">
            <h3 className="font-semibold text-gray-900 mb-1">{tooltip.city.name}</h3>
            <div className="space-y-0.5">
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

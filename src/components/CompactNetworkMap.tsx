'use client'

import { useState, useRef } from 'react'
// @ts-ignore - react-simple-maps doesn't have proper React 19 types yet
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'
import { City, selectCities, categorizeCities } from '@/lib/cities'

interface CompactNetworkMapProps {
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

export function CompactNetworkMap({ inputs, outputs, selectedPreset }: CompactNetworkMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 0])
  const mapRef = useRef<any>(null)

  // Calculate cities
  const year10Data = outputs.yearlyData[9] || outputs.yearlyData[outputs.yearlyData.length - 1]
  const totalCities = Math.min(inputs.targetCities, 10 * inputs.citiesPerYear)
  const selectedCities = selectCities(totalCities, selectedPreset)
  const { production, validating } = categorizeCities(
    selectedCities,
    inputs.citiesPerYear,
    inputs.cityRampTime,
    10
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
    <div className="bg-white rounded-lg border border-gray-200 p-3 relative">
      {/* Zoom Controls */}
      <div className="absolute top-5 right-5 z-10 flex flex-col space-y-1">
        <button
          onClick={handleZoomIn}
          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={12} className="text-gray-600" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={12} className="text-gray-600" />
        </button>
        <button
          onClick={handleReset}
          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Reset View"
        >
          <RotateCcw size={12} className="text-gray-600" />
        </button>
      </div>

      {/* Map */}
      <div className="h-64 overflow-hidden rounded">
        <ComposableMap
          ref={mapRef}
          projection="geoNaturalEarth1"
          projectionConfig={{
            scale: 140 * zoom,
            center: center
          }}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <ZoomableGroup zoom={zoom} center={center}>
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

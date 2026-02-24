'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
// @ts-ignore - react-simple-maps doesn't have proper React 19 types yet
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { SimInputs, SimOutputs, SimYearData } from '@/lib/sim-types'
import { City, selectCities, categorizeCities, resolveCityCoords } from '@/lib/cities'
import { HistoricalAnchorRow } from '@/lib/timeline-merger'

interface CompactNetworkMapProps {
  inputs: SimInputs
  outputs: SimOutputs
  selectedPreset: string
  yearData: SimYearData
  bindingCities?: HistoricalAnchorRow[]
  pendingCities?: HistoricalAnchorRow[]
  annotatedCities?: HistoricalAnchorRow[]
  requestedCities?: HistoricalAnchorRow[]
  onHover?: (yearIndex: number) => void
  onMouseLeave?: () => void
}

interface ResolvedCity {
  name: string
  lat: number
  lon: number
  anchor: HistoricalAnchorRow
}

type CityStatus = 'anchored' | 'pilot' | 'pending' | 'requested' | 'production' | 'validating'

const PRIORITY_ORDER: CityStatus[] = ['anchored', 'pilot', 'pending', 'requested', 'production', 'validating']

interface RenderableCity {
  name: string
  lat: number
  lon: number
  status: CityStatus
  source?: HistoricalAnchorRow
}

interface TooltipData {
  name: string
  status: CityStatus
  vehicles?: number
  source?: HistoricalAnchorRow
}

const STATUS_COLORS: Record<CityStatus, string> = {
  anchored: '#3b82f6',
  pilot: '#8b5cf6',
  pending: '#f59e0b',
  requested: '#10b981',
  production: '#94a3b8',
  validating: '#cbd5e1',
}

const STATUS_LABELS: Record<CityStatus, string> = {
  anchored: 'Active',
  pilot: 'Testing',
  pending: 'Pending',
  requested: 'Requested',
  production: 'Projected',
  validating: 'Projected',
}

const STATUS_DESCRIPTIONS: Record<CityStatus, string> = {
  anchored: 'Autonomous public service is live.',
  pilot: 'Testing / limited rollout / waitlist / announced. Not full service yet.',
  pending: 'Community submitted. Not reviewed yet.',
  requested: 'Community requested via Insights.',
  production: 'Model forecast (simulation).',
  validating: 'Model forecast (simulation).',
}

function resolveAnchors(rows: HistoricalAnchorRow[], currentYear: number): ResolvedCity[] {
  const resolved: ResolvedCity[] = []
  for (const a of rows) {
    if (!a.city || a.year > currentYear) continue
    const coords = resolveCityCoords(a.city, a.metadata as any)
    if (coords) {
      resolved.push({ name: a.city, lat: coords.lat, lon: coords.lon, anchor: a })
    }
  }
  // Dedupe by city name (keep latest year)
  const byName = new Map<string, ResolvedCity>()
  for (const c of resolved) {
    const key = c.name.toLowerCase()
    const existing = byName.get(key)
    if (!existing || c.anchor.year > existing.anchor.year) byName.set(key, c)
  }
  return [...byName.values()]
}

export function CompactNetworkMap({ inputs, outputs, selectedPreset, yearData, bindingCities = [], pendingCities = [], annotatedCities = [], requestedCities = [], onHover, onMouseLeave }: CompactNetworkMapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipPinned, setTooltipPinned] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 0])
  const [showDebug, setShowDebug] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    setIsTouch(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const currentYear = yearData.year

  // Resolve DB city anchors → coords
  const anchoredCities = useMemo(() => resolveAnchors(bindingCities, currentYear), [bindingCities, currentYear])
  const pilotCities = useMemo(() => resolveAnchors(annotatedCities, currentYear), [annotatedCities, currentYear])

  // Resolve requested cities from metadata coords (not WORLD_CITIES)
  const requestedResolved = useMemo<ResolvedCity[]>(() => {
    const resolved: ResolvedCity[] = []
    for (const a of requestedCities) {
      if (!a.city) continue
      const meta = a.metadata as { lat?: number; lon?: number } | undefined
      if (meta?.lat != null && meta?.lon != null) {
        resolved.push({ name: a.city, lat: meta.lat, lon: meta.lon, anchor: a })
      }
    }
    return resolved
  }, [requestedCities])

  // Build unified, deduped render list with priority: anchored > pilot > requested > projected
  const allDbNames = useMemo(() => {
    const names = new Set<string>()
    for (const c of anchoredCities) names.add(c.name.toLowerCase())
    for (const c of pilotCities) names.add(c.name.toLowerCase())
    for (const c of requestedResolved) names.add(c.name.toLowerCase())
    return names
  }, [anchoredCities, pilotCities, requestedResolved])

  const { projectedProduction, projectedValidating } = useMemo(() => {
    const yearsActive = currentYear - inputs.startYear
    const totalCities = Math.min(inputs.citiesPerYear * yearsActive, inputs.citiesPerYear * inputs.yearsToSimulate)
    const simCitiesNeeded = Math.max(0, totalCities - anchoredCities.length)

    if (simCitiesNeeded <= 0) return { projectedProduction: [] as City[], projectedValidating: [] as City[] }

    const allSimCities = selectCities(totalCities + anchoredCities.length + 20, selectedPreset)
    const available = allSimCities.filter(c => !allDbNames.has(c.name.toLowerCase()))
    const picked = available.slice(0, simCitiesNeeded)

    const { production, validating } = categorizeCities(
      picked,
      inputs.citiesPerYear,
      inputs.rampTimePerCity,
      yearsActive
    )
    return { projectedProduction: production, projectedValidating: validating }
  }, [currentYear, inputs, selectedPreset, anchoredCities.length, allDbNames])

  // Dedup: each city renders only at its highest priority
  const renderCities = useMemo<RenderableCity[]>(() => {
    const seen = new Map<string, RenderableCity>()

    const tryAdd = (name: string, lat: number, lon: number, status: CityStatus, source?: HistoricalAnchorRow) => {
      const key = name.toLowerCase()
      const existing = seen.get(key)
      if (!existing) {
        seen.set(key, { name, lat, lon, status, source })
      } else {
        const existingPri = PRIORITY_ORDER.indexOf(existing.status)
        const newPri = PRIORITY_ORDER.indexOf(status)
        if (newPri < existingPri) {
          seen.set(key, { name, lat, lon, status, source })
        }
      }
    }

    for (const c of anchoredCities) tryAdd(c.name, c.lat, c.lon, 'anchored', c.anchor)
    for (const c of pilotCities) tryAdd(c.name, c.lat, c.lon, 'pilot', c.anchor)
    for (const c of requestedResolved) tryAdd(c.name, c.lat, c.lon, 'requested', c.anchor)
    for (const c of projectedProduction) tryAdd(c.name, c.lat, c.lon, 'production')
    for (const c of projectedValidating) tryAdd(c.name, c.lat, c.lon, 'validating')

    return [...seen.values()]
  }, [anchoredCities, pilotCities, requestedResolved, projectedProduction, projectedValidating])

  const handleMarkerHover = (name: string, status: CityStatus, source: HistoricalAnchorRow | undefined, event: any) => {
    if (tooltipPinned) return
    setTooltip({ name, status, vehicles: inputs.vehiclesPerCity, source })
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }

  const handleMarkerLeave = () => {
    if (tooltipPinned) return
    setTooltip(null)
  }

  // Compute smart tooltip position that stays within viewport
  const computeTooltipPosition = (x: number, y: number) => {
    const pad = 12
    const tooltipW = 220
    const tooltipH = 140
    let left = x + 10
    let top = y - 10
    // Flip right → left if overflow
    if (left + tooltipW > window.innerWidth - pad) left = x - tooltipW - 10
    // Flip above → below if overflow
    if (top - tooltipH < pad) top = y + 20
    return { x: Math.max(pad, left), y: Math.max(pad + tooltipH, top) }
  }

  const handleMarkerClick = (name: string, status: CityStatus, source?: HistoricalAnchorRow, event?: any) => {
    if (isTouch) {
      // Mobile: tap → show sticky tooltip, do NOT navigate
      setTooltip({ name, status, vehicles: inputs.vehiclesPerCity, source })
      if (event) setTooltipPosition(computeTooltipPosition(event.clientX ?? event.pageX, event.clientY ?? event.pageY))
      setTooltipPinned(true)
    } else {
      // Desktop: click → open source directly
      if (source?.source_url) {
        window.open(source.source_url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const dismissTooltip = () => {
    setTooltip(null)
    setTooltipPinned(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 14))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  return (
    <div className="relative w-full h-full">
      {/* Zoom + Debug Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        <button onClick={handleZoomIn} className="w-7 h-7 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-sm font-bold shadow-sm">+</button>
        <button onClick={handleZoomOut} className="w-7 h-7 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-sm font-bold shadow-sm">−</button>
        <button onClick={() => setShowDebug(d => !d)} className={`w-7 h-7 border rounded text-[10px] font-bold shadow-sm ${showDebug ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-50'}`}>D</button>
      </div>

      {/* Debug Overlay */}
      {showDebug && (
        <div className="absolute top-2 left-2 z-10 bg-white/90 border border-gray-200 rounded-lg shadow-sm p-2 text-[10px] font-mono leading-relaxed">
          <div className="font-bold text-gray-700 mb-1">City Debug ({currentYear})</div>
          <div className="text-blue-600">Anchored: {anchoredCities.length} {anchoredCities.length > 0 && `(${anchoredCities.map(c => c.name).join(', ')})`}</div>
          <div className="text-purple-600">Pilot: {pilotCities.length} {pilotCities.length > 0 && `(${pilotCities.map(c => c.name).join(', ')})`}</div>
          <div className="text-emerald-600">Requested: {requestedResolved.length} {requestedResolved.length > 0 && `(${requestedResolved.map(c => c.name).join(', ')})`}</div>
          <div className="text-gray-500">Projected: {projectedProduction.length + projectedValidating.length} (prod: {projectedProduction.length}, ramp: {projectedValidating.length})</div>
          <div className="text-gray-400 mt-1">DB rows: bind={bindingCities.length} ann={annotatedCities.length} req={requestedCities.length}</div>
        </div>
      )}
      {/* Map */}
      <div 
        className="w-full h-full overflow-hidden"
        onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
          if (onHover && outputs.yearlyData.length > 0) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const progress = Math.max(0, Math.min(1, x / rect.width))
            const yearIndex = Math.floor(progress * (outputs.yearlyData.length - 1))
            onHover(yearIndex)
          }
        }}
        onMouseLeave={() => {
          if (onMouseLeave) onMouseLeave()
        }}
      >
        {/* @ts-ignore react-simple-maps type compat */}
        <ComposableMap
          ref={mapRef}
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 140, center: [0, 0] as [number, number] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={zoom} center={center} maxZoom={14} onMoveEnd={({ coordinates, zoom: z }: any) => { setCenter(coordinates); setZoom(z); }}>
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

            {/* City markers — unified, deduped by priority */}
            {renderCities.map((c) => (
              <Marker
                key={`city-${c.name}`}
                coordinates={[c.lon, c.lat]}
                onMouseEnter={(event: any) => handleMarkerHover(c.name, c.status, c.source, event)}
                onMouseLeave={handleMarkerLeave}
                onClick={(event: any) => handleMarkerClick(c.name, c.status, c.source, event)}
              >
                {(() => {
                  const s = Math.max(0.5, 1 / Math.sqrt(zoom))
                  if (c.status === 'anchored') return (
                    <g>
                      <circle r={7 * s} fill="#3b82f6" opacity={0.25} style={{ filter: 'blur(1px)' }} />
                      <circle r={4 * s} fill="#3b82f6" stroke="white" strokeWidth={1.5 * s} className="cursor-pointer" />
                    </g>
                  )
                  if (c.status === 'pilot') return (
                    <circle r={4 * s} fill="none" stroke="#8b5cf6" strokeWidth={1.5 * s} className="cursor-pointer" />
                  )
                  if (c.status === 'requested') return (
                    <g>
                      {/* Invisible larger hit target for mobile tapping */}
                      <circle r={12 * s} fill="transparent" className="cursor-pointer" />
                      <circle r={4.5 * s} fill="#10b981" opacity={0.15} />
                      <circle r={4 * s} fill="none" stroke="#10b981" strokeWidth={1.8 * s} className="cursor-pointer" />
                    </g>
                  )
                  if (c.status === 'production') return (
                    <g>
                      <circle r={5 * s} fill="#94a3b8" opacity={0.2} style={{ filter: 'blur(1px)' }} />
                      <circle r={2.5 * s} fill="#94a3b8" className="cursor-pointer" />
                    </g>
                  )
                  return null
                })()}
                {c.status === 'validating' && (
                  <circle r={2} fill="#cbd5e1" className="cursor-pointer" />
                )}
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend — always visible, with hover descriptions */}
      <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
        <div className="relative group flex items-center space-x-1 cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-blue-500" style={{ filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))' }} />
          <span>Active ({anchoredCities.length})</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Autonomous public service is live.
          </div>
        </div>
        <div className="relative group flex items-center space-x-1 cursor-pointer">
          <div className="w-2 h-2 rounded-full border border-purple-500" />
          <span>Testing ({pilotCities.length})</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Testing / limited rollout / waitlist / announced.
          </div>
        </div>
        <div className="relative group flex items-center space-x-1 cursor-pointer">
          <div className="w-2 h-2 rounded-full border border-emerald-500" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }} />
          <span>Requested ({requestedResolved.length})</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Community requested via Insights.
          </div>
        </div>
        <div className="relative group flex items-center space-x-1 cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Projected ({projectedProduction.length + projectedValidating.length})</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Model forecast (simulation).
          </div>
        </div>
      </div>

      {/* Tooltip — desktop: read-only hover; mobile: sticky with Open source button */}
      {tooltip && (
        <>
          {/* Backdrop to dismiss pinned tooltip on mobile */}
          {tooltipPinned && (
            <div className="fixed inset-0 z-40" onClick={dismissTooltip} />
          )}
          <div
            className={`fixed bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 text-xs ${tooltipPinned ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translateY(-100%)',
              maxWidth: 'min(90vw, 260px)',
            }}
          >
            <div className="min-w-32">
              <h3 className="font-semibold text-gray-900 mb-1">{tooltip.name}</h3>
              <div className="space-y-0.5">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium" style={{ color: STATUS_COLORS[tooltip.status] }}>
                    {STATUS_LABELS[tooltip.status]}{tooltip.status === 'requested' && ' (+1)'}
                  </span>
                </div>
                {tooltip.source && (
                  <>
                    {(tooltip.source.source_title || tooltip.source.source_publisher) && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Source:</span>
                        <span className="font-medium text-gray-900">
                          {tooltip.source.source_title || tooltip.source.source_publisher}
                          {tooltip.source.source_url && !tooltipPinned && <span className="text-[9px] text-blue-500 ml-0.5">↗</span>}
                        </span>
                      </div>
                    )}
                    {tooltip.source.source_date && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Date:</span>
                        <span className="text-gray-700">{tooltip.source.source_date}</span>
                      </div>
                    )}
                    {tooltip.source.contributor_name && tooltip.source.show_contributor && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">By:</span>
                        <span className="text-gray-700">{tooltip.source.contributor_name}</span>
                      </div>
                    )}
                    {tooltipPinned && tooltip.source.source_url && (
                      <a
                        href={tooltip.source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 flex items-center justify-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-[11px] font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open source ↗
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

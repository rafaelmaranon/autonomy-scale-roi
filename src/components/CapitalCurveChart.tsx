'use client'

import { useRef, useCallback, useMemo } from 'react'
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SimYearData } from '@/lib/sim-types'
import { HistoricalAnchorRow, getMetricsForView, getLastAnchorYear, formatSmartNumber } from '@/lib/timeline-merger'

// Re-export for backward compat
export type { HistoricalAnchorRow } from '@/lib/timeline-merger'

// Chart left/right margins must match the margin prop on LineChart
const CHART_MARGIN_LEFT = 64 // left margin (8) + YAxis width (~56)
const CHART_MARGIN_RIGHT = 16

interface CapitalCurveChartProps {
  data: SimYearData[]
  chartView?: string
  activeIndex?: number
  bindingAnchors?: HistoricalAnchorRow[]
  pendingPoints?: HistoricalAnchorRow[]
  annotations?: HistoricalAnchorRow[]
  onHover?: (index: number) => void
  onMouseLeave?: () => void
}

function openSource(row?: HistoricalAnchorRow) {
  if (row?.source_url) {
    window.open(row.source_url, '_blank', 'noopener,noreferrer')
  }
}

// Custom tooltip for overlay dots — read-only (click dot to open source)
function OverlayTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]?.payload?._overlay) return null
  const d = payload[0].payload._overlay as HistoricalAnchorRow
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs max-w-[220px] pointer-events-none">
      <div className="font-bold text-gray-900">{d.source_title || d.metric}</div>
      {d.source_publisher && <div className="text-gray-500">{d.source_publisher} · {d.source_date}</div>}
      <div className="font-medium mt-1">{formatSmartNumber(d.value)} {d.unit}</div>
      {d.contributor_name && d.show_contributor && (
        <div className="text-gray-400 mt-1">by {d.contributor_name}</div>
      )}
      {d.source_url && <div className="text-blue-500 mt-1">Click dot to open source ↗</div>}
    </div>
  )
}

export function CapitalCurveChart({ data, chartView = 'netCash', activeIndex, bindingAnchors = [], pendingPoints = [], annotations = [], onHover, onMouseLeave }: CapitalCurveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const isOverStrip = useRef(false)

  // Map a clientX position to a data index
  const clientXToIndex = useCallback((clientX: number): number => {
    if (!chartRef.current || data.length === 0) return 0
    const rect = chartRef.current.getBoundingClientRect()
    const plotLeft = rect.left + CHART_MARGIN_LEFT
    const plotRight = rect.right - CHART_MARGIN_RIGHT
    const plotWidth = plotRight - plotLeft
    const normalized = Math.max(0, Math.min(1, (clientX - plotLeft) / plotWidth))
    return Math.round(normalized * (data.length - 1))
  }, [data.length])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (onHover && !isOverStrip.current) onHover(clientXToIndex(e.clientX))
  }, [onHover, clientXToIndex])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (onHover && e.touches.length > 0) {
      e.preventDefault()
      onHover(clientXToIndex(e.touches[0].clientX))
    }
  }, [onHover, clientXToIndex])

  // Mouse leave → reset to final year. Touch end → sticky (do nothing).
  const handleMouseLeave = useCallback(() => {
    if (onMouseLeave) onMouseLeave()
  }, [onMouseLeave])

  // Find break-even point (only for Net Cash view)
  const breakEvenPoint = chartView === 'netCash' ? data.find(d => d.cumulativeNetCash >= 0) : null
  
  // Get data field and formatting based on chart view
  const getChartConfig = () => {
    switch (chartView) {
      case 'paidTrips':
        return { 
          dataKey: 'paidTripsPerWeek', 
          color: '#3b82f6',
          unit: 'trips/week',
          formatValue: (value: number) => `${formatSmartNumber(value)} trips/week`,
          yAxisDomain: [0, 'dataMax']
        }
      case 'fleetSize':
        return { 
          dataKey: 'vehiclesProduction', 
          color: '#10b981',
          unit: 'vehicles',
          formatValue: (value: number) => `${formatSmartNumber(value)} vehicles`,
          yAxisDomain: [0, 'dataMax']
        }
      case 'productionMiles':
        return { 
          dataKey: 'productionMiles', 
          color: '#8b5cf6',
          unit: 'miles/year',
          formatValue: (value: number) => `${formatSmartNumber(value)} miles/year`,
          yAxisDomain: [0, 'dataMax']
        }
      case 'validationMiles':
        return { 
          dataKey: 'validationMiles', 
          color: '#f59e0b',
          unit: 'miles/year',
          formatValue: (value: number) => `${formatSmartNumber(value)} miles/year`,
          yAxisDomain: [0, 'dataMax']
        }
      default: // netCash
        return { 
          dataKey: 'cumulativeNetCash', 
          color: '#3b82f6',
          unit: '',
          formatValue: (value: number) => `$${formatSmartNumber(value)}`,
          yAxisDomain: [-100e9, 150e9]
        }
    }
  }
  
  const chartConfig = getChartConfig()

  // Filter overlays for this chart view
  const viewMetrics = getMetricsForView(chartView)
  const lastAnchorYear = getLastAnchorYear(bindingAnchors, chartView)
  const viewBindingAnchors = bindingAnchors.filter(a => viewMetrics.includes(a.metric))

  // Build chart data with historical/forecast split + overlay scatter points
  const { chartData, pendingScatter, annotationScatter } = useMemo(() => {
    const cd = data.map(d => {
      const val = (d as any)[chartConfig.dataKey]
      const source = (d as any)._sources?.[chartConfig.dataKey] || 'simulated'
      const isHistorical = lastAnchorYear !== null && d.year <= lastAnchorYear
      
      return {
        ...d,
        _historicalValue: isHistorical ? val : undefined,
        _forecastValue: (!lastAnchorYear || d.year >= lastAnchorYear) ? val : undefined,
        _source: source,
        _isAnchor: source === 'anchor',
      }
    })

    // Build scatter data for pending points and annotations
    const pScatter = pendingPoints
      .filter(a => viewMetrics.includes(a.metric))
      .map(a => ({ year: a.year, _overlayValue: Number(a.value), _overlay: a }))

    const aScatter = annotations
      .filter(a => viewMetrics.includes(a.metric))
      .map(a => ({ year: a.year, _overlayValue: Number(a.value), _overlay: a }))

    return { chartData: cd, pendingScatter: pScatter, annotationScatter: aScatter }
  }, [data, chartConfig.dataKey, lastAnchorYear, pendingPoints, annotations, viewMetrics])

  // Active data point (driven by parent via activeIndex)
  const activeData = activeIndex != null ? chartData[activeIndex] : null

  const firstYear = data[0]?.year
  const lastYear = data[data.length - 1]?.year

  return (
    <div
      ref={chartRef}
      className="h-full relative select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
    >
      {/* Value strip — shows active year + value + source info */}
      {activeData && (() => {
        const source = activeData._source
        const anchor = viewBindingAnchors.find(a => a.year === activeData.year)
        const value = (activeData as any)[chartConfig.dataKey]
        return (
          <div
            className="absolute top-0 left-16 right-4 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs z-10 py-1"
            onMouseEnter={() => { isOverStrip.current = true }}
            onMouseLeave={() => { isOverStrip.current = false }}
          >
            <span className="font-medium text-gray-900 pointer-events-none whitespace-nowrap">{activeData.year}</span>
            <span className="text-gray-400 pointer-events-none">|</span>
            <span className="font-bold text-gray-900 pointer-events-none whitespace-nowrap">{chartConfig.formatValue(value)}</span>
            {source === 'anchor' && anchor && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-emerald-600 pointer-events-none">· Sourced</span>
                <a
                  href={anchor.source_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-800 underline truncate max-w-[140px] md:max-w-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {anchor.source_publisher} ↗
                </a>
              </span>
            )}
            {source === 'simulated' && (
              <span className="text-gray-400 pointer-events-none whitespace-nowrap">· Forecast</span>
            )}
          </div>
        )
      })()}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 16, left: 8, bottom: 4 }}
        >
          <CartesianGrid vertical={false} stroke="#f3f4f6" strokeWidth={0.5} />
          <XAxis 
            dataKey="year" 
            type="number"
            domain={[firstYear, lastYear]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => value.toString()}
            interval={'preserveStartEnd'}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            width={56}
            domain={chartConfig.yAxisDomain as any}
            allowDecimals={false}
            tickCount={6}
            tickFormatter={(value) => {
              if (chartView === 'netCash') {
                return `$${formatSmartNumber(value)}`
              }
              return formatSmartNumber(value)
            }}
          />
          <Tooltip content={<OverlayTooltip />} cursor={false} isAnimationActive={false} />
          
          {/* Reference lines - only for Net Cash view */}
          {chartView === 'netCash' && (
            <>
              {/* Zero baseline - break-even line */}
              <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="2 2" />
              {/* Break-even marker */}
              {breakEvenPoint && (
                <ReferenceLine x={breakEvenPoint.year} stroke="#059669" strokeWidth={2} strokeDasharray="4 4" />
              )}
            </>
          )}

          {/* Last anchor year divider — boundary between history and forecast */}
          {lastAnchorYear && (
            <ReferenceLine x={lastAnchorYear} stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Last sourced', position: 'top', fontSize: 10, fill: '#9ca3af' }} />
          )}
          
          {/* Active year vertical indicator */}
          {activeData && (
            <ReferenceLine x={activeData.year} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {/* Historical line — solid, with clickable dots at anchor points */}
          {lastAnchorYear && (
            <Line 
              type="monotone" 
              dataKey="_historicalValue"
              stroke={chartConfig.color}
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload?._isAnchor && cx != null && cy != null) {
                  const anchor = viewBindingAnchors.find((a: HistoricalAnchorRow) => a.year === payload.year)
                  return (
                    <circle
                      key={`adot-${payload.year}`}
                      cx={cx} cy={cy} r={4}
                      fill={chartConfig.color} stroke="white" strokeWidth={2}
                      style={{ cursor: anchor?.source_url ? 'pointer' : 'default' }}
                      onClick={() => openSource(anchor)}
                    />
                  )
                }
                return <circle key={`ndot-${payload?.year}`} cx={cx} cy={cy} r={0} fill="transparent" />
              }}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}

          {/* Forecast line — dashed */}
          <Line 
            type="monotone" 
            dataKey={lastAnchorYear ? '_forecastValue' : chartConfig.dataKey}
            stroke={chartConfig.color}
            strokeWidth={2.5}
            strokeDasharray={lastAnchorYear ? '6 3' : undefined}
            dot={false}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
          />

          {/* Pending preview dots — yellow, clickable */}
          {pendingScatter.length > 0 && (
            <Scatter
              data={pendingScatter}
              dataKey="_overlayValue"
              fill="#f59e0b"
              stroke="white"
              strokeWidth={2}
              r={5}
              shape="circle"
              isAnimationActive={false}
              cursor="pointer"
              onClick={(data: any) => openSource(data?._overlay)}
            />
          )}

          {/* Approved annotation dots — purple, clickable */}
          {annotationScatter.length > 0 && (
            <Scatter
              data={annotationScatter}
              dataKey="_overlayValue"
              fill="#8b5cf6"
              stroke="white"
              strokeWidth={2}
              r={5}
              shape="diamond"
              isAnimationActive={false}
              cursor="pointer"
              onClick={(data: any) => openSource(data?._overlay)}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

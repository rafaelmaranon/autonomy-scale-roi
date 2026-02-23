'use client'

import { useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SimYearData } from '@/lib/sim-types'
import { WAYMO_PUBLIC_ANCHORS } from '@/lib/historical-anchors'

// Chart left/right margins must match the margin prop on LineChart
const CHART_MARGIN_LEFT = 64 // left margin (8) + YAxis width (~56)
const CHART_MARGIN_RIGHT = 16

interface CapitalCurveChartProps {
  data: SimYearData[]
  chartView?: string
  activeIndex?: number
  onHover?: (index: number) => void
  onMouseLeave?: () => void
}

export function CapitalCurveChart({ data, chartView = 'netCash', activeIndex, onHover, onMouseLeave }: CapitalCurveChartProps) {
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
  const currentYear = 2026
  
  // Get data field and formatting based on chart view
  const getChartConfig = () => {
    switch (chartView) {
      case 'paidTrips':
        return { 
          dataKey: 'paidTripsPerWeek', 
          color: '#3b82f6',
          formatValue: (value: number) => `${(value / 1000).toFixed(0)}K trips/week`,
          yAxisDomain: [0, 'dataMax']
        }
      case 'fleetSize':
        return { 
          dataKey: 'vehiclesProduction', 
          color: '#10b981',
          formatValue: (value: number) => `${(value / 1000).toFixed(0)}K vehicles`,
          yAxisDomain: [0, 'dataMax']
        }
      case 'productionMiles':
        return { 
          dataKey: 'productionMiles', 
          color: '#8b5cf6',
          formatValue: (value: number) => `${(value / 1e9).toFixed(1)}B miles/year`,
          yAxisDomain: [0, 'dataMax']
        }
      case 'validationMiles':
        return { 
          dataKey: 'validationMiles', 
          color: '#f59e0b',
          formatValue: (value: number) => `${(value / 1e9).toFixed(1)}B miles/year`,
          yAxisDomain: [0, 'dataMax']
        }
      default: // netCash
        return { 
          dataKey: 'cumulativeNetCash', 
          color: '#3b82f6',
          formatValue: (value: number) => `$${(value / 1e9).toFixed(0)}B`,
          yAxisDomain: [-100e9, 150e9]
        }
    }
  }
  
  const chartConfig = getChartConfig()

  // Active data point (driven by parent via activeIndex)
  const activeData = activeIndex != null ? data[activeIndex] : null

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
      {/* Value strip — shows active year + value + sourced anchor if available */}
      {activeData && (() => {
        const anchor = WAYMO_PUBLIC_ANCHORS.find(a => a.year === activeData.year)
        const formatAnchorValue = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v.toString()
        return (
          <div
            className="absolute top-0 left-16 right-4 flex items-center gap-2 text-xs z-10 py-1"
            onMouseEnter={() => { isOverStrip.current = true }}
            onMouseLeave={() => { isOverStrip.current = false }}
          >
            <span className="font-medium text-gray-900 pointer-events-none">{activeData.year}</span>
            <span className="text-gray-400 pointer-events-none">|</span>
            <span className="font-bold text-gray-900 pointer-events-none">{chartConfig.formatValue((activeData as any)[chartConfig.dataKey])}</span>
            {anchor && (
              <>
                <span className="text-gray-300 pointer-events-none">·</span>
                <span className="text-emerald-600 pointer-events-none">Sourced: {formatAnchorValue(anchor.value)} {anchor.unit}</span>
                <a
                  href={anchor.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {anchor.source.publisher} ↗
                </a>
              </>
            )}
          </div>
        )
      })()}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
            tickFormatter={(value) => {
              if (chartView === 'netCash') {
                return `$${(value / 1e9).toFixed(0)}B`
              } else if (chartView === 'paidTrips') {
                return `${(value / 1000).toFixed(0)}K`
              } else if (chartView === 'fleetSize') {
                return `${(value / 1000).toFixed(0)}K`
              } else {
                return `${(value / 1e9).toFixed(1)}B`
              }
            }}
          />
          <Tooltip content={() => null} cursor={false} isAnimationActive={false} />
          
          {/* Reference lines - only for Net Cash view */}
          {chartView === 'netCash' && (
            <>
              {/* Zero baseline - break-even line */}
              <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="2 2" />
              {/* Today marker */}
              <ReferenceLine x={currentYear} stroke="#374151" strokeWidth={2} strokeDasharray="4 4" />
              {/* Break-even marker */}
              {breakEvenPoint && (
                <ReferenceLine x={breakEvenPoint.year} stroke="#059669" strokeWidth={2} strokeDasharray="4 4" />
              )}
            </>
          )}
          
          {/* Active year vertical indicator */}
          {activeData && (
            <ReferenceLine x={activeData.year} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
          )}

          {/* Main line */}
          <Line 
            type="monotone" 
            dataKey={chartConfig.dataKey}
            stroke={chartConfig.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={false}
          />
          
          {/* Historical anchor dots - only for Net Cash view */}
          {chartView === 'netCash' && WAYMO_PUBLIC_ANCHORS.map((anchor, index) => {
            const dataPoint = data.find(d => d.year === anchor.year)
            if (dataPoint) {
              return (
                <Line
                  key={`anchor-${anchor.year}-${index}`}
                  type="monotone"
                  dataKey="cumulativeNetCash"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={{ r: 3, fill: '#10b981', stroke: '#10b981', strokeWidth: 1 }}
                  activeDot={false}
                  data={[dataPoint]}
                />
              )
            }
            return null
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

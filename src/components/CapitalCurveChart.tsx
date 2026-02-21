'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { SimYearData } from '@/lib/sim-types'
import { WAYMO_PUBLIC_ANCHORS, getDataPeriod } from '@/lib/historical-anchors'

interface CapitalCurveChartProps {
  data: SimYearData[]
  onHover?: (yearIndex: number) => void
  onMouseLeave?: () => void
}

export function CapitalCurveChart({ data, onHover, onMouseLeave }: CapitalCurveChartProps) {
  // Find break-even point
  const breakEvenPoint = data.find(d => d.cumulativeNetCash >= 0)
  const currentYear = 2025

  // Clean tooltip with key metrics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const yearData = payload[0].payload
      
      // Check if this year has historical anchors
      const anchors = WAYMO_PUBLIC_ANCHORS.filter(anchor => anchor.year === label)
      const isAnchored = anchors.length > 0
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          
          {isAnchored && (
            <p className="text-xs font-medium text-green-600 mb-2">● Anchored</p>
          )}
          
          <div className="space-y-1">
            <p className="text-blue-600 font-medium">
              Net Cash: ${(yearData.cumulativeNetCash / 1e9).toFixed(1)}B
            </p>
            
            <p className="text-gray-600 text-xs">
              Paid trips/week: {yearData.paidTripsPerWeek.toLocaleString()}
            </p>
            
            <p className="text-gray-600 text-xs">
              Total trips: {(yearData.productionTrips / 1e6).toFixed(1)}M
            </p>
            
            <p className="text-gray-600 text-xs">
              Production miles: {(yearData.productionMiles / 1e6).toFixed(0)}M
            </p>
            
            <p className="text-gray-600 text-xs">
              Validation miles: {(yearData.validationMiles / 1e6).toFixed(0)}M
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 50, bottom: 20 }}
          onMouseMove={(event: any) => {
            if (event && event.activeLabel && onHover) {
              const yearIndex = data.findIndex(d => d.year === event.activeLabel)
              if (yearIndex >= 0) {
                onHover(yearIndex)
              }
            }
          }}
          onMouseLeave={() => {
            if (onMouseLeave) {
              onMouseLeave()
            }
          }}
        >
          <defs>
            <linearGradient id="debtArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fee2e2" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#fecaca" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="2 2" stroke="#f9fafb" />
          
          <XAxis 
            dataKey="year" 
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            ticks={[2004, 2015, 2025, 2035, 2045, 2050]}
          />
          
          <YAxis 
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1e9).toFixed(0)}B`}
            domain={['dataMin', 'dataMax']}
            ticks={[-100, -50, 0, 50, 100, 150]}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Thin gray zero baseline */}
          <ReferenceLine 
            y={0} 
            stroke="#d1d5db" 
            strokeWidth={1}
          />
          
          {/* 2004 Start marker */}
          <ReferenceLine 
            x={2004} 
            stroke="#6b7280" 
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          
          {/* Today marker (2025) */}
          <ReferenceLine 
            x={currentYear} 
            stroke="#374151" 
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          
          {/* Break-even marker (computed) */}
          {breakEvenPoint && (
            <ReferenceLine 
              x={breakEvenPoint.year} 
              stroke="#059669" 
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
          
          {/* Debt area (below zero only) */}
          <Area
            type="monotone"
            dataKey="cumulativeNetCash"
            stroke="none"
            fill="url(#debtArea)"
            fillOpacity={1}
            isAnimationActive={false}
          />
          
          {/* Main cumulative net cash line */}
          <Line 
            type="monotone" 
            dataKey="cumulativeNetCash" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props
              const anchors = WAYMO_PUBLIC_ANCHORS.filter(anchor => anchor.year === payload.year)
              if (anchors.length > 0) {
                return <circle cx={cx} cy={cy} r={3} fill="#16a34a" stroke="#ffffff" strokeWidth={1} />
              }
              return null
            }}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

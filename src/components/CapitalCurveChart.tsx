'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { SimYearData } from '@/lib/sim-types'

interface CapitalCurveChartProps {
  data: SimYearData[]
  onHover?: (yearIndex: number) => void
  onMouseLeave?: () => void
}

export function CapitalCurveChart({ data, onHover, onMouseLeave }: CapitalCurveChartProps) {
  // Find break-even point
  const breakEvenPoint = data.find(d => d.cumulativeNetCash >= 0)
  const currentYear = 2025

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const yearData = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg text-sm">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-blue-600">
            Net Cash: ${(yearData.cumulativeNetCash / 1e9).toFixed(1)}B
          </p>
          <p className="text-gray-600 text-xs">
            ROI: {yearData.roi.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 40, bottom: 20 }}
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
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fee2e2" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#fecaca" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          
          <XAxis 
            dataKey="year" 
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            ticks={[2004, 2015, 2025, 2035, 2045, 2050]}
          />
          
          <YAxis 
            stroke="#6b7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1e9).toFixed(0)}B`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Zero line */}
          <ReferenceLine 
            y={0} 
            stroke="#ef4444" 
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          
          {/* Today marker (2025) */}
          <ReferenceLine 
            x={currentYear} 
            stroke="#6b7280" 
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          
          {/* Break-even marker */}
          {breakEvenPoint && (
            <ReferenceLine 
              x={breakEvenPoint.year} 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="2 2"
            />
          )}
          
          {/* Negative area fill */}
          <Area
            type="monotone"
            dataKey="cumulativeNetCash"
            stroke="none"
            fill="url(#negativeGradient)"
            fillOpacity={1}
            isAnimationActive={false}
          />
          
          {/* Main cumulative net cash line */}
          <Line 
            type="monotone" 
            dataKey="cumulativeNetCash" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

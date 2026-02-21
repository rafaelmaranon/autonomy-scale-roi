'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { YearlyData } from '@/lib/roi-calculator'

interface CompactChartProps {
  data: any[] // Will be ProfileYearlyData[]
  annualRDSpend?: number
  onHover?: (yearIndex: number) => void
  onMouseLeave?: () => void
}

export function CompactChart({ data, annualRDSpend, onHover, onMouseLeave }: CompactChartProps) {
  // Find break-even point
  const breakEvenPoint = data.find(d => d.cumulativeNetCash >= 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
          <p className="font-medium">Year {label}</p>
          <p className="text-blue-600">
            Net Cash: ${(data.cumulativeNetCash / 1e9).toFixed(1)}B
          </p>
          <p className="text-gray-600">
            ROI: {data.roi.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 40, bottom: 20 }}
            onMouseMove={(event: any) => {
              if (event && event.activeLabel && onHover) {
                const yearIndex = event.activeLabel - 1 // Convert year to 0-based index
                onHover(yearIndex)
              }
            }}
            onMouseLeave={() => {
              if (onMouseLeave) {
                onMouseLeave()
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
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
            
            {/* Cumulative Net Cash line */}
            <Line 
              type="monotone" 
              dataKey="cumulativeNetCash" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Compact legend */}
      <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>Cumulative Net Cash</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-red-500 border-dashed border-t"></div>
          <span>Zero Line</span>
        </div>
        {breakEvenPoint && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-green-500 border-dashed border-t"></div>
            <span>Break-even ({breakEvenPoint.year})</span>
          </div>
        )}
      </div>
    </div>
  )
}

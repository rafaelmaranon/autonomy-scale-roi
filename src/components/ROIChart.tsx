'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { YearlyData } from '@/lib/roi-calculator'

interface ROIChartProps {
  data: YearlyData[]
  fixedInvestment: number
}

export function ROIChart({ data, fixedInvestment }: ROIChartProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Prepare chart data - convert to billions for better readability
  const chartData = data.slice(0, 10).map(item => ({
    year: item.year,
    cumulativeProfit: item.cumulativeProfit / 1e9, // Convert to billions
    netProfit: item.netProfit / 1e9, // Convert to billions
    fixedInvestment: fixedInvestment // Already in billions
  }))

  // Find break-even point
  const breakEvenPoint = chartData.find(item => item.netProfit >= 0)

  const formatBillions = (value: number) => {
    return `$${value.toFixed(1)}B`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
          <p className="font-medium text-gray-900">{`Y${label}`}</p>
          <div className="space-y-1 mt-2">
            <p className="text-blue-600">
              <span className="font-medium">Profit:</span> {formatBillions(payload[0].value)}
            </p>
            <p className="text-red-600">
              <span className="font-medium">Investment:</span> {formatBillions(payload[1].value)}
            </p>
            <p className={`font-medium ${payload[0].value >= payload[1].value ? 'text-green-600' : 'text-red-600'}`}>
              <span>Net:</span> {formatBillions(payload[0].value - payload[1].value)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Cumulative Profit vs Fixed Investment</h2>
        <p className="text-sm text-gray-600 mt-1">
          Break-even occurs when cumulative profit (blue) exceeds fixed investment (red)
        </p>
        {breakEvenPoint && (
          <p className="text-sm text-green-600 font-medium mt-2">
            ✓ Break-even achieved in Year {breakEvenPoint.year}
          </p>
        )}
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `Y${value}`}
              interval={isMobile ? 1 : 0}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatBillions}
              width={isMobile ? 50 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Fixed Investment Line */}
            <Line
              type="monotone"
              dataKey="fixedInvestment"
              stroke="#ef4444"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={false}
              name="Fixed Investment"
            />
            
            {/* Cumulative Profit Line */}
            <Line
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Cumulative Profit"
            />
            
            {/* Break-even Reference Line */}
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
            
            {/* Break-even Point Highlight */}
            {breakEvenPoint && (
              <ReferenceLine 
                x={breakEvenPoint.year} 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
          <span className="text-gray-700">Cumulative Profit</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-500 border-dashed mr-2"></div>
          <span className="text-gray-700">Fixed Investment</span>
        </div>
        {breakEvenPoint && (
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-green-500 border-dashed mr-2"></div>
            <span className="text-gray-700">Break-even</span>
          </div>
        )}
      </div>
    </div>
  )
}

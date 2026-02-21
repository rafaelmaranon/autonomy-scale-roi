'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { YearlyData } from '@/lib/roi-calculator'

interface LeanChartProps {
  data: YearlyData[]
  fixedInvestment: number
}

export function LeanChart({ data, fixedInvestment }: LeanChartProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showBreakEven, setShowBreakEven] = useState(true)

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
          <p className="font-medium text-gray-900">{`Year ${label}`}</p>
          <div className="space-y-1 mt-2">
            <p className="text-blue-600">
              <span className="font-medium">Cumulative Profit:</span> {formatBillions(payload[0].value)}
            </p>
            <p className="text-red-600">
              <span className="font-medium">Fixed Investment:</span> {formatBillions(payload[1].value)}
            </p>
            <p className={`font-medium ${payload[0].value >= payload[1].value ? 'text-green-600' : 'text-red-600'}`}>
              <span>Net Profit:</span> {formatBillions(payload[0].value - payload[1].value)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">ROI Trajectory</h3>
        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={showBreakEven}
            onChange={(e) => setShowBreakEven(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">Show break-even</span>
        </label>
      </div>

      {/* Chart */}
      <div className="p-4" style={{ height: isMobile ? '50vh' : '60vh' }}>
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
              dot={false}
              name="Cumulative Profit"
            />

            {/* Break-even marker */}
            {showBreakEven && breakEvenPoint && (
              <ReferenceLine 
                x={breakEvenPoint.year} 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ value: `Break-even Y${breakEvenPoint.year}`, position: "top" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* No Break-even Note */}
      {!breakEvenPoint && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-500 text-center">
            No break-even within 10 years with current parameters
          </p>
        </div>
      )}
    </div>
  )
}

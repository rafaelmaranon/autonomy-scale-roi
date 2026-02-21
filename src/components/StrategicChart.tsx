'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { YearlyData } from '@/lib/roi-calculator'

interface StrategicChartProps {
  data: YearlyData[]
  fixedInvestment: number
}

export function StrategicChart({ data, fixedInvestment }: StrategicChartProps) {
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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-bold text-gray-900 mb-2">{`Year ${label}`}</p>
          <div className="space-y-1">
            <p className="text-blue-600 font-medium">
              Cumulative Profit: {formatBillions(payload[0].value)}
            </p>
            <p className="text-red-600 font-medium">
              Fixed Investment: {formatBillions(payload[1].value)}
            </p>
            <p className={`font-bold ${payload[0].value >= payload[1].value ? 'text-green-600' : 'text-red-600'}`}>
              Net Profit: {formatBillions(payload[0].value - payload[1].value)}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Chart - Increased height by 25%, reduced padding */}
      <div className="p-3" style={{ height: isMobile ? '62vh' : '75vh' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
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
              strokeWidth={4}
              strokeDasharray="5 5"
              dot={false}
              name="Fixed Investment"
            />
            
            {/* Cumulative Profit Line - Thicker */}
            <Line
              type="monotone"
              dataKey="cumulativeProfit"
              stroke="#3b82f6"
              strokeWidth={4}
              dot={false}
              name="Cumulative Profit"
            />

            {/* Break-even marker with label */}
            {breakEvenPoint && (
              <ReferenceLine 
                x={breakEvenPoint.year} 
                stroke="#10b981" 
                strokeWidth={3}
                strokeDasharray="3 3"
                label={{ 
                  value: `Break-even (Year ${breakEvenPoint.year})`, 
                  position: "top",
                  style: { fill: '#10b981', fontWeight: 'bold', fontSize: '12px' }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* No Break-even Note */}
      {!breakEvenPoint && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-500 text-center">
            No break-even within 10 years with current parameters
          </p>
        </div>
      )}
    </div>
  )
}

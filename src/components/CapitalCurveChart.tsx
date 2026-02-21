'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { SimYearData } from '@/lib/sim-types'
import { WAYMO_PUBLIC_ANCHORS, getDataPeriod } from '@/lib/historical-anchors'

interface CapitalCurveChartProps {
  data: SimYearData[]
  chartView?: string // View mode: netCash, paidTrips, fleetSize, productionMiles, validationMiles
  onHover?: (index: number) => void
  onMouseLeave?: () => void
}

export function CapitalCurveChart({ data, chartView = 'netCash', onHover, onMouseLeave }: CapitalCurveChartProps) {
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

  // Clean tooltip with key metrics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const yearData = payload[0].payload
      
      // Check if this year has historical anchors
      const anchors = WAYMO_PUBLIC_ANCHORS.filter(anchor => anchor.year === label)
      const isAnchored = anchors.length > 0
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {label} {isAnchored && chartView === 'netCash' && <span className="text-green-600 font-medium">(Anchored)</span>}
          </div>
          <div className="space-y-1 text-xs text-gray-700">
            <div><strong>Current Value:</strong> {chartConfig.formatValue(yearData[chartConfig.dataKey])}</div>
            {chartView === 'netCash' && (
              <>
                <div><strong>Paid trips/week:</strong> {(yearData.paidTripsPerWeek / 1000).toFixed(0)}K</div>
                <div><strong>Total trips:</strong> {(yearData.productionTrips / 1e6).toFixed(1)}M</div>
                <div><strong>Production miles:</strong> {(yearData.productionMiles / 1e9).toFixed(1)}B</div>
                <div><strong>Validation miles:</strong> {(yearData.validationMiles / 1e9).toFixed(1)}B</div>
              </>
            )}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeWidth={0.5} />
          <XAxis 
            dataKey="year" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(value) => value.toString()}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
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
          <Tooltip content={<CustomTooltip />} />
          
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
          
          {/* Main line */}
          <Line 
            type="monotone" 
            dataKey={chartConfig.dataKey}
            stroke={chartConfig.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: chartConfig.color }}
          />
          
          {/* Historical anchor dots - only for Net Cash view */}
          {chartView === 'netCash' && WAYMO_PUBLIC_ANCHORS.map((anchor) => {
            const dataPoint = data.find(d => d.year === anchor.year)
            if (dataPoint) {
              return (
                <Line
                  key={`anchor-${anchor.year}`}
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

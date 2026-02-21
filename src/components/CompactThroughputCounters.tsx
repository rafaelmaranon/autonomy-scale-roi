'use client'

import { useEffect, useState } from 'react'
import { YearlyData } from '@/lib/roi-calculator'

interface CompactThroughputCountersProps {
  yearData: YearlyData
  activeYear: number
}

interface CounterProps {
  label: string
  value: number
  color?: string
  unit?: string
}

function Counter({ label, value, color = 'text-gray-900', unit = '' }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 600
    const steps = 20
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const formatValue = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
    return val.toLocaleString()
  }

  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>
        {formatValue(displayValue)}{unit}
      </div>
      <div className="text-xs text-gray-600">
        {label}
      </div>
    </div>
  )
}

export function CompactThroughputCounters({ yearData, activeYear }: CompactThroughputCountersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Viewing indicator */}
      <div className="text-xs text-gray-500 mb-2 text-center">
        {activeYear === 10 ? 'Viewing: Year 10 (Final)' : `Viewing: Year ${activeYear}`}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Counter 
          label="Production Miles" 
          value={Math.round(yearData.productionMiles)}
          color="text-blue-600"
        />
        <Counter 
          label="Production Trips" 
          value={yearData.productionTrips}
          color="text-blue-600"
        />
        <Counter 
          label="Validation Miles" 
          value={Math.round(yearData.validationMiles)}
          color="text-yellow-600"
        />
      </div>
    </div>
  )
}

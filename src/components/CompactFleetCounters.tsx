'use client'

import { useEffect, useState } from 'react'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'

interface CompactFleetCountersProps {
  inputs: ROIInputs
  outputs: ROIOutputs
}

interface CounterProps {
  label: string
  value: number
  color?: string
}

function Counter({ label, value, color = 'text-gray-900' }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 800
    const steps = 30
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
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
    return val.toLocaleString()
  }

  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color}`}>
        {formatValue(displayValue)}
      </div>
      <div className="text-xs text-gray-600">
        {label}
      </div>
    </div>
  )
}

export function CompactFleetCounters({ inputs, outputs }: CompactFleetCountersProps) {
  // Calculate fleet metrics for year 10
  const year10Data = outputs.yearlyData[9] || outputs.yearlyData[outputs.yearlyData.length - 1]
  const totalVehicles = year10Data ? Math.floor(year10Data.totalVehicles) : 0
  
  // Calculate production vs validating split
  const currentYear = 10
  let productionVehicles = 0
  let validatingVehicles = 0
  
  for (let year = 1; year <= currentYear; year++) {
    const citiesAddedThisYear = Math.min(
      inputs.citiesPerYear,
      inputs.targetCities - (year - 1) * inputs.citiesPerYear
    )
    
    if (citiesAddedThisYear <= 0) break
    
    const yearsActive = currentYear - year + 1
    const rampProgress = Math.min(1, yearsActive / inputs.cityRampTime)
    const vehiclesThisYear = citiesAddedThisYear * inputs.vehiclesPerCity * rampProgress
    
    if (yearsActive >= inputs.cityRampTime) {
      productionVehicles += vehiclesThisYear
    } else {
      validatingVehicles += vehiclesThisYear
    }
  }
  
  // Calculate vehicles added this year (year 10)
  const year9Data = outputs.yearlyData[8]
  const addedThisYear = year10Data && year9Data 
    ? Math.floor(year10Data.totalVehicles - year9Data.totalVehicles)
    : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="grid grid-cols-4 gap-4">
        <Counter 
          label="Total Vehicles" 
          value={totalVehicles}
          color="text-gray-900"
        />
        <Counter 
          label="Production" 
          value={Math.floor(productionVehicles)}
          color="text-blue-600"
        />
        <Counter 
          label="Validating" 
          value={Math.floor(validatingVehicles)}
          color="text-yellow-600"
        />
        <Counter 
          label="Added This Year" 
          value={addedThisYear}
          color="text-green-600"
        />
      </div>
    </div>
  )
}

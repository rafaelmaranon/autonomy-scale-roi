'use client'

import { useState, useEffect } from 'react'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'

interface FleetCountersProps {
  inputs: ROIInputs
  outputs: ROIOutputs
}

interface CounterProps {
  label: string
  value: number
  previousValue?: number
}

function Counter({ label, value, previousValue }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(previousValue || value)

  useEffect(() => {
    if (value !== displayValue) {
      const duration = 500 // Animation duration in ms
      const steps = 20
      const increment = (value - displayValue) / steps
      const stepDuration = duration / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(prev => prev + increment)
        }
      }, stepDuration)

      return () => clearInterval(timer)
    }
  }, [value, displayValue])

  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">
        {Math.round(displayValue).toLocaleString()}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

export function FleetCounters({ inputs, outputs }: FleetCountersProps) {
  const [previousValues, setPreviousValues] = useState({
    total: 0,
    production: 0,
    validation: 0,
    addedThisYear: 0
  })

  // Calculate fleet metrics
  const calculateFleetMetrics = () => {
    const currentYear = Math.min(10, Math.ceil(inputs.targetCities / inputs.citiesPerYear))
    const yearData = outputs.yearlyData[currentYear - 1] || outputs.yearlyData[outputs.yearlyData.length - 1]
    
    const totalVehicles = inputs.targetCities * inputs.vehiclesPerCity
    
    // Calculate cities in production vs validation based on ramp time
    let citiesInProduction = 0
    let citiesInValidation = 0
    
    for (let year = 1; year <= currentYear; year++) {
      const citiesAddedThisYear = Math.min(inputs.citiesPerYear, inputs.targetCities - (year - 1) * inputs.citiesPerYear)
      if (citiesAddedThisYear <= 0) break
      
      const yearsActive = currentYear - year + 1
      if (yearsActive >= inputs.cityRampTime) {
        citiesInProduction += citiesAddedThisYear
      } else {
        citiesInValidation += citiesAddedThisYear
      }
    }
    
    const vehiclesInProduction = citiesInProduction * inputs.vehiclesPerCity
    const vehiclesInValidation = citiesInValidation * inputs.vehiclesPerCity
    const vehiclesAddedThisYear = Math.min(inputs.citiesPerYear, inputs.targetCities) * inputs.vehiclesPerCity

    return {
      total: totalVehicles,
      production: vehiclesInProduction,
      validation: vehiclesInValidation,
      addedThisYear: vehiclesAddedThisYear
    }
  }

  const metrics = calculateFleetMetrics()

  useEffect(() => {
    setPreviousValues(metrics)
  }, [inputs.targetCities, inputs.citiesPerYear, inputs.vehiclesPerCity, inputs.cityRampTime])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Scale</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Counter 
          label="Total Vehicles Deployed" 
          value={metrics.total}
          previousValue={previousValues.total}
        />
        <Counter 
          label="Vehicles in Production" 
          value={metrics.production}
          previousValue={previousValues.production}
        />
        <Counter 
          label="Vehicles in Validation" 
          value={metrics.validation}
          previousValue={previousValues.validation}
        />
        <Counter 
          label="Vehicles Added This Year" 
          value={metrics.addedThisYear}
          previousValue={previousValues.addedThisYear}
        />
      </div>
    </div>
  )
}

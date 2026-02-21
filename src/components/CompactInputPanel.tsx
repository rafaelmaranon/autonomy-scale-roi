'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ROIInputs } from '@/lib/roi-calculator'

interface CompactInputPanelProps {
  inputs: ROIInputs
  onInputChange: (field: keyof ROIInputs, value: number) => void
}

interface SliderInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  unit: string
  min: number
  max: number
  step: number
}

function SliderInput({ label, value, onChange, unit, min, max, step }: SliderInputProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900 text-right">
          {value.toLocaleString()} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )
}

export function CompactInputPanel({ inputs, onInputChange }: CompactInputPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Core Assumptions (5 high-impact sliders)
  const coreInputs = [
    {
      key: 'fixedInvestment' as keyof ROIInputs,
      label: 'Fixed Investment',
      unit: '$B',
      min: 1,
      max: 50,
      step: 0.5
    },
    {
      key: 'profitPerMile' as keyof ROIInputs,
      label: 'Profit per Mile',
      unit: '$/mile',
      min: 0.05,
      max: 1.0,
      step: 0.05
    },
    {
      key: 'citiesPerYear' as keyof ROIInputs,
      label: 'Cities per Year',
      unit: 'cities',
      min: 1,
      max: 20,
      step: 1
    },
    {
      key: 'targetCities' as keyof ROIInputs,
      label: 'Target Cities',
      unit: 'cities',
      min: 10,
      max: 200,
      step: 5
    },
    {
      key: 'cityRampTime' as keyof ROIInputs,
      label: 'City Ramp Time',
      unit: 'years',
      min: 1,
      max: 5,
      step: 0.5
    }
  ]

  // Advanced Model Inputs
  const advancedInputs = [
    {
      key: 'vehiclesPerCity' as keyof ROIInputs,
      label: 'Vehicles per City',
      unit: 'vehicles',
      min: 500,
      max: 10000,
      step: 250
    },
    {
      key: 'milesPerVehiclePerYear' as keyof ROIInputs,
      label: 'Miles per Vehicle per Year',
      unit: 'miles',
      min: 20000,
      max: 100000,
      step: 5000
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 h-fit">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Core Assumptions</h3>
      
      {/* Core Inputs */}
      <div className="space-y-1">
        {coreInputs.map((input) => (
          <SliderInput
            key={input.key}
            label={input.label}
            value={inputs[input.key]}
            onChange={(value) => onInputChange(input.key, value)}
            unit={input.unit}
            min={input.min}
            max={input.max}
            step={input.step}
          />
        ))}
      </div>

      {/* Advanced Inputs Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full py-2 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors border-t border-gray-100 mt-3 pt-3"
      >
        <span>Advanced Model Inputs</span>
        {showAdvanced ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {/* Advanced Inputs */}
      {showAdvanced && (
        <div className="space-y-1 pt-2 animate-in slide-in-from-top-2 duration-200">
          {advancedInputs.map((input) => (
            <SliderInput
              key={input.key}
              label={input.label}
              value={inputs[input.key]}
              onChange={(value) => onInputChange(input.key, value)}
              unit={input.unit}
              min={input.min}
              max={input.max}
              step={input.step}
            />
          ))}
        </div>
      )}
    </div>
  )
}

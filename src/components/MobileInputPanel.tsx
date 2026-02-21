'use client'

import { useState } from 'react'
import { ROIInputs } from '@/lib/roi-calculator'
import { presets } from '@/lib/presets'
import { Accordion } from './Accordion'

interface MobileInputPanelProps {
  inputs: ROIInputs
  selectedPreset: string
  onPresetChange: (preset: string) => void
  onInputChange: (field: keyof ROIInputs, value: number) => void
}

interface InputFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  unit: string
  min: number
  max: number
  step: number
  description: string
}

function InputField({ label, value, onChange, unit, min, max, step, description }: InputFieldProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-sm font-medium text-gray-900">
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
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  )
}

export function MobileInputPanel({ inputs, selectedPreset, onPresetChange, onInputChange }: MobileInputPanelProps) {
  const [showAllInputs, setShowAllInputs] = useState(false)

  const topInputs = [
    {
      key: 'fixedInvestment' as keyof ROIInputs,
      label: 'Fixed Investment',
      unit: '$B',
      min: 1,
      max: 50,
      step: 0.5,
      description: 'Total autonomy R&D and platform investment'
    },
    {
      key: 'profitPerMile' as keyof ROIInputs,
      label: 'Profit per Mile',
      unit: '$',
      min: 0.05,
      max: 1.0,
      step: 0.05,
      description: 'Net profit margin per mile driven'
    },
    {
      key: 'citiesPerYear' as keyof ROIInputs,
      label: 'Cities per Year',
      unit: 'cities',
      min: 1,
      max: 20,
      step: 1,
      description: 'Launch velocity - cities added annually'
    }
  ]

  const allInputs = [
    ...topInputs,
    {
      key: 'targetCities' as keyof ROIInputs,
      label: 'Target Cities',
      unit: 'cities',
      min: 10,
      max: 200,
      step: 5,
      description: 'Total addressable market size'
    },
    {
      key: 'vehiclesPerCity' as keyof ROIInputs,
      label: 'Vehicles per City',
      unit: 'vehicles',
      min: 500,
      max: 10000,
      step: 250,
      description: 'Fleet size at full city maturity'
    },
    {
      key: 'milesPerVehiclePerYear' as keyof ROIInputs,
      label: 'Miles per Vehicle per Year',
      unit: 'miles',
      min: 20000,
      max: 100000,
      step: 5000,
      description: 'Annual utilization per vehicle'
    },
    {
      key: 'cityRampTime' as keyof ROIInputs,
      label: 'City Ramp Time',
      unit: 'years',
      min: 1,
      max: 5,
      step: 0.5,
      description: 'Time to reach full production per city'
    }
  ]

  const inputsToShow = showAllInputs ? allInputs : topInputs

  return (
    <Accordion title="Model Inputs" defaultOpen={false} className="lg:hidden">
      <div className="pt-4">
        {/* Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Scenario Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onPresetChange(preset.name)}
                className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                  selectedPreset === preset.name
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
          {selectedPreset !== 'Custom' && (
            <p className="text-xs text-gray-500 mt-2">
              {presets.find(p => p.name === selectedPreset)?.description}
            </p>
          )}
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          {inputsToShow.map((input) => (
            <InputField
              key={input.key}
              label={input.label}
              value={inputs[input.key]}
              onChange={(value) => onInputChange(input.key, value)}
              unit={input.unit}
              min={input.min}
              max={input.max}
              step={input.step}
              description={input.description}
            />
          ))}
        </div>

        {/* Show All Toggle */}
        <button
          onClick={() => setShowAllInputs(!showAllInputs)}
          className="w-full mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {showAllInputs ? 'Show Less' : 'Show All Inputs'}
        </button>
      </div>
    </Accordion>
  )
}

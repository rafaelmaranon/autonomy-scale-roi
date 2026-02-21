'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { ROIInputs } from '@/lib/roi-calculator'
import { presets } from '@/lib/presets'

interface StrategicMobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  inputs: ROIInputs
  selectedPreset: string
  onPresetChange: (preset: string) => void
  onInputChange: (field: keyof ROIInputs, value: number) => void
  onReset: () => void
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
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-base font-bold text-gray-900">
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
    </div>
  )
}

export function StrategicMobileBottomSheet({ 
  isOpen, 
  onClose, 
  inputs, 
  selectedPreset, 
  onPresetChange, 
  onInputChange,
  onReset 
}: StrategicMobileBottomSheetProps) {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 lg:hidden">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Parameters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Presets & Reset */}
          <div className="flex space-x-3">
            <select
              value={selectedPreset}
              onChange={(e) => onPresetChange(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
            <button
              onClick={onReset}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-1"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>

          {/* Core Assumptions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Core Assumptions</h3>
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

          {/* Advanced Model Inputs Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors border-t border-gray-100 pt-3"
          >
            <span>Advanced Model Inputs</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Advanced Inputs */}
          {showAdvanced && (
            <div className="space-y-2 pt-3 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
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
      </div>
    </div>
  )
}

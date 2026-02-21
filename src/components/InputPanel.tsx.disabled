'use client'

import { ROIInputs } from '@/lib/roi-calculator'
import { presets } from '@/lib/presets'

interface InputPanelProps {
  inputs: ROIInputs
  selectedPreset: string
  onPresetChange: (preset: string) => void
  onInputChange: (field: keyof ROIInputs, value: number) => void
}

export function InputPanel({ inputs, selectedPreset, onPresetChange, onInputChange }: InputPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Model Inputs</h2>
      
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
        <InputField
          label="Fixed Investment"
          value={inputs.fixedInvestment}
          onChange={(value) => onInputChange('fixedInvestment', value)}
          unit="$B"
          min={1}
          max={50}
          step={0.5}
          description="Total autonomy R&D and platform investment"
        />

        <InputField
          label="Profit per Mile"
          value={inputs.profitPerMile}
          onChange={(value) => onInputChange('profitPerMile', value)}
          unit="$"
          min={0.05}
          max={1.0}
          step={0.05}
          description="Net profit margin per mile driven"
        />

        <InputField
          label="Cities per Year"
          value={inputs.citiesPerYear}
          onChange={(value) => onInputChange('citiesPerYear', value)}
          unit="cities"
          min={1}
          max={20}
          step={1}
          description="Launch velocity - cities added annually"
        />

        <InputField
          label="Target Cities"
          value={inputs.targetCities}
          onChange={(value) => onInputChange('targetCities', value)}
          unit="cities"
          min={10}
          max={200}
          step={5}
          description="Total addressable market size"
        />

        <InputField
          label="Vehicles per City"
          value={inputs.vehiclesPerCity}
          onChange={(value) => onInputChange('vehiclesPerCity', value)}
          unit="vehicles"
          min={500}
          max={10000}
          step={250}
          description="Fleet size at full city maturity"
        />

        <InputField
          label="Miles per Vehicle per Year"
          value={inputs.milesPerVehiclePerYear}
          onChange={(value) => onInputChange('milesPerVehiclePerYear', value)}
          unit="miles"
          min={20000}
          max={100000}
          step={5000}
          description="Annual utilization per vehicle"
        />

        <InputField
          label="City Ramp Time"
          value={inputs.cityRampTime}
          onChange={(value) => onInputChange('cityRampTime', value)}
          unit="years"
          min={1}
          max={5}
          step={0.5}
          description="Time to reach full production per city"
        />
      </div>
    </div>
  )
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
    <div>
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

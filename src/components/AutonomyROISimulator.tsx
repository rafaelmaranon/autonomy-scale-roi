'use client'

import { useState, useEffect } from 'react'
import { ROIInputs, ROIOutputs, ROICalculator } from '@/lib/roi-calculator'
import { presets, getPresetByName } from '@/lib/presets'
import { analytics } from '@/lib/analytics'
import { InputPanel } from './InputPanel'
import { OutputPanel } from './OutputPanel'
import { ROIChart } from './ROIChart'
import { AskAI } from './AskAI'

export function AutonomyROISimulator() {
  const [inputs, setInputs] = useState<ROIInputs>(presets[1].inputs) // Start with Base Case
  const [outputs, setOutputs] = useState<ROIOutputs | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('Base Case')
  const [showAI, setShowAI] = useState(false)

  // Initialize analytics on mount
  useEffect(() => {
    analytics.logEvent('page_view', {
      page: 'autonomy-roi-simulator',
      timestamp: new Date().toISOString()
    })
  }, [])

  // Recalculate outputs when inputs change
  useEffect(() => {
    const newOutputs = ROICalculator.calculate(inputs)
    setOutputs(newOutputs)
    
    analytics.logEvent('run_started', {
      inputs: inputs,
      preset: selectedPreset
    })
    
    analytics.logEvent('run_completed', {
      breakEvenYear: newOutputs.breakEvenYear,
      roiYear5: newOutputs.roiYear5,
      roiYear10: newOutputs.roiYear10
    })
  }, [inputs, selectedPreset])

  const handlePresetChange = (presetName: string) => {
    const preset = getPresetByName(presetName)
    if (preset) {
      setSelectedPreset(presetName)
      setInputs(preset.inputs)
      
      analytics.logEvent('preset_selected', {
        preset: presetName,
        inputs: preset.inputs
      })
    }
  }

  const handleInputChange = (field: keyof ROIInputs, value: number) => {
    const newInputs = { ...inputs, [field]: value }
    setInputs(newInputs)
    setSelectedPreset('Custom') // Mark as custom when user modifies inputs
    
    analytics.logEvent('input_change', {
      field,
      value,
      preset: selectedPreset
    })
  }

  const handleAIToggle = () => {
    setShowAI(!showAI)
    analytics.logEvent('ai_opened', {
      opened: !showAI
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Autonomy Scale ROI
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Strategic simulator for large autonomy investment returns
              </p>
            </div>
            <button
              onClick={handleAIToggle}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Ask AI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-1">
            <InputPanel
              inputs={inputs}
              selectedPreset={selectedPreset}
              onPresetChange={handlePresetChange}
              onInputChange={handleInputChange}
            />
          </div>

          {/* Right Panel - Outputs and Chart */}
          <div className="lg:col-span-2 space-y-8">
            {outputs && (
              <>
                <OutputPanel outputs={outputs} />
                <ROIChart data={outputs.yearlyData} fixedInvestment={inputs.fixedInvestment} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Ask AI Modal */}
      {showAI && outputs && (
        <AskAI
          inputs={inputs}
          outputs={outputs}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  )
}

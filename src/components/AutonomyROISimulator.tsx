'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, RotateCcw, MessageCircle, Settings } from 'lucide-react'
import { ROIInputs, ROIOutputs, ROICalculator } from '@/lib/roi-calculator'
import { presets, getPresetByName } from '@/lib/presets'
import { analytics } from '@/lib/analytics'
import { CompactHeroMetrics } from './CompactHeroMetrics'
import { CompactInputPanel } from './CompactInputPanel'
import { CompactChart } from './CompactChart'
import { CompactFleetCounters } from './CompactFleetCounters'
import { CompactNetworkMap } from './CompactNetworkMap'
import { InsightChips } from './InsightChips'
import { DetailsSection } from './DetailsSection'
import { StrategicMobileBottomSheet } from './StrategicMobileBottomSheet'
// import { AskAI } from './AskAI'

export function AutonomyROISimulator() {
  const [inputs, setInputs] = useState<ROIInputs>(presets[1].inputs) // Start with Base Case
  const [outputs, setOutputs] = useState<ROIOutputs | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('Base Case')
  const [showAI, setShowAI] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)

  // Initialize analytics on mount (client-side only)
  useEffect(() => {
    // Delay analytics to ensure client-side hydration is complete
    const timer = setTimeout(() => {
      analytics.logEvent('page_view', {
        page: 'autonomy-roi-simulator',
        timestamp: new Date().toISOString()
      })
    }, 500)
    
    return () => clearTimeout(timer)
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

  const handleReset = () => {
    const baseCase = getPresetByName('Base Case')
    if (baseCase) {
      setInputs(baseCase.inputs)
      setSelectedPreset('Base Case')
      analytics.logEvent('preset_selected', {
        preset: 'Base Case',
        action: 'reset'
      })
    }
  }

  const handleInsightClick = (prompt: string) => {
    setShowAI(true)
    // You could pass the prompt to the AI component here
    analytics.logEvent('insight_chip_clicked', {
      prompt
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Autonomy Scale ROI</h1>
              <p className="text-xs text-gray-600">Strategic autonomy expansion simulator</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Presets Dropdown */}
              <div className="relative">
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {presets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs font-medium"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Single Screen Layout */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-hidden">
        {outputs && (
          <>
            {/* Desktop Layout - 3 Column No Scroll */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-full">
              {/* Left Column - Parameters (25-30%) */}
              <div className="lg:col-span-3">
                <CompactInputPanel
                  inputs={inputs}
                  onInputChange={handleInputChange}
                />
              </div>

              {/* Right Side - Metrics + Chart/Map (70-75%) */}
              <div className="lg:col-span-9 flex flex-col space-y-3">
                {/* Top Row - Hero Metrics */}
                <CompactHeroMetrics outputs={outputs} inputs={inputs} />
                
                {/* Fleet Counters Strip */}
                <CompactFleetCounters inputs={inputs} outputs={outputs} />
                
                {/* Bottom Row - Chart and Map Side by Side */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <CompactChart data={outputs.yearlyData} fixedInvestment={inputs.fixedInvestment} />
                  <CompactNetworkMap inputs={inputs} outputs={outputs} selectedPreset={selectedPreset} />
                </div>
              </div>
            </div>

            {/* Mobile Layout - Stacked with Scrolling */}
            <div className="lg:hidden space-y-4">
              {/* Hero Metrics */}
              <CompactHeroMetrics outputs={outputs} inputs={inputs} />
              
              {/* Chart */}
              <CompactChart data={outputs.yearlyData} fixedInvestment={inputs.fixedInvestment} />
              
              {/* Map */}
              <CompactNetworkMap inputs={inputs} outputs={outputs} selectedPreset={selectedPreset} />
              
              {/* Fleet Counters */}
              <CompactFleetCounters inputs={inputs} outputs={outputs} />
            </div>
          </>
        )}
      </main>

      {/* Mobile Controls - Floating Button */}
      <button
        onClick={() => setShowMobileControls(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-40 flex items-center space-x-2"
      >
        <Settings size={20} />
        <span className="text-sm font-medium">Controls</span>
      </button>

      {/* Strategic Mobile Bottom Sheet */}
      <StrategicMobileBottomSheet
        isOpen={showMobileControls}
        onClose={() => setShowMobileControls(false)}
        inputs={inputs}
        selectedPreset={selectedPreset}
        onPresetChange={handlePresetChange}
        onInputChange={handleInputChange}
        onReset={handleReset}
      />

      {/* Desktop Ask AI Modal - Temporarily disabled */}
      {/* {showAI && outputs && (
        <AskAI
          inputs={inputs}
          outputs={outputs}
          onClose={() => setShowAI(false)}
        />
      )} */}
    </div>
  )
}

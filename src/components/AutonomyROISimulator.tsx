'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, RotateCcw, MessageCircle, Settings } from 'lucide-react'
import { ROIInputs, ROIOutputs, ROICalculator } from '@/lib/roi-calculator'
import { presets, getPresetByName } from '@/lib/presets'
import { analytics } from '@/lib/analytics'
import { LeanHeroMetrics } from './LeanHeroMetrics'
import { LeanInputPanel } from './LeanInputPanel'
import { LeanChart } from './LeanChart'
import { InsightChips } from './InsightChips'
import { DetailsSection } from './DetailsSection'
import { MobileBottomSheet } from './MobileBottomSheet'
import { AskAI } from './AskAI'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Robotaxi Style */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Autonomy Scale ROI
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Strategic simulator for large autonomy investment returns
              </p>
            </div>
            
            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Presets Dropdown */}
              <div className="relative">
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {presets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
              
              {/* Ask AI Button */}
              <button
                onClick={handleAIToggle}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
              >
                <MessageCircle size={16} />
                <span>Ask AI</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {outputs && (
          <>
            {/* Desktop Layout - 2 Column */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-8">
              {/* Left Panel - Inputs (Sticky) */}
              <div className="lg:col-span-1">
                <LeanInputPanel
                  inputs={inputs}
                  onInputChange={handleInputChange}
                />
              </div>

              {/* Right Panel - Chart + Metrics */}
              <div className="lg:col-span-3 space-y-4">
                {/* Hero Metrics */}
                <LeanHeroMetrics outputs={outputs} />
                
                {/* Chart */}
                <LeanChart data={outputs.yearlyData} fixedInvestment={inputs.fixedInvestment} />
                
                {/* Insight Chips */}
                <InsightChips onChipClick={handleInsightClick} />
                
                {/* Details Section */}
                <DetailsSection outputs={outputs} />
              </div>
            </div>

            {/* Mobile Layout - Single Column */}
            <div className="lg:hidden space-y-4">
              {/* Hero Metrics */}
              <LeanHeroMetrics outputs={outputs} />
              
              {/* Chart */}
              <LeanChart data={outputs.yearlyData} fixedInvestment={inputs.fixedInvestment} />
              
              {/* Insight Chips */}
              <InsightChips onChipClick={handleInsightClick} />
              
              {/* Details Section */}
              <DetailsSection outputs={outputs} />
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

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showMobileControls}
        onClose={() => setShowMobileControls(false)}
        inputs={inputs}
        selectedPreset={selectedPreset}
        onPresetChange={handlePresetChange}
        onInputChange={handleInputChange}
        onReset={handleReset}
      />

      {/* Desktop Ask AI Modal */}
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

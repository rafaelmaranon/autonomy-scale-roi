'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, RotateCcw, MessageCircle, Settings } from 'lucide-react'
import { ProfileInputs, ProfileOutputs, ProfileCalculator } from '@/lib/profile-calculator'
import { profiles, ProfileConfig, getProfileByName } from '@/lib/profiles'
import { analytics } from '@/lib/analytics'
import { CompactHeroMetrics } from './CompactHeroMetrics'
// import { CompactInputPanel } from './CompactInputPanel' // Temporarily disabled
import { CompactChart } from './CompactChart'
import { CompactFleetCounters } from './CompactFleetCounters'
import { CompactThroughputCounters } from './CompactThroughputCounters'
import { CompactNetworkMap } from './CompactNetworkMap'
// import { InsightChips } from './InsightChips' // Temporarily disabled
// import { DetailsSection } from './DetailsSection' // Temporarily disabled
// import { StrategicMobileBottomSheet } from './StrategicMobileBottomSheet' // Temporarily disabled
// import { AskAI } from './AskAI'

export function AutonomyROISimulator() {
  const [inputs, setInputs] = useState<ProfileInputs>(profiles[0].inputs) // Start with Waymo
  const [outputs, setOutputs] = useState<ProfileOutputs | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string>('Waymo')
  const [showAI, setShowAI] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)
  const [activeYearIndex, setActiveYearIndex] = useState<number>(45) // Default to final year (2050)

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

  // Calculate outputs whenever inputs change
  useEffect(() => {
    const profile = getProfileByName(selectedProfile)
    if (profile) {
      const newOutputs = ProfileCalculator.calculate(inputs, profile.multipliers)
      setOutputs(newOutputs)
      
      analytics.logEvent('run_started', {
        profile: selectedProfile
      })
    }
  }, [inputs, selectedProfile])

  const handleProfileChange = (profileName: string) => {
    const profile = getProfileByName(profileName)
    if (profile) {
      setSelectedProfile(profileName)
      setInputs(profile.inputs)
      setActiveYearIndex(profile.inputs.yearsToSimulate - 1) // Reset to final year
      
      analytics.logEvent('profile_selected', {
        profile: profileName,
        inputs: profile.inputs
      })
    }
  }

  const handleInputChange = (field: keyof ProfileInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    setActiveYearIndex(inputs.yearsToSimulate - 1) // Reset to final year when inputs change
    setSelectedProfile('Custom') // Mark as custom when user modifies inputs
    analytics.logEvent('input_change', {
      field,
      value,
      profile: selectedProfile
    })
  }

  const handleAIToggle = () => {
    setShowAI(!showAI)
    analytics.logEvent('ai_opened', {
      opened: !showAI
    })
  }

  const handleReset = () => {
    const waymoProfile = getProfileByName('Waymo')
    if (waymoProfile) {
      setInputs(waymoProfile.inputs)
      setSelectedProfile('Waymo')
      setActiveYearIndex(waymoProfile.inputs.yearsToSimulate - 1)
      analytics.logEvent('preset_selected', {
        preset: 'Waymo',
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

  // Chart hover handlers for temporal x-ray vision
  const handleChartHover = (yearIndex: number) => {
    setActiveYearIndex(yearIndex)
  }

  const handleChartLeave = () => {
    setActiveYearIndex(inputs.yearsToSimulate - 1) // Revert to final year
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
              {/* Profile Dropdown */}
              <div className="relative">
                <select
                  value={selectedProfile}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {profiles.map((profile) => (
                    <option key={profile.name} value={profile.name}>
                      {profile.name}
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
                {/* Profile Selector */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Profile</h3>
                  <div className="space-y-2">
                    {profiles.map((profile) => (
                      <button
                        key={profile.name}
                        onClick={() => handleProfileChange(profile.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedProfile === profile.name
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs opacity-75">{profile.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Metrics + Chart/Map (70-75%) */}
              <div className="lg:col-span-9 flex flex-col space-y-3">
                {/* Top Row - Hero Metrics */}
                <CompactHeroMetrics outputs={outputs} inputs={inputs} />
                
                {/* Fleet Counters Strip */}
                <CompactFleetCounters yearData={outputs.yearlyData[activeYearIndex]} />
                
                {/* Throughput Counters Strip */}
                <CompactThroughputCounters yearData={outputs.yearlyData[activeYearIndex]} activeYear={activeYearIndex + 1} />
                
                {/* Bottom Row - Chart and Map Side by Side */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <CompactChart 
                    data={outputs.yearlyData} 
                    annualRDSpend={inputs.annualRDSpend}
                    onHover={handleChartHover}
                    onMouseLeave={handleChartLeave}
                  />
                  <CompactNetworkMap inputs={inputs} outputs={outputs} selectedPreset={selectedProfile} />
                </div>
              </div>
            </div>

            {/* Mobile Layout - Stacked with Scrolling */}
            <div className="lg:hidden space-y-4">
              {/* Hero Metrics */}
              <CompactHeroMetrics outputs={outputs} inputs={inputs} />
              
              {/* Chart */}
              <CompactChart 
                data={outputs.yearlyData} 
                annualRDSpend={inputs.annualRDSpend}
                onHover={handleChartHover}
                onMouseLeave={handleChartLeave}
              />
              
              {/* Map */}
              <CompactNetworkMap inputs={inputs} outputs={outputs} selectedPreset={selectedProfile} />
              
              {/* Fleet Counters */}
              <CompactFleetCounters yearData={outputs.yearlyData[activeYearIndex]} />
              
              {/* Throughput Counters */}
              <CompactThroughputCounters yearData={outputs.yearlyData[activeYearIndex]} activeYear={activeYearIndex + 1} />
            </div>
          </>
        )}
      </main>

      {/* Mobile Controls - Temporarily disabled */}
      {/* <button
        onClick={() => setShowMobileControls(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-40 flex items-center space-x-2"
      >
        <Settings size={20} />
        <span className="text-sm font-medium">Controls</span>
      </button> */}

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

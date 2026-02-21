'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { SimInputs, SimOutputs, SimYearData, ProfileConfig, profiles, getProfileByName } from '@/lib/sim-types'
import { SimCalculator } from '@/lib/sim-calculator'
import { analytics } from '@/lib/analytics'
import { CapitalCurveChart } from './CapitalCurveChart'

export function V1Simulator() {
  const [inputs, setInputs] = useState<SimInputs>(profiles[0].inputs) // Start with Waymo
  const [outputs, setOutputs] = useState<SimOutputs | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string>('Waymo')
  const [activeYearIndex, setActiveYearIndex] = useState<number>(45) // Default to final year

  // Calculate outputs whenever inputs change
  useEffect(() => {
    const profile = getProfileByName(selectedProfile)
    if (profile) {
      const newOutputs = SimCalculator.calculate(inputs, profile.multipliers)
      setOutputs(newOutputs)
      setActiveYearIndex(newOutputs.yearlyData.length - 1) // Set to final year
      
      analytics.logEvent('run_started', {
        profile: selectedProfile
      })
    }
  }, [inputs, selectedProfile])

  // Handle profile changes
  const handleProfileChange = (profileName: string) => {
    const profile = getProfileByName(profileName)
    if (profile) {
      setSelectedProfile(profileName)
      setInputs(profile.inputs)
      
      analytics.logEvent('profile_selected', {
        profile: profileName,
        inputs: profile.inputs
      })
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof SimInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    setSelectedProfile('Custom') // Mark as custom when user modifies inputs
    analytics.logEvent('input_change', {
      field,
      value,
      profile: selectedProfile
    })
  }

  // Chart hover handlers for temporal x-ray vision
  const handleChartHover = (yearIndex: number) => {
    setActiveYearIndex(yearIndex)
  }

  const handleChartLeave = () => {
    if (outputs) {
      setActiveYearIndex(outputs.yearlyData.length - 1) // Revert to final year
    }
  }

  // Get active year data for display
  const activeYearData = outputs?.yearlyData[activeYearIndex]
  const activeYear = activeYearData?.year || inputs.startYear + inputs.yearsToSimulate - 1

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
                onClick={() => handleProfileChange('Waymo')}
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
        {outputs && activeYearData && (
          <>
            {/* Top Strip - 4 Key Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">
                  {activeYearIndex === outputs.yearlyData.length - 1 
                    ? `Viewing: ${activeYear} (Final)` 
                    : `Viewing: ${activeYear}`}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {SimCalculator.formatNumber(activeYearData.paidTripsPerWeek)}
                  </div>
                  <div className="text-xs text-gray-600">Paid Trips / Week</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {SimCalculator.formatNumber(activeYearData.productionTrips)}
                  </div>
                  <div className="text-xs text-gray-600">Total Trips</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {SimCalculator.formatNumber(activeYearData.productionMiles)}
                  </div>
                  <div className="text-xs text-gray-600">Production Miles (Cumulative)</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {SimCalculator.formatNumber(activeYearData.validationMiles)}
                  </div>
                  <div className="text-xs text-gray-600">Validation Miles</div>
                </div>
              </div>
            </div>

            {/* Desktop Layout - Left Inputs, Right Chart/Map */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-full">
              {/* Left Column - Core Inputs + Profile Selector */}
              <div className="lg:col-span-3 space-y-4">
                {/* Profile Selector */}
                <div className="bg-white rounded-lg border border-gray-200 p-3">
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

                {/* Core Inputs - 5 Key Knobs */}
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Core Inputs</h3>
                  <div className="space-y-3">
                    {/* Cities per Year */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700">Cities per Year</label>
                        <span className="text-sm font-bold text-gray-900">{inputs.citiesPerYear}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={25}
                        step={1}
                        value={inputs.citiesPerYear}
                        onChange={(e) => handleInputChange('citiesPerYear', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Vehicles per City */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700">Vehicles per City</label>
                        <span className="text-sm font-bold text-gray-900">{inputs.vehiclesPerCity.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min={500}
                        max={10000}
                        step={250}
                        value={inputs.vehiclesPerCity}
                        onChange={(e) => handleInputChange('vehiclesPerCity', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Annual R&D Spend */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700">Annual R&D Spend</label>
                        <span className="text-sm font-bold text-gray-900">${inputs.annualRDSpend.toFixed(1)}B</span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        value={inputs.annualRDSpend}
                        onChange={(e) => handleInputChange('annualRDSpend', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Ramp Time per City */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-gray-700">Ramp Time per City</label>
                        <span className="text-sm font-bold text-gray-900">{inputs.rampTimePerCity.toFixed(1)} years</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={5.0}
                        step={0.5}
                        value={inputs.rampTimePerCity}
                        onChange={(e) => handleInputChange('rampTimePerCity', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Chart (smaller) and Map (bigger) */}
              <div className="lg:col-span-9 grid grid-cols-2 gap-4">
                {/* Chart - Cumulative Net Cash */}
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Capital Cycle (2004–2050)</h3>
                  <div className="h-80">
                    <CapitalCurveChart 
                      data={outputs.yearlyData}
                      onHover={handleChartHover}
                      onMouseLeave={handleChartLeave}
                    />
                  </div>
                </div>

                {/* Map - Bigger */}
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Global Network
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    {activeYearData.citiesTotal} Cities · {SimCalculator.formatNumber(activeYearData.vehiclesProduction)} Production Vehicles
                  </p>
                  <div className="h-72">
                    <div className="w-full h-full bg-gray-50 rounded flex items-center justify-center text-gray-500 text-sm">
                      Interactive World Map
                      <br />
                      <span className="text-xs text-gray-400 mt-2 block">
                        {activeYearData.vehiclesValidation.toLocaleString()} validation vehicles
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout - Stacked */}
            <div className="lg:hidden space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="text-center text-gray-500 text-sm">
                  Mobile layout: Profile selector + Chart + Map + Core inputs
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

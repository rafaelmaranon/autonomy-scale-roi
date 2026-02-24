'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, SlidersHorizontal, X, ExternalLink } from 'lucide-react'
import { SimInputs, SimOutputs, SimYearData, ProfileConfig, profiles, getProfileByName } from '@/lib/sim-types'
import { SimCalculator } from '@/lib/sim-calculator'
import { analytics } from '@/lib/analytics'
import { CapitalCurveChart } from './CapitalCurveChart'
import { HistoricalAnchorRow, mergeTimeline, MergedYearData, splitAnchors, SplitAnchors, getDebugInfo } from '@/lib/timeline-merger'
import { CompactNetworkMap } from './CompactNetworkMap'
import { InsightsPanel } from './InsightsPanel'

export function V1Simulator() {
  const [inputs, setInputs] = useState<SimInputs>(profiles[0].inputs) // Start with Waymo
  const [outputs, setOutputs] = useState<SimOutputs | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string>('Waymo')
  const [activeYearIndex, setActiveYearIndex] = useState<number>(45) // Default to final year
  const [chartView, setChartView] = useState<string>('netCash')
  const [activeView, setActiveView] = useState<'map' | 'chart'>('map')
  const [showInputsDrawer, setShowInputsDrawer] = useState<boolean>(false)
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false)
  const [anchors, setAnchors] = useState<HistoricalAnchorRow[]>([])

  const fetchAnchors = () => {
    fetch('/api/anchors?company=Waymo', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.anchors) {
          const cityRows = data.anchors.filter((a: any) => a.city)
          console.log('[Anchors] Raw city rows from API:', cityRows.map((r: any) => `${r.city} | year=${r.year} | metric=${r.metric} | conf=${r.confidence} | stat=${r.status}`))
          setAnchors(data.anchors)
        }
      })
      .catch(() => {})
  }

  // Fetch historical anchors from API
  useEffect(() => { fetchAnchors() }, [])

  // Calculate outputs whenever inputs change
  useEffect(() => {
    const profile = getProfileByName(selectedProfile)
    if (profile) {
      const newOutputs = SimCalculator.calculate(inputs, profile.multipliers)
      
      // Verify full timeline is generated
      if (newOutputs.yearlyData.length > 0) {
        const firstYear = newOutputs.yearlyData[0].year
        const lastYear = newOutputs.yearlyData[newOutputs.yearlyData.length - 1].year
        console.log(`Timeline: ${firstYear}-${lastYear} (${newOutputs.yearlyData.length} years)`)
      }
      
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

  // Split raw anchors into binding / pending / annotations
  const anchorSplit = useMemo<SplitAnchors>(() => splitAnchors(anchors), [anchors])

  // Debug info (logged once when anchors change)
  useEffect(() => {
    if (anchors.length > 0) {
      const info = getDebugInfo(anchors)
      console.log('[Anchors Debug]', info)
    }
  }, [anchors])

  // Filter city-specific anchors for the map
  const cityMetrics = ['city_active', 'city_pilot']
  const citySplit = useMemo(() => ({
    bindingCities: anchorSplit.bindingAnchors.filter(a => cityMetrics.includes(a.metric)),
    pendingCities: anchorSplit.pendingPoints.filter(a => cityMetrics.includes(a.metric)),
    annotatedCities: anchorSplit.annotations.filter(a => cityMetrics.includes(a.metric)),
    requestedCities: anchors.filter(a => a.metric === 'city_requested'),
  }), [anchorSplit, anchors])

  // Merge simulation data with BINDING anchors only
  const mergedData = useMemo(() => {
    if (!outputs) return null
    return mergeTimeline(outputs.yearlyData, anchorSplit.bindingAnchors)
  }, [outputs, anchorSplit.bindingAnchors])

  // Get active year data for display (from merged timeline)
  const activeYearData = mergedData?.[activeYearIndex]
  const activeYear = activeYearData?.year || inputs.startYear + inputs.yearsToSimulate - 1

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 md:px-6">
          <div className="flex items-center py-2 gap-3">
            <h1 className="text-lg font-bold text-gray-900">Autonomy Scale ROI</h1>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <select
                value={selectedProfile}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Waymo">Waymo</option>
                <option value="Custom">Custom</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Inputs Button — mobile only (desktop has left rail) */}
            <button
              onClick={() => setShowInputsDrawer(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal size={14} />
              Inputs
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col">
        {outputs && mergedData && activeYearData && (
          <>
            {/* KPI Strip */}
            <div className="px-4 md:px-6 py-2 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3 md:gap-10">
                <span className="text-xs text-gray-400 flex-shrink-0">{activeYear}</span>
                <div className="flex gap-3 md:gap-10 overflow-x-auto">
                  <div className="flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">${(activeYearData.cumulativeNetCash / 1e9).toFixed(1)}B</div>
                    <div className="text-[11px] text-gray-400">Net cash (cum.)</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{activeYearData.paidTripsPerWeek >= 1e6 ? `${(activeYearData.paidTripsPerWeek / 1e6).toFixed(1)}M` : `${(activeYearData.paidTripsPerWeek / 1e3).toFixed(0)}K`}</div>
                    <div className="text-[11px] text-gray-400">Paid trips/week</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{activeYearData.vehiclesProduction >= 1e6 ? `${(activeYearData.vehiclesProduction / 1e6).toFixed(1)}M` : `${(activeYearData.vehiclesProduction / 1e3).toFixed(0)}K`}</div>
                    <div className="text-[11px] text-gray-400">Fleet size</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{((activeYearData.productionMiles + activeYearData.validationMiles) / 1e9).toFixed(1)}B</div>
                    <div className="text-[11px] text-gray-400">Miles (cum.)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout (>=md): 2-Column */}
            <div className="hidden md:flex flex-1 min-h-0">
              {/* Left Rail - Core Inputs Only */}
              <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white px-5 py-3 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inputs</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Cities per Year</label>
                      <span className="text-sm font-bold text-gray-900">{inputs.citiesPerYear}</span>
                    </div>
                    <input type="range" min={1} max={25} step={1} value={inputs.citiesPerYear}
                      onChange={(e) => handleInputChange('citiesPerYear', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Vehicles per City</label>
                      <span className="text-sm font-bold text-gray-900">{inputs.vehiclesPerCity.toLocaleString()}</span>
                    </div>
                    <input type="range" min={500} max={10000} step={250} value={inputs.vehiclesPerCity}
                      onChange={(e) => handleInputChange('vehiclesPerCity', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Annual R&D Spend</label>
                      <span className="text-sm font-bold text-gray-900">${inputs.annualRDSpend.toFixed(1)}B</span>
                    </div>
                    <input type="range" min={0.1} max={5.0} step={0.1} value={inputs.annualRDSpend}
                      onChange={(e) => handleInputChange('annualRDSpend', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Ramp Time per City</label>
                      <span className="text-sm font-bold text-gray-900">{inputs.rampTimePerCity.toFixed(1)} years</span>
                    </div>
                    <input type="range" min={0.5} max={5.0} step={0.5} value={inputs.rampTimePerCity}
                      onChange={(e) => handleInputChange('rampTimePerCity', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4" />

                {/* More Section */}
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">More</h3>
                <div className="space-y-1">
                  <a href="https://robotaxi-cost-model.vercel.app/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 transition-colors py-1.5">
                    Robotaxi Cost Model <ExternalLink size={14} className="text-gray-400" />
                  </a>
                  <a href="https://github.com/rafaelmaranon/autonomy-scale-roi" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 transition-colors py-1.5">
                    GitHub <ExternalLink size={14} className="text-gray-400" />
                  </a>
                  <button onClick={() => setShowDisclaimer(true)}
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors py-1.5 w-full text-left">
                    Disclaimer
                  </button>
                </div>
              </div>

              {/* Right Content - Map + Chart + Insights (scrollable) */}
              <div className="flex-1 px-8 py-4 overflow-y-auto">
               <div className="max-w-3xl">
                {/* Map */}
                <div className="h-[28vh] min-h-[180px]">
                  <CompactNetworkMap 
                    inputs={inputs}
                    outputs={outputs}
                    selectedPreset={selectedProfile}
                    yearData={activeYearData}
                    bindingCities={citySplit.bindingCities}
                    pendingCities={citySplit.pendingCities}
                    annotatedCities={citySplit.annotatedCities}
                    requestedCities={citySplit.requestedCities}
                  />
                </div>

                {/* Chart */}
                <div className="h-[35vh] min-h-[240px] flex flex-col mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <select
                      value={chartView}
                      onChange={(e) => setChartView(e.target.value)}
                      className="text-xs font-medium text-gray-700 border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer relative z-20 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value="netCash">Net cash (cumulative)</option>
                      <option value="paidTrips">Paid trips/week</option>
                      <option value="fleetSize">Fleet size</option>
                      <option value="productionMiles">Miles (cumulative)</option>
                    </select>
                  </div>
                  <div className="flex-1 min-h-0">
                    <CapitalCurveChart 
                      data={mergedData}
                      chartView={chartView}
                      activeIndex={activeYearIndex}
                      bindingAnchors={anchorSplit.bindingAnchors}
                      pendingPoints={anchorSplit.pendingPoints}
                      annotations={anchorSplit.annotations}
                      onHover={handleChartHover}
                      onMouseLeave={handleChartLeave}
                    />
                  </div>
                </div>

                {/* Insights */}
                <InsightsPanel inputs={inputs} outputs={outputs} activeYearData={activeYearData} onCityRequested={fetchAnchors} onAnchorsChanged={fetchAnchors} />
               </div>
              </div>
            </div>

            {/* Mobile Layout (<md): Segmented Map/Chart */}
            <div className="md:hidden flex flex-col flex-1 px-4 space-y-4">
              {/* Segmented Control */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('map')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'map'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setActiveView('chart')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'chart'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chart
                </button>
              </div>

              {/* Single View */}
              {activeView === 'map' ? (
                <div className="h-[240px]">
                  <CompactNetworkMap 
                    inputs={inputs}
                    outputs={outputs}
                    selectedPreset={selectedProfile}
                    yearData={activeYearData}
                    bindingCities={citySplit.bindingCities}
                    pendingCities={citySplit.pendingCities}
                    annotatedCities={citySplit.annotatedCities}
                    requestedCities={citySplit.requestedCities}
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="mb-2">
                    <select
                      value={chartView}
                      onChange={(e) => setChartView(e.target.value)}
                      className="text-xs font-medium text-gray-700 border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer relative z-20 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value="netCash">Net cash (cumulative)</option>
                      <option value="paidTrips">Paid trips/week</option>
                      <option value="fleetSize">Fleet size</option>
                      <option value="productionMiles">Miles (cumulative)</option>
                    </select>
                  </div>
                  <div className="h-[360px]">
                    <CapitalCurveChart 
                      data={mergedData}
                      chartView={chartView}
                      activeIndex={activeYearIndex}
                      bindingAnchors={anchorSplit.bindingAnchors}
                      pendingPoints={anchorSplit.pendingPoints}
                      annotations={anchorSplit.annotations}
                      onHover={handleChartHover}
                      onMouseLeave={handleChartLeave}
                    />
                  </div>
                </div>
              )}

              {/* Insights — below active view */}
              <InsightsPanel inputs={inputs} outputs={outputs} activeYearData={activeYearData} onCityRequested={fetchAnchors} onAnchorsChanged={fetchAnchors} />
            </div>

            {/* Mobile Inputs Drawer */}
            {showInputsDrawer && (
              <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/30" onClick={() => setShowInputsDrawer(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl p-5 overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Inputs</h3>
                    <button onClick={() => setShowInputsDrawer(false)} className="p-1 hover:bg-gray-100 rounded">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Cities per Year</label>
                        <span className="text-sm font-bold text-gray-900">{inputs.citiesPerYear}</span>
                      </div>
                      <input type="range" min={1} max={25} step={1} value={inputs.citiesPerYear}
                        onChange={(e) => handleInputChange('citiesPerYear', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Vehicles per City</label>
                        <span className="text-sm font-bold text-gray-900">{inputs.vehiclesPerCity.toLocaleString()}</span>
                      </div>
                      <input type="range" min={500} max={10000} step={250} value={inputs.vehiclesPerCity}
                        onChange={(e) => handleInputChange('vehiclesPerCity', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Annual R&D Spend</label>
                        <span className="text-sm font-bold text-gray-900">${inputs.annualRDSpend.toFixed(1)}B</span>
                      </div>
                      <input type="range" min={0.1} max={5.0} step={0.1} value={inputs.annualRDSpend}
                        onChange={(e) => handleInputChange('annualRDSpend', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Ramp Time per City</label>
                        <span className="text-sm font-bold text-gray-900">{inputs.rampTimePerCity.toFixed(1)} years</span>
                      </div>
                      <input type="range" min={0.5} max={5.0} step={0.5} value={inputs.rampTimePerCity}
                        onChange={(e) => handleInputChange('rampTimePerCity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-5" />

                  {/* More Section */}
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">More</h3>
                  <div className="space-y-1">
                    <a href="https://robotaxi-cost-model.vercel.app/" target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 transition-colors py-2">
                      Robotaxi Cost Model <ExternalLink size={14} className="text-gray-400" />
                    </a>
                    <a href="https://github.com/rafaelmaranon/autonomy-scale-roi" target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 transition-colors py-2">
                      GitHub <ExternalLink size={14} className="text-gray-400" />
                    </a>
                    <button onClick={() => { setShowInputsDrawer(false); setShowDisclaimer(true) }}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors py-2 w-full text-left">
                      Disclaimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDisclaimer(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Disclaimer</h2>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>Independent analytical project. Not affiliated with Waymo, Tesla or any company.</p>
              <p>All projections are illustrative simulations based on public information and user inputs.</p>
              <p>Community-submitted datapoints are added as Pending and do not affect results until reviewed.</p>

            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="mt-5 w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Version stamp — always visible */}
      <div className="fixed bottom-1 right-2 text-[10px] text-gray-400">
        v0.6.0
      </div>
    </div>
  )
}

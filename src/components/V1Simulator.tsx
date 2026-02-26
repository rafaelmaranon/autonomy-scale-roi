'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, SlidersHorizontal, X, ExternalLink } from 'lucide-react'
import { SimInputs, SimOutputs, SimYearData, ProfileConfig, profiles, getProfileByName, ProjectionInputs, defaultProjectionInputs } from '@/lib/sim-types'
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
  const [activeYearIndex, setActiveYearIndex] = useState<number>(profiles[0].inputs.yearsToSimulate - 1) // Default to final year
  const [chartView, setChartView] = useState<string>('netCash')
  const [activeView, setActiveView] = useState<'map' | 'chart'>('map')
  const [showInputsDrawer, setShowInputsDrawer] = useState<boolean>(false)
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false)
  const [anchors, setAnchors] = useState<HistoricalAnchorRow[]>([])
  const [projectionInputs, setProjectionInputs] = useState<ProjectionInputs>(defaultProjectionInputs)

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

  // Fallback: if somehow selectedProfile is 'tesla', force to 'Waymo'
  useEffect(() => {
    if (selectedProfile === 'tesla') {
      setSelectedProfile('Waymo')
      const waymoProfile = profiles.find(p => p.name === 'Waymo')
      if (waymoProfile) setInputs(waymoProfile.inputs)
    }
  }, [selectedProfile])

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
    // Fallback: if tesla is somehow selected, use waymo
    if (profileName === 'tesla') {
      profileName = 'Waymo'
    }
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

  // Auto-calculate CAGR from paid_trips_per_week anchors
  const autoCAGR = useMemo(() => {
    const tripAnchors = anchorSplit.bindingAnchors
      .filter(a => a.metric === 'paid_trips_per_week' && Number(a.value) > 0)
      .sort((a, b) => a.year - b.year)
    if (tripAnchors.length < 2) return null
    const first = tripAnchors[tripAnchors.length - 2]
    const last = tripAnchors[tripAnchors.length - 1]
    const span = last.year - first.year
    if (span <= 0 || Number(first.value) <= 0) return null
    return Math.pow(Number(last.value) / Number(first.value), 1 / span) - 1
  }, [anchorSplit.bindingAnchors])

  // Derive throughput from anchors: trips/week ÷ fleet at same year
  const anchorThroughput = useMemo(() => {
    const tripAnchors = anchorSplit.bindingAnchors
      .filter(a => a.metric === 'paid_trips_per_week' && Number(a.value) > 0)
      .sort((a, b) => a.year - b.year)
    const fleetAnchors = anchorSplit.bindingAnchors
      .filter(a => a.metric === 'fleet_size' && Number(a.value) > 0)
      .sort((a, b) => a.year - b.year)
    for (const trip of [...tripAnchors].reverse()) {
      const fleet = fleetAnchors.find(f => f.year === trip.year)
      if (fleet) return Number(trip.value) / Number(fleet.value)
    }
    return null
  }, [anchorSplit.bindingAnchors])

  // Compute full projection inputs including capacity fields from sim inputs
  const fullProjection = useMemo(() => {
    const profile = getProfileByName(selectedProfile)
    const utilization = profile?.multipliers.productionUtilization ?? 80
    const avgTripMiles = 6
    const fallbackThroughput = utilization * 7 / avgTripMiles
    return {
      ...projectionInputs,
      newVehiclesPerYear: inputs.citiesPerYear * inputs.vehiclesPerCity,
      tripsPerVehiclePerWeek: anchorThroughput ?? fallbackThroughput,
    }
  }, [projectionInputs, inputs.citiesPerYear, inputs.vehiclesPerCity, selectedProfile, anchorThroughput])

  // Merge simulation data with BINDING anchors only
  const mergedData = useMemo(() => {
    if (!outputs) return null
    return mergeTimeline(outputs.yearlyData, anchorSplit.bindingAnchors, fullProjection)
  }, [outputs, anchorSplit.bindingAnchors, fullProjection])

  // Get active year data for display (from merged timeline)
  const activeYearData = mergedData?.[activeYearIndex]
  const activeYear = activeYearData?.year || inputs.startYear + inputs.yearsToSimulate - 1

  // Handle city support (❤️ voting)
  const handleSupportCity = async (city: string): Promise<{ ok: boolean; count?: number }> => {
    try {
      const res = await fetch('/api/city-request/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      })
      const data = await res.json()
      if (data.ok) fetchAnchors() // Refresh anchors to get updated count
      return data
    } catch {
      return { ok: false }
    }
  }

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
                <option value="tesla" disabled>Tesla (soon)</option>
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
                    <div className="text-sm font-bold text-gray-900">{(activeYearData.cumulativeTotalMiles / 1e9).toFixed(1)}B</div>
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
                      <label className="text-xs font-medium text-gray-700">Profit per Mile</label>
                      <span className="text-sm font-bold text-gray-900">${inputs.profitPerMile.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0.10} max={2.00} step={0.05} value={inputs.profitPerMile}
                      onChange={(e) => handleInputChange('profitPerMile', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4" />

                {/* Market & Growth Section */}
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Market & Growth</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Early Growth CAGR</label>
                      <span className="text-sm font-bold text-gray-900">{(projectionInputs.earlyGrowthCAGR * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={10} max={300} step={5} value={Math.round(projectionInputs.earlyGrowthCAGR * 100)}
                      onChange={(e) => setProjectionInputs(prev => ({ ...prev, earlyGrowthCAGR: parseInt(e.target.value) / 100 }))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    {autoCAGR && <div className="text-[10px] text-gray-400 mt-0.5">Historical: {(autoCAGR * 100).toFixed(0)}%</div>}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Target Market Share</label>
                      <span className="text-sm font-bold text-gray-900">{(projectionInputs.targetMarketShare * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={5} max={100} step={5} value={Math.round(projectionInputs.targetMarketShare * 100)}
                      onChange={(e) => setProjectionInputs(prev => ({ ...prev, targetMarketShare: parseInt(e.target.value) / 100 }))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700">Global TAM</label>
                      <span className="text-sm font-bold text-gray-900">{(projectionInputs.globalTAM / 1e6).toFixed(0)}M/wk</span>
                    </div>
                    <input type="range" min={50} max={2000} step={10} value={Math.round(projectionInputs.globalTAM / 1e6)}
                      onChange={(e) => setProjectionInputs(prev => ({ ...prev, globalTAM: parseInt(e.target.value) * 1e6 }))}
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
                    onSupportCity={handleSupportCity}
                  />
                </div>

                {/* Chart */}
                <div className="flex flex-col mt-4 mb-4">
                  {/* Chart Controls */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                    <select
                      value={chartView}
                      onChange={(e) => setChartView(e.target.value)}
                      className="text-xs font-medium text-gray-700 border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value="netCash">Net cash (cumulative)</option>
                      <option value="paidTrips">Paid trips/week</option>
                      <option value="fleetSize">Fleet size</option>
                      <option value="productionMiles">Miles (cumulative)</option>
                    </select>
                  </div>
                  
                  {/* Chart Container */}
                  <div className="h-[35vh] min-h-[240px] mb-3">
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
                <div className="mt-4">
                  <InsightsPanel inputs={inputs} outputs={outputs} activeYearData={activeYearData} onCityRequested={fetchAnchors} onAnchorsChanged={fetchAnchors} />
                </div>
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
                    onSupportCity={handleSupportCity}
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Mobile Chart Controls */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                    <select
                      value={chartView}
                      onChange={(e) => setChartView(e.target.value)}
                      className="text-xs font-medium text-gray-700 border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    >
                      <option value="netCash">Net cash (cumulative)</option>
                      <option value="paidTrips">Paid trips/week</option>
                      <option value="fleetSize">Fleet size</option>
                      <option value="productionMiles">Miles (cumulative)</option>
                    </select>
                  </div>
                  
                  {/* Mobile Chart Container */}
                  <div className="h-[360px] mb-3">
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
              <div className="mt-4">
                <InsightsPanel inputs={inputs} outputs={outputs} activeYearData={activeYearData} onCityRequested={fetchAnchors} onAnchorsChanged={fetchAnchors} />
              </div>
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
                        <label className="text-sm font-medium text-gray-700">Profit per Mile</label>
                        <span className="text-sm font-bold text-gray-900">${inputs.profitPerMile.toFixed(2)}</span>
                      </div>
                      <input type="range" min={0.10} max={2.00} step={0.05} value={inputs.profitPerMile}
                        onChange={(e) => handleInputChange('profitPerMile', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-5" />

                  {/* Market & Growth Section */}
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Market & Growth</h3>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Early Growth CAGR</label>
                        <span className="text-sm font-bold text-gray-900">{(projectionInputs.earlyGrowthCAGR * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min={10} max={300} step={5} value={Math.round(projectionInputs.earlyGrowthCAGR * 100)}
                        onChange={(e) => setProjectionInputs(prev => ({ ...prev, earlyGrowthCAGR: parseInt(e.target.value) / 100 }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                      {autoCAGR && <div className="text-[10px] text-gray-400 mt-0.5">Historical: {(autoCAGR * 100).toFixed(0)}%</div>}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Target Market Share</label>
                        <span className="text-sm font-bold text-gray-900">{(projectionInputs.targetMarketShare * 100).toFixed(0)}%</span>
                      </div>
                      <input type="range" min={5} max={100} step={5} value={Math.round(projectionInputs.targetMarketShare * 100)}
                        onChange={(e) => setProjectionInputs(prev => ({ ...prev, targetMarketShare: parseInt(e.target.value) / 100 }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Global TAM</label>
                        <span className="text-sm font-bold text-gray-900">{(projectionInputs.globalTAM / 1e6).toFixed(0)}M/wk</span>
                      </div>
                      <input type="range" min={50} max={2000} step={10} value={Math.round(projectionInputs.globalTAM / 1e6)}
                        onChange={(e) => setProjectionInputs(prev => ({ ...prev, globalTAM: parseInt(e.target.value) * 1e6 }))}
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

// Canonical simulation types for V1.1 - single source of truth

// Core simulation inputs
export interface SimInputs {
  startYear: number
  yearsToSimulate: number
  citiesPerYear: number
  vehiclesPerCity: number
  profitPerMile: number
  annualRDSpend: number // in billions
  rampTimePerCity: number
  opsRevenueStartYear: number // Year when paid operations begin
  scalePhaseYear: number // Year when R&D tapering begins
}

// Yearly simulation data
export interface SimYearData {
  year: number
  citiesTotal: number
  vehiclesTotal: number
  vehiclesProduction: number
  vehiclesValidation: number
  productionMiles: number
  validationMiles: number
  cumulativeProductionMiles: number
  cumulativeTotalMiles: number
  productionTrips: number
  paidTripsPerWeek: number
  annualRDSpend: number
  cumulativeRDSpend: number
  operatingProfit: number
  netCashFlow: number // Operating profit minus R&D
  cumulativeNetCash: number // Can go negative for years
  roi: number
}

// Projection inputs for 3-constraint S-curve (separate from sim engine)
export interface ProjectionInputs {
  earlyGrowthCAGR: number      // e.g., 1.58 = 158%
  targetMarketShare: number    // e.g., 0.35 = 35%
  globalTAM: number            // trips/week, e.g., 230_000_000
  newVehiclesPerYear: number   // citiesPerYear * vehiclesPerCity
  tripsPerVehiclePerWeek: number // productionUtilization * 7 / avgTripMiles
  profitPerMile: number           // from SimInputs, for demand-consistent net cash
  opsRevenueStartYear: number     // from SimInputs, for S-curve in net cash computation
}

export const defaultProjectionInputs: ProjectionInputs = {
  earlyGrowthCAGR: 1.58,       // Auto-calculated from anchors, ~158% default
  targetMarketShare: 0.35,     // 35% market share
  globalTAM: 230_000_000,      // 230M trips/week global ride-hailing
  newVehiclesPerYear: 15_000,  // 10 cities * 1500 vehicles
  tripsPerVehiclePerWeek: 93.3,// 80 mi/day * 7 / 6 mi/trip
  profitPerMile: 0.50,          // Waymo default
  opsRevenueStartYear: 2018,    // Waymo default
}

// Simulation outputs
export interface SimOutputs {
  yearlyData: SimYearData[]
  breakEvenYear: number | null
  roiYear5: number
  roiYear10: number
}

// Profile configuration
export interface ProfileConfig {
  name: string
  description: string
  inputs: SimInputs
  multipliers: {
    rdTaperAfterBreakeven: number
    productionUtilization: number // miles per vehicle per day
    validationUtilization: number
  }
}

// Waymo Profile: Capital patience → infrastructure dominance
export const waymoProfile: ProfileConfig = {
  name: 'Waymo',
  description: 'Deep R&D → Infrastructure',
  inputs: {
    startYear: 2004,
    yearsToSimulate: 47, // 2004-2050
    citiesPerYear: 10, // Expansion rate for city launches
    vehiclesPerCity: 1500, // Conservative fleet size
    profitPerMile: 0.50, // Lower margin initially
    annualRDSpend: 1.2, // Sustained R&D investment
    rampTimePerCity: 3.0, // Longer ramp time for methodical approach
    opsRevenueStartYear: 2018, // Early paid ops start
    scalePhaseYear: 2025 // R&D tapering begins at scale phase
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.4,
    productionUtilization: 80, // Conservative utilization
    validationUtilization: 60
  }
}

// Tesla Profile: Software leverage → fast ROI
export const teslaProfile: ProfileConfig = {
  name: 'Tesla',
  description: 'Software Leverage',
  inputs: {
    startYear: 2025,
    yearsToSimulate: 26, // 2025-2050
    citiesPerYear: 20,
    vehiclesPerCity: 5000, // Higher density through enablement
    profitPerMile: 1.20, // Higher margins through software leverage
    annualRDSpend: 0.4, // Lower incremental R&D
    rampTimePerCity: 1.0, // Fast enablement
    opsRevenueStartYear: 2025, // Immediate revenue start
    scalePhaseYear: 2027 // Quick R&D tapering
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.3,
    productionUtilization: 150,
    validationUtilization: 40
  }
}

// Custom Profile: User-defined
export const customProfile: ProfileConfig = {
  name: 'Custom',
  description: 'User-defined',
  inputs: {
    startYear: 2025,
    yearsToSimulate: 26, // 2025-2050
    citiesPerYear: 10,
    vehiclesPerCity: 3000,
    profitPerMile: 0.80,
    annualRDSpend: 1.0,
    rampTimePerCity: 2.0,
    opsRevenueStartYear: 2026, // Standard revenue start
    scalePhaseYear: 2028 // Standard R&D tapering
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.5,
    productionUtilization: 120,
    validationUtilization: 50
  }
}

export const profiles: ProfileConfig[] = [waymoProfile, customProfile]

export function getProfileByName(name: string): ProfileConfig | undefined {
  return profiles.find(profile => profile.name === name)
}

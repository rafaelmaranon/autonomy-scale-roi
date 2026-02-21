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
  productionTrips: number
  paidTripsPerWeek: number
  annualRDSpend: number
  cumulativeRDSpend: number
  operatingProfit: number
  netCashFlow: number // Operating profit minus R&D
  cumulativeNetCash: number // Can go negative for years
  roi: number
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
  description: 'Deep R&D investment, methodical validation, long-term infrastructure play',
  inputs: {
    startYear: 2004,
    yearsToSimulate: 46, // 2004-2050
    citiesPerYear: 6,
    vehiclesPerCity: 2000,
    profitPerMile: 0.60,
    annualRDSpend: 1.5,
    rampTimePerCity: 2.5
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.4,
    productionUtilization: 100, // miles per vehicle per day
    validationUtilization: 70
  }
}

// Tesla Profile: Software leverage → fast ROI
export const teslaProfile: ProfileConfig = {
  name: 'Tesla',
  description: 'Software leverage, fast enablement, rapid scaling',
  inputs: {
    startYear: 2025,
    yearsToSimulate: 25, // 2025-2050
    citiesPerYear: 20,
    vehiclesPerCity: 5000,
    profitPerMile: 1.20,
    annualRDSpend: 0.4,
    rampTimePerCity: 1.0
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
  description: 'User-defined parameters',
  inputs: {
    startYear: 2025,
    yearsToSimulate: 25,
    citiesPerYear: 10,
    vehiclesPerCity: 3000,
    profitPerMile: 0.80,
    annualRDSpend: 1.0,
    rampTimePerCity: 2.0
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.5,
    productionUtilization: 120,
    validationUtilization: 50
  }
}

export const profiles: ProfileConfig[] = [waymoProfile, teslaProfile, customProfile]

export function getProfileByName(name: string): ProfileConfig | undefined {
  return profiles.find(profile => profile.name === name)
}

// Profile configurations for Waymo, Tesla, and Custom autonomy deployment scenarios

import { ProfileInputs, ProfileMultipliers } from './profile-calculator'

export interface ProfileConfig {
  name: string
  description: string
  inputs: ProfileInputs
  multipliers: ProfileMultipliers
}

// Waymo Profile: Capital patience → infrastructure dominance → multi-decade payoff
export const waymoProfile: ProfileConfig = {
  name: 'Waymo',
  description: 'Deep R&D investment, methodical validation, long-term infrastructure play',
  inputs: {
    startYear: 2004,
    yearsToSimulate: 46, // 2004-2050
    citiesPerYear: 6,
    vehiclesPerCity: 2000,
    profitPerMile: 0.60,
    annualRDSpend: 1.5, // $1.5B annually
    rampTimePerCity: 2.5,
    paidTripsPerWeekPerCity: 250000,
    avgTripMiles: 5.0,
    validationMilesPerCity: 2.0, // 2M miles validation per city
    validationFleetPerCity: 120,
    validationMilesPerVehiclePerDay: 70
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.4, // Reduce R&D by 60% after break-even
    productionMilesPerVehiclePerDay: 100, // Conservative utilization
    validationUtilization: 0.7 // High validation utilization
  }
}

// Tesla Profile: Software leverage → fast ROI
export const teslaProfile: ProfileConfig = {
  name: 'Tesla',
  description: 'Software leverage, fast enablement, rapid scaling',
  inputs: {
    startYear: 2025,
    yearsToSimulate: 25, // 2025-2050, but timeline shows 2004-2050
    citiesPerYear: 20,
    vehiclesPerCity: 5000, // Higher density through enablement
    profitPerMile: 1.20, // Higher margins through software leverage
    annualRDSpend: 0.4, // Lower incremental R&D
    rampTimePerCity: 1.0, // Fast enablement
    paidTripsPerWeekPerCity: 400000,
    avgTripMiles: 5.0,
    validationMilesPerCity: 0.3, // Lower validation burden
    validationFleetPerCity: 30,
    validationMilesPerVehiclePerDay: 40
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.3, // Reduce R&D by 70% after break-even
    productionMilesPerVehiclePerDay: 150, // Higher utilization through software
    validationUtilization: 0.4 // Lower validation utilization
  }
}

// Custom Profile: User-defined parameters
export const customProfile: ProfileConfig = {
  name: 'Custom',
  description: 'User-defined parameters with no preset multipliers',
  inputs: {
    startYear: 2025,
    yearsToSimulate: 25,
    citiesPerYear: 10,
    vehiclesPerCity: 3000,
    profitPerMile: 0.80,
    annualRDSpend: 1.0,
    rampTimePerCity: 2.0,
    paidTripsPerWeekPerCity: 300000,
    avgTripMiles: 5.0,
    validationMilesPerCity: 1.0,
    validationFleetPerCity: 75,
    validationMilesPerVehiclePerDay: 50
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.5, // Standard 50% reduction
    productionMilesPerVehiclePerDay: 120,
    validationUtilization: 0.5
  }
}

export const profiles: ProfileConfig[] = [waymoProfile, teslaProfile, customProfile]

export function getProfileByName(name: string): ProfileConfig | undefined {
  return profiles.find(profile => profile.name === name)
}

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
    citiesPerYear: 10, // Expansion rate for city launches
    vehiclesPerCity: 1500, // Conservative fleet size
    profitPerMile: 0.50, // Lower margin initially
    annualRDSpend: 1.2, // Sustained R&D investment
    rampTimePerCity: 3.0, // Longer ramp time for methodical approach
    opsRevenueStartYear: 2018, // Early paid ops start
    scalePhaseYear: 2025 // R&D tapering begins at scale phase
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.4, // Reduce R&D by 60% after break-even
    productionUtilization: 100, // Conservative utilization
    validationUtilization: 0.7 // High validation utilization
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
    vehiclesPerCity: 5000, // Higher density through enablement
    profitPerMile: 1.20, // Higher margins through software leverage
    annualRDSpend: 0.4, // Lower incremental R&D
    rampTimePerCity: 1.0, // Fast enablement
    opsRevenueStartYear: 2025, // Immediate revenue start
    scalePhaseYear: 2027 // Quick R&D tapering
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.3, // Reduce R&D by 70% after break-even
    productionUtilization: 150, // Higher utilization through software
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
    opsRevenueStartYear: 2026, // Standard revenue start
    scalePhaseYear: 2028 // Standard R&D tapering
  },
  multipliers: {
    rdTaperAfterBreakeven: 0.5, // Standard 50% reduction
    productionUtilization: 120,
    validationUtilization: 0.5
  }
}

export const profiles: ProfileConfig[] = [waymoProfile, customProfile]

export function getProfileByName(name: string): ProfileConfig | undefined {
  return profiles.find(profile => profile.name === name)
}

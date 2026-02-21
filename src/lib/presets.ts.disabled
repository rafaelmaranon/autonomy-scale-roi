import { ROIInputs } from './roi-calculator'

export interface Preset {
  name: string
  description: string
  inputs: ROIInputs
}

export const presets: Preset[] = [
  {
    name: 'Conservative',
    description: 'Conservative assumptions with slower expansion and lower margins',
    inputs: {
      fixedInvestment: 12.0, // $12B
      profitPerMile: 0.15, // $0.15 per mile
      citiesPerYear: 3, // 3 cities per year
      targetCities: 50, // 50 total cities
      vehiclesPerCity: 2000, // 2,000 vehicles per city
      milesPerVehiclePerYear: 50000, // 50,000 miles per vehicle per year
      cityRampTime: 3 // 3 years to reach full production
    }
  },
  {
    name: 'Base Case',
    description: 'Balanced assumptions representing realistic expectations',
    inputs: {
      fixedInvestment: 10.0, // $10B
      profitPerMile: 0.25, // $0.25 per mile
      citiesPerYear: 5, // 5 cities per year
      targetCities: 75, // 75 total cities
      vehiclesPerCity: 3000, // 3,000 vehicles per city
      milesPerVehiclePerYear: 60000, // 60,000 miles per vehicle per year
      cityRampTime: 2.5 // 2.5 years to reach full production
    }
  },
  {
    name: 'Aggressive',
    description: 'Aggressive expansion with rapid scaling and moderate margins',
    inputs: {
      fixedInvestment: 8.0, // $8B
      profitPerMile: 0.20, // $0.20 per mile
      citiesPerYear: 8, // 8 cities per year
      targetCities: 100, // 100 total cities
      vehiclesPerCity: 4000, // 4,000 vehicles per city
      milesPerVehiclePerYear: 70000, // 70,000 miles per vehicle per year
      cityRampTime: 2 // 2 years to reach full production
    }
  },
  {
    name: 'High Margin',
    description: 'Premium service model with high margins but slower expansion',
    inputs: {
      fixedInvestment: 15.0, // $15B
      profitPerMile: 0.45, // $0.45 per mile
      citiesPerYear: 4, // 4 cities per year
      targetCities: 60, // 60 total cities
      vehiclesPerCity: 2500, // 2,500 vehicles per city
      milesPerVehiclePerYear: 45000, // 45,000 miles per vehicle per year
      cityRampTime: 2.5 // 2.5 years to reach full production
    }
  }
]

export function getPresetByName(name: string): Preset | undefined {
  return presets.find(preset => preset.name === name)
}

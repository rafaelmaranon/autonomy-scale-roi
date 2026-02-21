// Clean simulation calculator using canonical types

import { SimInputs, SimYearData, SimOutputs, ProfileConfig } from './sim-types'

export class SimCalculator {
  static calculate(inputs: SimInputs, multipliers: ProfileConfig['multipliers']): SimOutputs {
    const yearlyData: SimYearData[] = []
    let breakEvenYear: number | null = null
    
    // Simulate each year
    for (let yearOffset = 0; yearOffset < inputs.yearsToSimulate; yearOffset++) {
      const currentYear = inputs.startYear + yearOffset
      const yearData = this.calculateYearData(currentYear, yearOffset, inputs, multipliers, yearlyData)
      yearlyData.push(yearData)
      
      // Check for break-even
      if (!breakEvenYear && yearData.cumulativeNetCash >= 0) {
        breakEvenYear = currentYear
      }
    }
    
    // Calculate ROI for specific years
    const year5Index = Math.min(4, yearlyData.length - 1)
    const year10Index = Math.min(9, yearlyData.length - 1)
    const year5Data = yearlyData[year5Index]
    const year10Data = yearlyData[year10Index]
    
    return {
      yearlyData,
      breakEvenYear,
      roiYear5: year5Data?.roi || 0,
      roiYear10: year10Data?.roi || 0
    }
  }

  private static calculateYearData(
    currentYear: number,
    yearOffset: number,
    inputs: SimInputs,
    multipliers: ProfileConfig['multipliers'],
    previousData: SimYearData[]
  ): SimYearData {
    
    // Calculate cities and vehicles
    const citiesTotal = Math.min((yearOffset + 1) * inputs.citiesPerYear, inputs.citiesPerYear * inputs.yearsToSimulate)
    
    let vehiclesTotal = 0
    let vehiclesProduction = 0
    let vehiclesValidation = 0
    
    // Calculate vehicles across all city cohorts
    for (let cohortYear = 0; cohortYear <= yearOffset; cohortYear++) {
      const cohortAge = yearOffset - cohortYear + 1
      const rampProgress = Math.min(1, cohortAge / inputs.rampTimePerCity)
      const cohortVehicles = inputs.citiesPerYear * inputs.vehiclesPerCity * rampProgress
      
      vehiclesTotal += cohortVehicles
      
      // Split production vs validation based on ramp completion
      if (cohortAge >= inputs.rampTimePerCity) {
        vehiclesProduction += cohortVehicles
      } else {
        vehiclesValidation += cohortVehicles
      }
    }
    
    // Apply 3-phase scaling discipline for realistic Waymo curve
    let productionCapacityMultiplier = 1.0
    
    // PHASE 1: 2004-2017 - Pure R&D, no commercial production
    if (currentYear <= 2017) {
      productionCapacityMultiplier = 0
    }
    // PHASE 2: 2018-2024 - Limited commercialization, capped at 25% capacity
    else if (currentYear >= 2018 && currentYear <= 2024) {
      const commercialProgress = (currentYear - 2018 + 1) / 7 // 7 years from 2018-2024
      productionCapacityMultiplier = Math.min(commercialProgress * 0.25, 0.25)
    }
    // PHASE 3: 2025+ - Full scaling allowed
    else {
      productionCapacityMultiplier = 1.0
    }
    
    // Apply capacity multiplier to production vehicles
    vehiclesProduction = vehiclesProduction * productionCapacityMultiplier
    
    // Calculate miles
    const productionMiles = vehiclesProduction * multipliers.productionUtilization * 365
    const validationMiles = vehiclesValidation * multipliers.validationUtilization * 365
    
    // Calculate trips (production only, 6 miles per trip average)
    const productionTrips = Math.round(productionMiles / 6)
    const paidTripsPerWeek = Math.round(productionTrips / 52)
    
    // Calculate economics with revenue ramp
    let operatingProfit = 0
    
    // Only generate revenue after ops revenue start year
    if (currentYear >= inputs.opsRevenueStartYear) {
      // S-curve revenue ramp: slow → steep → plateau
      const yearsIntoOps = currentYear - inputs.opsRevenueStartYear
      const rampProgress = Math.min(1, yearsIntoOps / 7) // 7-year ramp to full revenue
      const sCurveMultiplier = 3 * Math.pow(rampProgress, 2) - 2 * Math.pow(rampProgress, 3) // S-curve formula
      operatingProfit = productionMiles * inputs.profitPerMile * sCurveMultiplier
    }
    
    // R&D with tapering after scale phase (not break-even)
    const hasReachedScalePhase = currentYear >= inputs.scalePhaseYear
    const rdMultiplier = hasReachedScalePhase ? multipliers.rdTaperAfterBreakeven : 1.0
    const annualRDSpend = inputs.annualRDSpend * rdMultiplier
    const cumulativeRDSpend = (previousData[previousData.length - 1]?.cumulativeRDSpend || 0) + annualRDSpend
    
    // Net cash flow (can go negative for years)
    const netCashFlow = operatingProfit - (annualRDSpend * 1e9) // Convert R&D to dollars
    const cumulativeNetCash = (previousData[previousData.length - 1]?.cumulativeNetCash || 0) + netCashFlow
    
    // ROI calculation
    const totalRDInvestment = cumulativeRDSpend * 1e9
    const roi = totalRDInvestment > 0 ? (cumulativeNetCash / totalRDInvestment) * 100 : 0
    
    return {
      year: currentYear,
      citiesTotal: Math.round(citiesTotal),
      vehiclesTotal: Math.round(vehiclesTotal),
      vehiclesProduction: Math.round(vehiclesProduction),
      vehiclesValidation: Math.round(vehiclesValidation),
      productionMiles,
      validationMiles,
      productionTrips,
      paidTripsPerWeek,
      annualRDSpend,
      cumulativeRDSpend,
      operatingProfit,
      netCashFlow,
      cumulativeNetCash,
      roi
    }
  }

  // Helper methods
  static formatNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toFixed(0)
  }

  static formatCurrency(num: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  static formatPercentage(num: number): string {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }
}

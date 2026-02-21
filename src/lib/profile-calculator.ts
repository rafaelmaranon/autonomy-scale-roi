// Profile-based ROI calculation engine for autonomy deployment scenarios

export interface ProfileInputs {
  startYear: number
  yearsToSimulate: number
  citiesPerYear: number
  vehiclesPerCity: number
  profitPerMile: number
  annualRDSpend: number // in billions
  rampTimePerCity: number
  paidTripsPerWeekPerCity: number
  avgTripMiles: number
  validationMilesPerCity: number // in millions
  validationFleetPerCity: number
  validationMilesPerVehiclePerDay: number
}

export interface ProfileMultipliers {
  rdTaperAfterBreakeven: number
  productionMilesPerVehiclePerDay: number
  validationUtilization: number
}

export interface ProfileYearlyData {
  year: number
  citiesLaunched: number
  totalCities: number
  totalVehicles: number
  vehiclesProduction: number
  vehiclesValidation: number
  vehiclesAddedThisYear: number
  yearlyMiles: number
  cumulativeMiles: number
  productionMiles: number
  validationMiles: number
  cumulativeProductionMiles: number
  cumulativeValidationMiles: number
  productionTrips: number
  cumulativeProductionTrips: number
  paidTripsPerWeek: number
  annualRDSpend: number
  cumulativeRDSpend: number
  operatingProfit: number
  cumulativeOperatingProfit: number
  netCashFlow: number // Operating profit minus R&D
  cumulativeNetCash: number // Cumulative net cash (can go negative)
  roi: number // ROI as percentage based on cumulative R&D
}

export interface ProfileOutputs {
  breakEvenYear: number | null
  roiYear5: number
  roiYear10: number
  totalNetworkMiles5y: number
  totalNetworkMiles10y: number
  rdAmortizedPerMile5y: number
  rdAmortizedPerMile10y: number
  requiredCitiesFor5YearBreakeven: number
  yearlyData: ProfileYearlyData[]
}

export class ProfileCalculator {
  static calculate(inputs: ProfileInputs, multipliers: ProfileMultipliers): ProfileOutputs {
    const yearlyData: ProfileYearlyData[] = []
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
    
    // Calculate metrics for specific years
    const year5Index = Math.min(4, yearlyData.length - 1)
    const year10Index = Math.min(9, yearlyData.length - 1)
    const year5Data = yearlyData[year5Index]
    const year10Data = yearlyData[year10Index]
    
    return {
      yearlyData,
      breakEvenYear,
      roiYear5: year5Data?.roi || 0,
      roiYear10: year10Data?.roi || 0,
      totalNetworkMiles5y: year5Data?.cumulativeMiles || 0,
      totalNetworkMiles10y: year10Data?.cumulativeMiles || 0,
      rdAmortizedPerMile5y: year5Data && year5Data.cumulativeMiles > 0 ? 
        (year5Data.cumulativeRDSpend * 1e9) / year5Data.cumulativeMiles : 0,
      rdAmortizedPerMile10y: year10Data && year10Data.cumulativeMiles > 0 ? 
        (year10Data.cumulativeRDSpend * 1e9) / year10Data.cumulativeMiles : 0,
      requiredCitiesFor5YearBreakeven: 50 // Placeholder
    }
  }

  private static calculateYearData(
    currentYear: number, 
    yearOffset: number, 
    inputs: ProfileInputs, 
    multipliers: ProfileMultipliers, 
    previousData: ProfileYearlyData[]
  ): ProfileYearlyData {
    
    // Calculate cities launched this year
    const citiesLaunched = inputs.citiesPerYear
    
    // Calculate total cities launched by this year
    const totalCities = Math.min(citiesLaunched * (yearOffset + 1), inputs.citiesPerYear * inputs.yearsToSimulate)
    
    // Calculate vehicles across all city cohorts
    let totalVehicles = 0
    let vehiclesProduction = 0
    let vehiclesValidation = 0
    
    // For each cohort of cities launched in previous years
    for (let cohortYear = 0; cohortYear <= yearOffset; cohortYear++) {
      const cohortAge = yearOffset - cohortYear + 1
      const rampProgress = Math.min(1, cohortAge / inputs.rampTimePerCity)
      const cohortVehicles = inputs.citiesPerYear * inputs.vehiclesPerCity * rampProgress
      
      totalVehicles += cohortVehicles
      
      // Split production vs validation based on ramp completion
      if (cohortAge >= inputs.rampTimePerCity) {
        vehiclesProduction += cohortVehicles
      } else {
        vehiclesValidation += cohortVehicles
      }
    }
    
    // Add dedicated validation fleet
    vehiclesValidation += totalCities * inputs.validationFleetPerCity
    totalVehicles += totalCities * inputs.validationFleetPerCity
    
    // Calculate vehicles added this year
    const previousTotalVehicles = previousData[previousData.length - 1]?.totalVehicles || 0
    const vehiclesAddedThisYear = totalVehicles - previousTotalVehicles
    
    // Calculate miles
    const productionMiles = vehiclesProduction * multipliers.productionMilesPerVehiclePerDay * 365
    const validationMiles = vehiclesValidation * inputs.validationMilesPerVehiclePerDay * 365 * multipliers.validationUtilization
    const yearlyMiles = productionMiles + validationMiles
    
    // Calculate trips (production only)
    const productionTrips = Math.round(productionMiles / inputs.avgTripMiles)
    const paidTripsPerWeek = Math.round(productionTrips / 52)
    
    // Calculate cumulative values
    const previousData_ = previousData[previousData.length - 1]
    const cumulativeMiles = (previousData_?.cumulativeMiles || 0) + yearlyMiles
    const cumulativeProductionMiles = (previousData_?.cumulativeProductionMiles || 0) + productionMiles
    const cumulativeValidationMiles = (previousData_?.cumulativeValidationMiles || 0) + validationMiles
    const cumulativeProductionTrips = (previousData_?.cumulativeProductionTrips || 0) + productionTrips
    
    // Calculate economics
    const operatingProfit = productionMiles * inputs.profitPerMile
    const cumulativeOperatingProfit = (previousData_?.cumulativeOperatingProfit || 0) + operatingProfit
    
    // R&D with tapering after break-even
    const hasReachedBreakeven = previousData_?.cumulativeNetCash && previousData_.cumulativeNetCash >= 0
    const rdMultiplier = hasReachedBreakeven ? multipliers.rdTaperAfterBreakeven : 1.0
    const annualRDSpend = inputs.annualRDSpend * rdMultiplier
    const cumulativeRDSpend = (previousData_?.cumulativeRDSpend || 0) + annualRDSpend
    
    // Net cash flow
    const netCashFlow = operatingProfit - (annualRDSpend * 1e9) // Convert R&D to dollars
    const cumulativeNetCash = (previousData_?.cumulativeNetCash || 0) + netCashFlow
    
    // ROI calculation
    const totalRDInvestment = cumulativeRDSpend * 1e9 // Convert to dollars
    const roi = totalRDInvestment > 0 ? (cumulativeNetCash / totalRDInvestment) * 100 : 0
    
    return {
      year: currentYear,
      citiesLaunched,
      totalCities,
      totalVehicles: Math.round(totalVehicles),
      vehiclesProduction: Math.round(vehiclesProduction),
      vehiclesValidation: Math.round(vehiclesValidation),
      vehiclesAddedThisYear: Math.round(vehiclesAddedThisYear),
      yearlyMiles,
      cumulativeMiles,
      productionMiles,
      validationMiles,
      cumulativeProductionMiles,
      cumulativeValidationMiles,
      productionTrips,
      cumulativeProductionTrips,
      paidTripsPerWeek,
      annualRDSpend,
      cumulativeRDSpend,
      operatingProfit,
      cumulativeOperatingProfit,
      netCashFlow,
      cumulativeNetCash,
      roi
    }
  }

  // Helper methods for formatting
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

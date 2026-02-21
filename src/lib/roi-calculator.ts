// Core ROI calculation engine for autonomy scale economics

export interface ROIInputs {
  fixedInvestment: number // Total autonomy investment in billions
  profitPerMile: number // Profit per mile in dollars
  citiesPerYear: number // Cities launched per year
  targetCities: number // Total target cities
  vehiclesPerCity: number // Vehicles per city at full scale
  milesPerVehiclePerYear: number // Miles per vehicle per year
  cityRampTime: number // Years to reach full production per city
}

export interface ROIOutputs {
  breakEvenYear: number | null
  roiYear5: number
  roiYear10: number
  totalNetworkMiles5y: number
  totalNetworkMiles10y: number
  rdAmortizedPerMile5y: number
  rdAmortizedPerMile10y: number
  requiredCitiesFor5YearBreakeven: number
  yearlyData: YearlyData[]
}

export interface YearlyData {
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
  yearlyProfit: number
  cumulativeProfit: number
  netProfit: number // Cumulative profit minus fixed investment
  roi: number // ROI as percentage
}

export class ROICalculator {
  static calculate(inputs: ROIInputs): ROIOutputs {
    // Get simulation results
    const simulationResult = this.simulate(inputs)
    
    // Calculate required cities for 5-year breakeven
    const requiredCitiesFor5YearBreakeven = this.calculateRequiredCitiesForBreakeven(inputs, 5)
    
    // Calculate additional derived metrics
    const year5Data = simulationResult.yearlyData[4] // Index 4 = Year 5
    const year10Data = simulationResult.yearlyData[9] // Index 9 = Year 10

    return {
      breakEvenYear: simulationResult.breakEvenYear,
      roiYear5: simulationResult.roiYear5,
      roiYear10: simulationResult.roiYear10,
      totalNetworkMiles5y: year5Data?.cumulativeMiles || 0,
      totalNetworkMiles10y: year10Data?.cumulativeMiles || 0,
      rdAmortizedPerMile5y: year5Data ? inputs.fixedInvestment * 1e9 / year5Data.cumulativeMiles : 0,
      rdAmortizedPerMile10y: year10Data ? inputs.fixedInvestment * 1e9 / year10Data.cumulativeMiles : 0,
      requiredCitiesFor5YearBreakeven,
      yearlyData: simulationResult.yearlyData
    }
  }

  private static simulate(inputs: ROIInputs) {
    const yearlyData: YearlyData[] = []
    let breakEvenYear: number | null = null
    
    // Calculate for 15 years to ensure we capture long-term trends
    for (let year = 1; year <= 15; year++) {
      const data = this.calculateYearData(year, inputs, yearlyData)
      yearlyData.push(data)
      
      // Check for break-even (first year where net profit >= 0)
      if (breakEvenYear === null && data.netProfit >= 0) {
        breakEvenYear = year
      }
    }

    const year5Data = yearlyData[4] // Index 4 = Year 5
    const year10Data = yearlyData[9] // Index 9 = Year 10

    return {
      yearlyData,
      breakEvenYear,
      roiYear5: year5Data?.roi || 0,
      roiYear10: year10Data?.roi || 0
    }
  }

  private static calculateYearData(year: number, inputs: ROIInputs, previousData: YearlyData[]): YearlyData {
    // Calculate cities launched this year
    const citiesLaunched = Math.min(inputs.citiesPerYear, Math.max(0, inputs.targetCities - (year - 1) * inputs.citiesPerYear))
    
    // Calculate total cities launched by this year
    const totalCities = Math.min(inputs.targetCities, year * inputs.citiesPerYear)
    
    // Calculate total vehicles across all cities, split by production/validation
    let totalVehicles = 0
    let vehiclesProduction = 0
    let vehiclesValidation = 0
    
    for (let cityYear = 1; cityYear <= year; cityYear++) {
      const citiesLaunchedInYear = Math.min(
        inputs.citiesPerYear,
        Math.max(0, inputs.targetCities - (cityYear - 1) * inputs.citiesPerYear)
      )
      
      if (citiesLaunchedInYear <= 0) continue
      
      const yearsActive = year - cityYear + 1
      const rampProgress = Math.min(1, yearsActive / inputs.cityRampTime)
      const vehiclesThisYear = citiesLaunchedInYear * inputs.vehiclesPerCity * rampProgress
      
      totalVehicles += vehiclesThisYear
      
      // Split production vs validation based on ramp time
      if (yearsActive >= inputs.cityRampTime) {
        vehiclesProduction += vehiclesThisYear
      } else {
        vehiclesValidation += vehiclesThisYear
      }
    }

    // Calculate vehicles added this year
    const previousTotalVehicles = previousData[previousData.length - 1]?.totalVehicles || 0
    const vehiclesAddedThisYear = totalVehicles - previousTotalVehicles

    // Calculate miles breakdown
    const averageTripLength = 6 // miles per trip (reasonable urban average)
    const validationUtilization = 0.3 // Validation vehicles run at 30% utilization
    
    const productionMiles = vehiclesProduction * inputs.milesPerVehiclePerYear
    const validationMiles = vehiclesValidation * inputs.milesPerVehiclePerYear * validationUtilization
    const yearlyMiles = productionMiles + validationMiles
    
    // Calculate trips (production only)
    const productionTrips = Math.round(productionMiles / averageTripLength)
    
    // Calculate cumulative values
    const previousCumulativeMiles = previousData[previousData.length - 1]?.cumulativeMiles || 0
    const previousCumulativeProductionMiles = previousData[previousData.length - 1]?.cumulativeProductionMiles || 0
    const previousCumulativeValidationMiles = previousData[previousData.length - 1]?.cumulativeValidationMiles || 0
    const previousCumulativeProductionTrips = previousData[previousData.length - 1]?.cumulativeProductionTrips || 0
    
    const cumulativeMiles = previousCumulativeMiles + yearlyMiles
    const cumulativeProductionMiles = previousCumulativeProductionMiles + productionMiles
    const cumulativeValidationMiles = previousCumulativeValidationMiles + validationMiles
    const cumulativeProductionTrips = previousCumulativeProductionTrips + productionTrips
    
    // Calculate profits
    const yearlyProfit = yearlyMiles * inputs.profitPerMile
    const previousCumulativeProfit = previousData[previousData.length - 1]?.cumulativeProfit || 0
    const cumulativeProfit = previousCumulativeProfit + yearlyProfit
    
    const fixedInvestmentDollars = inputs.fixedInvestment * 1e9 // Convert billions to dollars
    const netProfit = cumulativeProfit - fixedInvestmentDollars
    const roi = (netProfit / fixedInvestmentDollars) * 100

    return {
      year,
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
      yearlyProfit,
      cumulativeProfit,
      netProfit,
      roi
    }
  }

  private static calculateRequiredCitiesForBreakeven(inputs: ROIInputs, targetYear: number): number {
    // Iterate through candidate city counts to find minimum needed for break-even in target year
    for (let candidate = 1; candidate <= 500; candidate++) {
      const modifiedInputs = { ...inputs, targetCities: candidate }
      const simulationResult = this.simulate(modifiedInputs)
      
      if (simulationResult.breakEvenYear !== null && simulationResult.breakEvenYear <= targetYear) {
        return candidate
      }
    }
    
    // If no solution found within reasonable bounds, return a high number
    return 500
  }

  // Helper method to format large numbers
  static formatNumber(num: number): string {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`
    }
    return num.toFixed(0)
  }

  // Helper method to format currency
  static formatCurrency(num: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Helper method to format percentages
  static formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`
  }
}

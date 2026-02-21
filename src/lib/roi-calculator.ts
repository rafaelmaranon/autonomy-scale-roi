// Core ROI calculation engine for autonomy scale economics

export interface ROIInputs {
  startYear: number // Starting year for simulation
  yearsToSimulate: number // Number of years to simulate
  citiesPerYear: number // Cities launched per year
  vehiclesPerCity: number // Vehicles per city at full scale
  profitPerMile: number // Profit per mile in dollars
  annualRDSpend: number // Annual R&D spend in billions
  rampTimePerCity: number // Years to reach full production per city
  paidTripsPerWeekPerCity: number // Paid trips per week per city at maturity
  avgTripMiles: number // Average trip length in miles
  validationMilesPerCity: number // Validation miles per city in millions
  validationFleetPerCity: number // Validation vehicles per city
  validationMilesPerVehiclePerDay: number // Validation miles per vehicle per day
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
  paidTripsPerWeek: number
  annualRDSpend: number
  cumulativeRDSpend: number
  operatingProfit: number
  cumulativeOperatingProfit: number
  netCashFlow: number // Operating profit minus R&D
  cumulativeNetCash: number // Cumulative net cash (can go negative)
  roi: number // ROI as percentage
}

export class ROICalculator {
  static calculate(inputs: ROIInputs, profileMultipliers?: any): ROIOutputs {
    // Get simulation results
    const simulationResult = this.simulate(inputs, profileMultipliers)
    
    // Calculate additional derived metrics
    const year5Index = Math.min(4, simulationResult.yearlyData.length - 1)
    const year10Index = Math.min(9, simulationResult.yearlyData.length - 1)
    const year5Data = simulationResult.yearlyData[year5Index]
    const year10Data = simulationResult.yearlyData[year10Index]

    return {
      ...simulationResult,
      totalNetworkMiles5y: year5Data?.cumulativeMiles || 0,
      totalNetworkMiles10y: year10Data?.cumulativeMiles || 0,
      rdAmortizedPerMile5y: year5Data ? (simulationResult.totalRDSpend) / year5Data.cumulativeMiles : 0,
      rdAmortizedPerMile10y: year10Data ? (simulationResult.totalRDSpend) / year10Data.cumulativeMiles : 0,
      requiredCitiesFor5YearBreakeven: 50 // Placeholder for now
    }
  }

  private static simulate(inputs: ROIInputs, profileMultipliers?: any): { 
    yearlyData: YearlyData[], 
    breakEvenYear: number | null, 
    roiYear5: number, 
    roiYear10: number,
    totalRDSpend: number
  } {
    const yearlyData: YearlyData[] = []
    let totalRDSpend = 0
    let breakEvenYear: number | null = null
    
    // Calculate total cities needed (estimate based on years and cities per year)
    const totalCities = inputs.citiesPerYear * Math.ceil(inputs.yearsToSimulate * 0.8) // Conservative estimate
    
    // Simulate each year
    for (let yearOffset = 0; yearOffset < inputs.yearsToSimulate; yearOffset++) {
      const currentYear = inputs.startYear + yearOffset
      const yearData = this.calculateYearData(currentYear, yearOffset + 1, inputs, yearlyData, profileMultipliers, totalCities)
      yearlyData.push(yearData)
      totalRDSpend += yearData.annualRDSpend * 1e9 // Convert to dollars
      
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
      roiYear10: year10Data?.roi || 0,
      totalRDSpend
    }
  }

  private static calculateYearData(year: number, yearOffset: number, inputs: ROIInputs, previousData: YearlyData[], profileMultipliers?: any, maxCities?: number): YearlyData {
    // Placeholder implementation - this will be replaced by ProfileCalculator
    return {
      year,
      citiesLaunched: 0,
      totalCities: 0,
      totalVehicles: 0,
      vehiclesProduction: 0,
      vehiclesValidation: 0,
      vehiclesAddedThisYear: 0,
      yearlyMiles: 0,
      cumulativeMiles: 0,
      productionMiles: 0,
      validationMiles: 0,
      cumulativeProductionMiles: 0,
      cumulativeValidationMiles: 0,
      productionTrips: 0,
      cumulativeProductionTrips: 0,
      paidTripsPerWeek: 0,
      annualRDSpend: 0,
      cumulativeRDSpend: 0,
      operatingProfit: 0,
      cumulativeOperatingProfit: 0,
      netCashFlow: 0,
      cumulativeNetCash: 0,
      roi: 0
    }
  }

  private static calculateRequiredCitiesForBreakeven(inputs: ROIInputs, targetYear: number): number {
    // Placeholder implementation
    return 50
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

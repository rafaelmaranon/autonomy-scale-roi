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
  yearlyMiles: number
  cumulativeMiles: number
  yearlyProfit: number
  cumulativeProfit: number
  netProfit: number // Cumulative profit minus fixed investment
  roi: number // ROI as percentage
}

export class ROICalculator {
  static calculate(inputs: ROIInputs): ROIOutputs {
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
      breakEvenYear,
      roiYear5: year5Data?.roi || 0,
      roiYear10: year10Data?.roi || 0,
      totalNetworkMiles5y: year5Data?.cumulativeMiles || 0,
      totalNetworkMiles10y: year10Data?.cumulativeMiles || 0,
      rdAmortizedPerMile5y: year5Data ? inputs.fixedInvestment * 1e9 / year5Data.cumulativeMiles : 0,
      rdAmortizedPerMile10y: year10Data ? inputs.fixedInvestment * 1e9 / year10Data.cumulativeMiles : 0,
      requiredCitiesFor5YearBreakeven: this.calculateRequiredCitiesForBreakeven(inputs, 5),
      yearlyData
    }
  }

  private static calculateYearData(
    year: number, 
    inputs: ROIInputs, 
    previousData: YearlyData[]
  ): YearlyData {
    // Calculate cities launched this year (capped by target)
    const citiesLaunched = Math.min(inputs.citiesPerYear, 
      Math.max(0, inputs.targetCities - (year - 1) * inputs.citiesPerYear))
    
    // Total cities launched by end of this year
    const totalCities = Math.min(inputs.targetCities, year * inputs.citiesPerYear)
    
    // Calculate total vehicles considering city ramp time
    let totalVehicles = 0
    for (let cityYear = 1; cityYear <= year; cityYear++) {
      const citiesFromThisYear = Math.min(inputs.citiesPerYear,
        Math.max(0, inputs.targetCities - (cityYear - 1) * inputs.citiesPerYear))
      
      const yearsOperating = year - cityYear + 1
      const rampProgress = Math.min(1, yearsOperating / inputs.cityRampTime)
      
      totalVehicles += citiesFromThisYear * inputs.vehiclesPerCity * rampProgress
    }

    // Calculate miles and profits
    const yearlyMiles = totalVehicles * inputs.milesPerVehiclePerYear
    const previousCumulativeMiles = previousData[previousData.length - 1]?.cumulativeMiles || 0
    const cumulativeMiles = previousCumulativeMiles + yearlyMiles
    
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
      yearlyMiles,
      cumulativeMiles,
      yearlyProfit,
      cumulativeProfit,
      netProfit,
      roi
    }
  }

  private static calculateRequiredCitiesForBreakeven(inputs: ROIInputs, targetYear: number): number {
    // Binary search to find minimum cities needed for break-even in target year
    let low = 1
    let high = 1000 // Reasonable upper bound
    let result = high

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const testInputs = { ...inputs, targetCities: mid }
      const testResult = this.calculate(testInputs)
      
      if (testResult.breakEvenYear !== null && testResult.breakEvenYear <= targetYear) {
        result = mid
        high = mid - 1
      } else {
        low = mid + 1
      }
    }

    return result
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

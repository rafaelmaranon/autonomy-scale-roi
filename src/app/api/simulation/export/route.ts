import { NextResponse } from 'next/server'
import { SimCalculator } from '@/lib/sim-calculator'
import { waymoProfile, teslaProfile, customProfile, ProfileConfig } from '@/lib/sim-types'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Enriched cost/revenue assumptions
const ASSUMPTIONS = {
  revenuePerMile: 2.50,        // Gross fare per mile (industry avg $2-3)
  vehicleCostUsd: 200_000,     // Cost per AV (sensors + vehicle)
  avgTripMiles: 6,             // Average trip length in miles
  npvDiscountRate: 0.08,       // 8% annual discount rate
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const profileNames = body.profiles || ['Waymo', 'Tesla', 'Custom']

    const profileMap: Record<string, ProfileConfig> = {
      Waymo: waymoProfile,
      Tesla: teslaProfile,
      Custom: customProfile,
    }

    const allRows: any[] = []

    for (const profileName of profileNames) {
      const profile = profileMap[profileName]
      if (!profile) continue

      const { inputs, multipliers } = profile

      // Run the base simulation
      const result = SimCalculator.calculate(inputs, multipliers)

      // Enriched tracking variables
      let cumulativeProductionMiles = 0
      let cumulativeValidationMiles = 0
      let cumulativeTotalMiles = 0
      let cumulativeTrips = 0
      let cumulativeCapex = 0
      let cumulativeNetCashInclCapex = 0
      let npvCumulative = 0
      let prevCitiesTotal = 0
      let prevVehiclesTotal = 0

      for (let i = 0; i < result.yearlyData.length; i++) {
        const d = result.yearlyData[i]
        const yearOffset = d.year - inputs.startYear

        // --- Recompute intermediate multipliers (not stored in SimYearData) ---
        const opsStartOffset = inputs.opsRevenueStartYear - inputs.startYear
        const expansionYears = Math.max(0, yearOffset - opsStartOffset + 1)

        // Production capacity multiplier (3-phase)
        let productionCapacityMultiplier = 1.0
        if (d.year <= 2017) {
          productionCapacityMultiplier = 0
        } else if (d.year >= 2018 && d.year <= 2024) {
          const commercialProgress = (d.year - 2018 + 1) / 7
          productionCapacityMultiplier = Math.min(commercialProgress * 0.25, 0.25)
        }

        // S-curve multiplier
        let sCurveMultiplier = 0
        let rampProgress = 0
        if (d.year >= inputs.opsRevenueStartYear) {
          const yearsIntoOps = d.year - inputs.opsRevenueStartYear
          rampProgress = Math.min(1, yearsIntoOps / 7)
          sCurveMultiplier = 3 * Math.pow(rampProgress, 2) - 2 * Math.pow(rampProgress, 3)
        }

        // R&D multiplier
        const rdMultiplier = d.year >= inputs.scalePhaseYear ? multipliers.rdTaperAfterBreakeven : 1.0

        // Phase label
        let phase = 'R&D'
        if (d.year >= 2025) phase = 'Full Scale'
        else if (d.year >= 2018) phase = 'Limited Commercial'

        // --- Enriched calculations ---
        const totalMiles = d.productionMiles + d.validationMiles
        cumulativeProductionMiles += d.productionMiles
        cumulativeValidationMiles += d.validationMiles
        cumulativeTotalMiles += totalMiles
        cumulativeTrips += d.productionTrips

        const milesPerVehiclePerDay = d.vehiclesProduction > 0
          ? d.productionMiles / d.vehiclesProduction / 365
          : 0

        // Revenue breakdown
        const grossRevenue = d.productionMiles * ASSUMPTIONS.revenuePerMile * sCurveMultiplier
        const costPerMile = ASSUMPTIONS.revenuePerMile - inputs.profitPerMile
        const totalCosts = d.productionMiles * costPerMile * sCurveMultiplier
        const grossMarginPct = grossRevenue > 0
          ? (d.operatingProfit / grossRevenue) * 100
          : 0

        // Vehicle economics
        const newCities = d.citiesTotal - prevCitiesTotal
        const newVehicles = d.vehiclesTotal - prevVehiclesTotal
        const capexAnnual = Math.max(0, newVehicles) * ASSUMPTIONS.vehicleCostUsd
        cumulativeCapex += capexAnnual

        // Cash flow including capex
        const netCashFlowInclCapex = d.netCashFlow - capexAnnual
        cumulativeNetCashInclCapex += netCashFlowInclCapex

        // R&D per mile
        const rdPerMile = cumulativeTotalMiles > 0
          ? (d.cumulativeRDSpend * 1e9) / cumulativeTotalMiles
          : 0

        // NPV
        const discountFactor = Math.pow(1 + ASSUMPTIONS.npvDiscountRate, yearOffset)
        const npvAnnual = d.netCashFlow / discountFactor
        npvCumulative += npvAnnual

        // ROI including capex
        const totalInvestmentInclCapex = (d.cumulativeRDSpend * 1e9) + cumulativeCapex
        const roiInclCapexPct = totalInvestmentInclCapex > 0
          ? (cumulativeNetCashInclCapex / totalInvestmentInclCapex) * 100
          : 0

        // Payback
        const paybackReached = d.cumulativeNetCash >= 0

        allRows.push({
          profile: profileName,
          profile_description: profile.description,
          year: d.year,
          year_offset: yearOffset,
          phase,

          // Input parameters
          input_start_year: inputs.startYear,
          input_cities_per_year: inputs.citiesPerYear,
          input_vehicles_per_city: inputs.vehiclesPerCity,
          input_profit_per_mile: inputs.profitPerMile,
          input_annual_rd_spend_b: inputs.annualRDSpend,
          input_ramp_time_per_city: inputs.rampTimePerCity,
          input_ops_revenue_start_year: inputs.opsRevenueStartYear,
          input_scale_phase_year: inputs.scalePhaseYear,
          input_production_utilization: multipliers.productionUtilization,
          input_validation_utilization: multipliers.validationUtilization,
          input_rd_taper_after_breakeven: multipliers.rdTaperAfterBreakeven,

          // City & Fleet
          cities_total: d.citiesTotal,
          new_cities_this_year: Math.max(0, newCities),
          expansion_years: expansionYears,
          vehicles_total: d.vehiclesTotal,
          vehicles_production: d.vehiclesProduction,
          vehicles_validation: d.vehiclesValidation,
          new_vehicles_this_year: Math.max(0, Math.round(newVehicles)),

          // Multipliers
          production_capacity_multiplier: Math.round(productionCapacityMultiplier * 10000) / 10000,
          s_curve_multiplier: Math.round(sCurveMultiplier * 10000) / 10000,
          rd_multiplier: rdMultiplier,
          ramp_progress: Math.round(rampProgress * 10000) / 10000,

          // Miles
          production_miles: Math.round(d.productionMiles),
          validation_miles: Math.round(d.validationMiles),
          total_miles: Math.round(totalMiles),
          cumulative_production_miles: Math.round(cumulativeProductionMiles),
          cumulative_validation_miles: Math.round(cumulativeValidationMiles),
          cumulative_total_miles: Math.round(cumulativeTotalMiles),
          miles_per_vehicle_per_day: Math.round(milesPerVehiclePerDay * 100) / 100,

          // Trips
          production_trips: d.productionTrips,
          paid_trips_per_week: d.paidTripsPerWeek,
          cumulative_trips: cumulativeTrips,

          // Revenue Breakdown
          revenue_per_mile: ASSUMPTIONS.revenuePerMile,
          gross_revenue: Math.round(grossRevenue),
          cost_per_mile: costPerMile,
          total_costs: Math.round(totalCosts),
          operating_profit: Math.round(d.operatingProfit),
          gross_margin_pct: Math.round(grossMarginPct * 100) / 100,

          // Vehicle Economics
          vehicle_cost_usd: ASSUMPTIONS.vehicleCostUsd,
          capex_annual: Math.round(capexAnnual),
          capex_cumulative: Math.round(cumulativeCapex),

          // R&D
          annual_rd_spend_b: Math.round(d.annualRDSpend * 1000) / 1000,
          cumulative_rd_spend_b: Math.round(d.cumulativeRDSpend * 1000) / 1000,
          annual_rd_spend_usd: Math.round(d.annualRDSpend * 1e9),
          cumulative_rd_spend_usd: Math.round(d.cumulativeRDSpend * 1e9),
          rd_per_mile: Math.round(rdPerMile * 100) / 100,

          // Cash Flow
          net_cash_flow: Math.round(d.netCashFlow),
          cumulative_net_cash: Math.round(d.cumulativeNetCash),
          net_cash_flow_incl_capex: Math.round(netCashFlowInclCapex),
          cumulative_net_cash_incl_capex: Math.round(cumulativeNetCashInclCapex),

          // ROI & Valuation
          roi_pct: Math.round(d.roi * 100) / 100,
          roi_incl_capex_pct: Math.round(roiInclCapexPct * 100) / 100,
          npv_discount_rate: ASSUMPTIONS.npvDiscountRate,
          npv_annual: Math.round(npvAnnual),
          npv_cumulative: Math.round(npvCumulative),
          payback_reached: paybackReached,
        })

        prevCitiesTotal = d.citiesTotal
        prevVehiclesTotal = d.vehiclesTotal
      }
    }

    // Upsert all rows (replace existing data for same profile+year)
    const { data, error } = await supabaseAdmin
      .from('simulation_snapshot')
      .upsert(allRows, { onConflict: 'profile,year' })

    if (error) {
      console.error('[simulation/export] Supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      profiles: profileNames,
      rows_inserted: allRows.length,
      summary: profileNames.map((name: string) => {
        const profileRows = allRows.filter(r => r.profile === name)
        const lastRow = profileRows[profileRows.length - 1]
        return {
          profile: name,
          years: profileRows.length,
          final_year: lastRow?.year,
          cumulative_net_cash: lastRow?.cumulative_net_cash,
          cumulative_net_cash_incl_capex: lastRow?.cumulative_net_cash_incl_capex,
          npv_cumulative: lastRow?.npv_cumulative,
          cumulative_total_miles: lastRow?.cumulative_total_miles,
          break_even_year: profileRows.find(r => r.payback_reached)?.year || null,
        }
      })
    })

  } catch (err: any) {
    console.error('[simulation/export] Error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

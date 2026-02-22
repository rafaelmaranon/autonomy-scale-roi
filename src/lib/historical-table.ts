export type HistoricalRow = {
  year: number
  metric: 'paid_trips_per_week' | 'fleet_size' | 'production_miles_per_year' | 'total_miles_cumulative' | 'net_cash_cumulative'
  value: number | null
  unit: string
  confidence: 'guess' | 'anchored'
  source?: { title: string; publisher?: string; date?: string; url?: string }
  notes?: string
}

export const HISTORICAL_TABLE: HistoricalRow[] = [
  { year: 2018, metric: 'paid_trips_per_week', value: null, unit: 'trips/week', confidence: 'guess', notes: 'Waymo One launch - fill later' },
  { year: 2019, metric: 'paid_trips_per_week', value: null, unit: 'trips/week', confidence: 'guess', notes: 'Early commercial operations - fill later' },
  { year: 2020, metric: 'paid_trips_per_week', value: null, unit: 'trips/week', confidence: 'guess', notes: 'COVID impact - fill later' },
  { year: 2021, metric: 'paid_trips_per_week', value: null, unit: 'trips/week', confidence: 'guess', notes: 'Recovery period - fill later' },
  { year: 2022, metric: 'paid_trips_per_week', value: null, unit: 'trips/week', confidence: 'guess', notes: 'Expansion phase - fill later' },
  { year: 2023, metric: 'paid_trips_per_week', value: null, unit: 'trips/week', confidence: 'guess', notes: 'Current operations - fill later' },
  
  { year: 2020, metric: 'fleet_size', value: null, unit: 'vehicles', confidence: 'guess', notes: 'Pre-commercial fleet - fill later' },
  { year: 2021, metric: 'fleet_size', value: null, unit: 'vehicles', confidence: 'guess', notes: 'Commercial fleet size - fill later' },
  { year: 2022, metric: 'fleet_size', value: null, unit: 'vehicles', confidence: 'guess', notes: 'Fleet expansion - fill later' },
  { year: 2023, metric: 'fleet_size', value: null, unit: 'vehicles', confidence: 'guess', notes: 'Current fleet size - fill later' },
  
  { year: 2020, metric: 'total_miles_cumulative', value: null, unit: 'miles', confidence: 'guess', notes: 'Cumulative autonomous miles - fill later' },
  { year: 2021, metric: 'total_miles_cumulative', value: null, unit: 'miles', confidence: 'guess', notes: 'Cumulative autonomous miles - fill later' },
  { year: 2022, metric: 'total_miles_cumulative', value: null, unit: 'miles', confidence: 'guess', notes: 'Cumulative autonomous miles - fill later' },
  { year: 2023, metric: 'total_miles_cumulative', value: null, unit: 'miles', confidence: 'guess', notes: 'Cumulative autonomous miles - fill later' },
  
  { year: 2020, metric: 'net_cash_cumulative', value: null, unit: 'USD', confidence: 'guess', notes: 'Estimated cumulative cash flow - fill later' },
  { year: 2021, metric: 'net_cash_cumulative', value: null, unit: 'USD', confidence: 'guess', notes: 'Estimated cumulative cash flow - fill later' },
  { year: 2022, metric: 'net_cash_cumulative', value: null, unit: 'USD', confidence: 'guess', notes: 'Estimated cumulative cash flow - fill later' },
  { year: 2023, metric: 'net_cash_cumulative', value: null, unit: 'USD', confidence: 'guess', notes: 'Estimated cumulative cash flow - fill later' },
]

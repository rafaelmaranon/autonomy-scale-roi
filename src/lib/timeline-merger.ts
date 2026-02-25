import { SimYearData } from './sim-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoricalAnchorRow {
  id: string
  company: string
  year: number
  month?: number
  metric: string
  value: number
  unit: string
  city?: string
  confidence?: string   // 'pending' | 'approved' | 'rejected'
  status?: string        // 'proposed' | 'anchored' | 'annotated' | 'deprecated'
  source_title?: string
  source_publisher?: string
  source_date?: string
  source_url?: string
  contributor_name?: string
  contributor_link?: string
  show_contributor?: boolean
  metadata?: Record<string, any>
}

// ---------------------------------------------------------------------------
// Metric Registry — single source of truth
// ---------------------------------------------------------------------------

export interface MetricRegistryEntry {
  metricKey: string                     // anchor metric name in DB
  simField: (keyof SimYearData) | null  // null = overlay-only (no sim override)
  views: string[]                       // chartView names this metric appears on
  binding: boolean                      // true = can pin history; false = overlay-only
}

export const METRIC_REGISTRY: MetricRegistryEntry[] = [
  { metricKey: 'paid_trips_per_week',        simField: 'paidTripsPerWeek',    views: ['paidTrips'],                    binding: true },
  { metricKey: 'fleet_size',                 simField: 'vehiclesProduction',  views: ['fleetSize'],                    binding: true },
  { metricKey: 'vehicles_in_city',           simField: 'vehiclesProduction',  views: ['fleetSize'],                    binding: true },
  { metricKey: 'cumulative_miles',           simField: 'cumulativeProductionMiles', views: ['productionMiles'], binding: true },
  { metricKey: 'production_miles_per_year',  simField: 'productionMiles',     views: ['productionMiles'],              binding: true },
  { metricKey: 'cumulative_rides',           simField: 'productionTrips',     views: [],                               binding: true },
  { metricKey: 'cumulative_net_cash',        simField: 'cumulativeNetCash',   views: ['netCash'],                      binding: true },
  // Overlay-only annotation metrics
  { metricKey: 'cash_loss_event',            simField: null,                  views: ['netCash'],                      binding: false },
  { metricKey: 'investment_event',           simField: null,                  views: ['netCash'],                      binding: false },
  // City metrics — used by map, not charts
  { metricKey: 'city_active',               simField: null,                  views: ['map'],                          binding: true },
  { metricKey: 'city_pilot',                simField: null,                  views: ['map'],                          binding: false },
]

// Derived lookups (computed once)
export function getMetricsForView(chartView: string): string[] {
  return METRIC_REGISTRY.filter(e => e.views.includes(chartView)).map(e => e.metricKey)
}

export function getBindingMetricsForView(chartView: string): string[] {
  return METRIC_REGISTRY.filter(e => e.views.includes(chartView) && e.binding).map(e => e.metricKey)
}

function getBindingSimFieldMap(): Map<string, keyof SimYearData> {
  const m = new Map<string, keyof SimYearData>()
  for (const e of METRIC_REGISTRY) {
    if (e.binding && e.simField) m.set(e.metricKey, e.simField)
  }
  return m
}

// ---------------------------------------------------------------------------
// Anchor splitting — GitHub-style review flow
// ---------------------------------------------------------------------------

export interface SplitAnchors {
  bindingAnchors: HistoricalAnchorRow[]   // approved + anchored → affect curve
  pendingPoints: HistoricalAnchorRow[]    // pending → visible overlay only
  annotations: HistoricalAnchorRow[]      // approved + annotated → official overlay
}

export function splitAnchors(rows: HistoricalAnchorRow[]): SplitAnchors {
  return {
    bindingAnchors: rows.filter(r => r.confidence === 'approved' && r.status === 'anchored'),
    pendingPoints:  rows.filter(r => r.confidence === 'pending'),
    annotations:    rows.filter(r => r.confidence === 'approved' && r.status === 'annotated'),
  }
}

export interface AnchorDebugInfo {
  totalRows: number
  bindingCount: number
  pendingCount: number
  annotationCount: number
  unknownMetrics: string[]
}

export function getDebugInfo(rows: HistoricalAnchorRow[]): AnchorDebugInfo {
  const { bindingAnchors, pendingPoints, annotations } = splitAnchors(rows)
  const knownMetrics = new Set(METRIC_REGISTRY.map(e => e.metricKey))
  const unknownMetrics = [...new Set(rows.map(r => r.metric).filter(m => !knownMetrics.has(m)))]
  return {
    totalRows: rows.length,
    bindingCount: bindingAnchors.length,
    pendingCount: pendingPoints.length,
    annotationCount: annotations.length,
    unknownMetrics,
  }
}

// ---------------------------------------------------------------------------
// Merged year data
// ---------------------------------------------------------------------------

export interface MergedYearData extends SimYearData {
  _sources: Record<string, 'anchor' | 'interpolated' | 'simulated'>
}

/**
 * Merge simulation data with BINDING anchors only.
 * Anchors override simulation values. Gaps between anchors are interpolated.
 * Simulation values are used only after the last binding anchor for each metric.
 */
export function mergeTimeline(
  simData: SimYearData[],
  bindingAnchors: HistoricalAnchorRow[]
): MergedYearData[] {
  const merged: MergedYearData[] = simData.map(d => ({
    ...d,
    _sources: {}
  }))

  const fieldMap = getBindingSimFieldMap()

  // Group binding anchors by their simField
  const byField = new Map<keyof SimYearData, HistoricalAnchorRow[]>()
  for (const a of bindingAnchors) {
    const simField = fieldMap.get(a.metric)
    if (!simField) continue
    if (!byField.has(simField)) byField.set(simField, [])
    byField.get(simField)!.push(a)
  }

  // For each sim field, apply anchor overrides + interpolation
  for (const [simField, anchors] of byField) {
    // Dedupe: take latest value per year (highest month)
    const byYear = new Map<number, number>()
    for (const a of anchors) {
      const existing = byYear.get(a.year)
      if (existing === undefined || (a.month || 0) > 0) {
        byYear.set(a.year, Number(a.value))
      }
    }

    const anchorYears = [...byYear.keys()].sort((a, b) => a - b)
    if (anchorYears.length === 0) continue
    const lastAnchorYear = anchorYears[anchorYears.length - 1]
    const firstAnchorYear = anchorYears[0]

    for (const point of merged) {
      if (point.year > lastAnchorYear) {
        point._sources[simField] = 'simulated'
        continue
      }

      if (byYear.has(point.year)) {
        ;(point as any)[simField] = byYear.get(point.year)!
        point._sources[simField] = 'anchor'
      } else if (point.year < firstAnchorYear) {
        ;(point as any)[simField] = 0
        point._sources[simField] = 'interpolated'
      } else {
        const prev = [...anchorYears].reverse().find(y => y < point.year)!
        const next = anchorYears.find(y => y > point.year)!
        const pv = byYear.get(prev)!
        const nv = byYear.get(next)!
        const t = (point.year - prev) / (next - prev)
        ;(point as any)[simField] = Math.round(pv + t * (nv - pv))
        point._sources[simField] = 'interpolated'
      }
    }
  }

  // Mark remaining fields as simulated
  const allSimFields = new Set([...fieldMap.values()])
  for (const point of merged) {
    for (const f of allSimFields) {
      if (!point._sources[f]) point._sources[f] = 'simulated'
    }
  }

  return merged
}

/**
 * Get the last BINDING anchor year for a chart view.
 */
export function getLastAnchorYear(
  bindingAnchors: HistoricalAnchorRow[],
  chartView: string
): number | null {
  const metrics = getBindingMetricsForView(chartView)
  const relevant = bindingAnchors.filter(a => metrics.includes(a.metric))
  if (relevant.length === 0) return null
  return Math.max(...relevant.map(a => a.year))
}

/**
 * Smart value formatter: K → M → B based on magnitude
 */
export function formatSmartNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return Math.round(value).toString()
}

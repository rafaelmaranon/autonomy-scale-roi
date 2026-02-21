// Historical data anchors with citation metadata for credibility

export interface HistoricalAnchor {
  year: number
  month?: number
  metric: string
  value: number
  unit: string
  source: {
    title: string
    publisher: string
    date: string
    url: string
  }
}

// Waymo public reporting anchors - trackable and inspectable
export const WAYMO_PUBLIC_ANCHORS: HistoricalAnchor[] = [
  {
    year: 2023,
    month: 5,
    metric: "paid_trips_per_week",
    value: 10000,
    unit: "trips/week",
    source: {
      title: "Waymo hits 10,000 autonomous trips per week",
      publisher: "TechCrunch",
      date: "May 4, 2023",
      url: "https://techcrunch.com/2023/05/04/waymo-hits-10000-autonomous-trips-per-week/"
    }
  },
  {
    year: 2024,
    month: 8,
    metric: "paid_trips_per_week",
    value: 100000,
    unit: "trips/week",
    source: {
      title: "Waymo surpasses 100,000 paid autonomous rides per week",
      publisher: "Waymo Blog",
      date: "August 28, 2024",
      url: "https://waymo.com/blog/2024/08/waymo-surpasses-100000-paid-autonomous-rides-per-week/"
    }
  },
  {
    year: 2024,
    month: 12,
    metric: "paid_trips_per_week",
    value: 150000,
    unit: "trips/week",
    source: {
      title: "Waymo's autonomous vehicles are now completing over 150,000 paid trips per week",
      publisher: "Waymo Blog",
      date: "December 19, 2024",
      url: "https://waymo.com/blog/2024/12/waymos-autonomous-vehicles-are-now-completing-over-150000-paid-trips-per-week/"
    }
  },
  {
    year: 2024,
    month: 12,
    metric: "cumulative_rides",
    value: 14000000,
    unit: "total rides",
    source: {
      title: "Waymo reaches 14 million cumulative autonomous miles driven",
      publisher: "Waymo Blog",
      date: "December 19, 2024",
      url: "https://waymo.com/blog/2024/12/waymos-autonomous-vehicles-are-now-completing-over-150000-paid-trips-per-week/"
    }
  },
  {
    year: 2025,
    month: 2,
    metric: "paid_trips_per_week",
    value: 200000,
    unit: "trips/week",
    source: {
      title: "Waymo One now providing over 200,000 paid autonomous rides weekly",
      publisher: "Waymo Blog",
      date: "February 12, 2025",
      url: "https://waymo.com/blog/2025/02/waymo-one-now-providing-over-200000-paid-autonomous-rides-weekly/"
    }
  },
  {
    year: 2026,
    month: 2,
    metric: "paid_trips_per_week",
    value: 400000,
    unit: "trips/week",
    source: {
      title: "Waymo scales to 400,000+ weekly autonomous rides",
      publisher: "Waymo Blog", 
      date: "February 21, 2026",
      url: "https://waymo.com/blog/2026/02/waymo-scales-to-400000-weekly-autonomous-rides/"
    }
  }
]

// Helper functions for working with anchors
export function getAnchorsByYear(year: number): HistoricalAnchor[] {
  return WAYMO_PUBLIC_ANCHORS.filter(anchor => anchor.year === year)
}

export function getAnchorByMetric(metric: string, year?: number): HistoricalAnchor | undefined {
  return WAYMO_PUBLIC_ANCHORS.find(anchor => 
    anchor.metric === metric && (year ? anchor.year === year : true)
  )
}

export function getLatestAnchor(): HistoricalAnchor {
  return WAYMO_PUBLIC_ANCHORS.reduce((latest, current) => {
    const latestDate = new Date(latest.year, latest.month || 0)
    const currentDate = new Date(current.year, current.month || 0)
    return currentDate > latestDate ? current : latest
  })
}

// Data periods for visual distinction
export const DATA_PERIODS = {
  PRE_COMMERCIAL: { start: 2004, end: 2022, label: "Modeled (pre-commercial era)" },
  ANCHORED: { start: 2023, end: 2026, label: "Anchored to public data" },
  PROJECTED: { start: 2027, end: 2050, label: "Modeled projection" }
} as const

export function getDataPeriod(year: number): keyof typeof DATA_PERIODS {
  if (year <= DATA_PERIODS.PRE_COMMERCIAL.end) return 'PRE_COMMERCIAL'
  if (year <= DATA_PERIODS.ANCHORED.end) return 'ANCHORED'
  return 'PROJECTED'
}

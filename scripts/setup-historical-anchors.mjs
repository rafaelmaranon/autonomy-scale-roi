// Setup script: creates historical_anchors table and seeds Waymo data
// Run with: node scripts/setup-historical-anchors.mjs

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Step 1: Create table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS historical_anchors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company           TEXT NOT NULL,
  year              INT NOT NULL,
  month             INT,
  metric            TEXT NOT NULL,
  value             NUMERIC NOT NULL,
  unit              TEXT NOT NULL,
  city              TEXT,
  confidence        TEXT DEFAULT 'pending',
  status            TEXT DEFAULT 'proposed',
  source_title      TEXT,
  source_publisher  TEXT,
  source_date       TEXT,
  source_url        TEXT,
  contributor_name  TEXT,
  contributor_link  TEXT,
  show_contributor  BOOLEAN DEFAULT false,
  metadata          JSONB,
  created_at        TIMESTAMPTZ DEFAULT now(),
  reviewed_at       TIMESTAMPTZ
);
`

// Check if table exists by attempting a select
const { error: checkError } = await supabase.from('historical_anchors').select('id').limit(1)

if (checkError && checkError.message.includes('does not exist')) {
  console.log('Table does not exist yet.')
  console.log('Please run this SQL in Supabase Dashboard > SQL Editor:')
  console.log('---')
  console.log(createTableSQL)
  console.log('---')
  console.log('Then re-run: node scripts/setup-historical-anchors.mjs')
  process.exit(0)
} else {
  console.log('Table exists ✓')
}

// Step 2: Seed Waymo anchors
const waymoAnchors = [
  {
    company: 'waymo',
    year: 2023,
    month: 5,
    metric: 'paid_trips_per_week',
    value: 10000,
    unit: 'trips/week',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo hits 10,000 autonomous trips per week',
    source_publisher: 'TechCrunch',
    source_date: 'May 4, 2023',
    source_url: 'https://techcrunch.com/2023/05/04/waymo-hits-10000-autonomous-trips-per-week/'
  },
  {
    company: 'waymo',
    year: 2024,
    month: 8,
    metric: 'paid_trips_per_week',
    value: 100000,
    unit: 'trips/week',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo surpasses 100,000 paid autonomous rides per week',
    source_publisher: 'Waymo Blog',
    source_date: 'August 28, 2024',
    source_url: 'https://waymo.com/blog/2024/08/waymo-surpasses-100000-paid-autonomous-rides-per-week/'
  },
  {
    company: 'waymo',
    year: 2024,
    month: 12,
    metric: 'paid_trips_per_week',
    value: 150000,
    unit: 'trips/week',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo completing over 150,000 paid trips per week',
    source_publisher: 'Waymo Blog',
    source_date: 'December 19, 2024',
    source_url: 'https://waymo.com/blog/2024/12/waymos-autonomous-vehicles-are-now-completing-over-150000-paid-trips-per-week/'
  },
  {
    company: 'waymo',
    year: 2024,
    month: 12,
    metric: 'cumulative_rides',
    value: 14000000,
    unit: 'total rides',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo reaches 14 million cumulative rides',
    source_publisher: 'Waymo Blog',
    source_date: 'December 19, 2024',
    source_url: 'https://waymo.com/blog/2024/12/waymos-autonomous-vehicles-are-now-completing-over-150000-paid-trips-per-week/'
  },
  {
    company: 'waymo',
    year: 2025,
    month: 2,
    metric: 'paid_trips_per_week',
    value: 200000,
    unit: 'trips/week',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo One providing over 200,000 paid autonomous rides weekly',
    source_publisher: 'Waymo Blog',
    source_date: 'February 12, 2025',
    source_url: 'https://waymo.com/blog/2025/02/waymo-one-now-providing-over-200000-paid-autonomous-rides-weekly/'
  },
  {
    company: 'waymo',
    year: 2026,
    month: 2,
    metric: 'paid_trips_per_week',
    value: 400000,
    unit: 'trips/week',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo scales to 400,000+ weekly autonomous rides',
    source_publisher: 'Waymo Blog',
    source_date: 'February 21, 2026',
    source_url: 'https://waymo.com/blog/2026/02/waymo-scales-to-400000-weekly-autonomous-rides/'
  }
]

console.log('Seeding Waymo anchors...')
const { data, error: seedError } = await supabase
  .from('historical_anchors')
  .upsert(waymoAnchors, { onConflict: 'id' })
  .select()

if (seedError) {
  console.error('Seed error:', seedError.message)
  console.log('')
  console.log('If the table does not exist yet, please create it first via the Supabase Dashboard SQL Editor.')
} else {
  console.log(`✅ Seeded ${waymoAnchors.length} Waymo anchors successfully!`)
}

// Verify
const { data: rows, error: verifyError } = await supabase
  .from('historical_anchors')
  .select('company, year, month, metric, value, unit')
  .eq('company', 'waymo')
  .order('year', { ascending: true })

if (rows) {
  console.log(`\nVerification — ${rows.length} rows in table:`)
  rows.forEach(r => console.log(`  ${r.company} | ${r.year}-${r.month || '?'} | ${r.metric} | ${r.value} ${r.unit}`))
}

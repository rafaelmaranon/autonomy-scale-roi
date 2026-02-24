// Seed real Waymo city launch data into historical_anchors
// Run with: node scripts/seed-waymo-cities.mjs

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const waymoCities = [
  // Production cities (approved + anchored)
  {
    company: 'waymo',
    year: 2020,
    month: 10,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'Phoenix',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo launches fully driverless rides in Phoenix',
    source_publisher: 'Waymo Blog',
    source_date: 'October 8, 2020',
    source_url: 'https://waymo.com/blog/2020/10/waymo-is-opening-its-fully-driverless/'
  },
  {
    company: 'waymo',
    year: 2021,
    month: 8,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'San Francisco',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo begins San Francisco rider-only operations',
    source_publisher: 'Waymo Blog',
    source_date: 'August 24, 2021',
    source_url: 'https://waymo.com/blog/2021/08/waymo-one-san-francisco/'
  },
  {
    company: 'waymo',
    year: 2024,
    month: 6,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'Los Angeles',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo One launches in Los Angeles',
    source_publisher: 'Waymo Blog',
    source_date: 'June 2024',
    source_url: 'https://waymo.com/blog/2024/06/waymo-one-los-angeles-launch/'
  },
  {
    company: 'waymo',
    year: 2025,
    month: 6,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'Austin',
    confidence: 'approved',
    status: 'anchored',
    source_title: 'Waymo One launches paid rides in Austin',
    source_publisher: 'Waymo Blog',
    source_date: 'June 2025',
    source_url: 'https://waymo.com/blog/2025/06/waymo-one-austin/'
  },
  // Validation / pilot cities (approved + annotated — no sim impact)
  {
    company: 'waymo',
    year: 2025,
    month: 1,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'Atlanta',
    confidence: 'approved',
    status: 'annotated',
    source_title: 'Waymo begins testing in Atlanta',
    source_publisher: 'TechCrunch',
    source_date: 'January 2025',
    source_url: 'https://techcrunch.com/2025/01/waymo-testing-atlanta/'
  },
  {
    company: 'waymo',
    year: 2024,
    month: 11,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'Miami',
    confidence: 'approved',
    status: 'annotated',
    source_title: 'Waymo begins mapping and testing in Miami',
    source_publisher: 'Waymo Blog',
    source_date: 'November 2024',
    source_url: 'https://waymo.com/blog/2024/11/waymo-miami/'
  }
]

console.log('Seeding Waymo city anchors...')
const { data, error } = await supabase
  .from('historical_anchors')
  .upsert(waymoCities, { onConflict: 'id' })
  .select()

if (error) {
  console.error('Seed error:', error.message)
  process.exit(1)
}

console.log(`✅ Seeded ${data.length} Waymo city anchors:`)
data.forEach(r => console.log(`  ${r.city} | ${r.year}-${r.month} | ${r.metric} | conf=${r.confidence} | stat=${r.status}`))

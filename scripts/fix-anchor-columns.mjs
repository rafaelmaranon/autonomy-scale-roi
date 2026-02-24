// One-time fix: swap confidence/status values in existing rows
// Old: confidence='anchored', status='approved'
// New: confidence='approved', status='anchored'
// Run with: node scripts/fix-anchor-columns.mjs

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

// Fix rows where confidence='anchored' and status='approved' (the old swapped values)
const { data, error } = await supabase
  .from('historical_anchors')
  .update({ confidence: 'approved', status: 'anchored' })
  .eq('confidence', 'anchored')
  .eq('status', 'approved')
  .select('id, company, year, metric, confidence, status')

if (error) {
  console.error('Update error:', error.message)
  process.exit(1)
}

console.log(`✅ Fixed ${data.length} rows:`)
data.forEach(r => console.log(`  ${r.company} | ${r.year} | ${r.metric} → confidence=${r.confidence}, status=${r.status}`))

// Verify all rows
const { data: all } = await supabase
  .from('historical_anchors')
  .select('id, company, year, metric, confidence, status')
  .order('year')

console.log(`\nAll rows (${all?.length}):`)
all?.forEach(r => console.log(`  ${r.company} | ${r.year} | ${r.metric} | conf=${r.confidence} | stat=${r.status}`))

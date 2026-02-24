// Fix DB defaults and add unique index
// Run with: node scripts/fix-db-defaults.mjs

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) { console.error('Missing env vars'); process.exit(1) }

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// These SQL statements need to be run directly in Supabase Dashboard > SQL Editor
// because the JS client doesn't support DDL via .rpc() without a custom function.

const sql = `
-- 1) Fix column defaults so new contributor rows are safe
ALTER TABLE public.historical_anchors
  ALTER COLUMN confidence SET DEFAULT 'pending';

ALTER TABLE public.historical_anchors
  ALTER COLUMN status SET DEFAULT 'proposed';

-- 2) Add unique index to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS uq_city_metric_time
  ON public.historical_anchors(company, metric, city, year, coalesce(month, 0));
`

console.log('=== Run this SQL in Supabase Dashboard > SQL Editor ===\n')
console.log(sql)
console.log('=========================================================')
console.log('\nThis script cannot run DDL via the JS client.')
console.log('Copy the SQL above and paste it into:')
console.log('  https://supabase.com/dashboard → SQL Editor → New Query → Run')

// Verify current defaults by inserting and checking a test row
console.log('\n--- Verifying current column behavior ---')
const { data: testRow, error: testErr } = await supabase
  .from('historical_anchors')
  .insert({
    company: '_test_defaults',
    year: 9999,
    metric: '_test',
    value: 0,
    unit: 'test',
  })
  .select('confidence, status')

if (testErr) {
  console.log('Insert test failed:', testErr.message)
} else if (testRow?.[0]) {
  const { confidence, status } = testRow[0]
  console.log(`Current defaults → confidence='${confidence}', status='${status}'`)
  if (confidence === 'pending' && status === 'proposed') {
    console.log('✅ Defaults are already correct!')
  } else {
    console.log('⚠️  Defaults need fixing. Run the SQL above.')
  }
  // Clean up test row
  await supabase.from('historical_anchors').delete().eq('company', '_test_defaults')
}

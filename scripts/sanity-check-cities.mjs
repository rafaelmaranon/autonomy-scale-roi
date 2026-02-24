// Sanity check script: tests all 3 city anchor states
// Run with: node scripts/sanity-check-cities.mjs
// Pass --step=1|2|3 to run a specific step, or no flag for all 3 sequentially

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseServiceKey) { console.error('Missing env vars'); process.exit(1) }

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const step = process.argv.find(a => a.startsWith('--step='))?.split('=')[1]

async function findSeattle() {
  const { data } = await supabase
    .from('historical_anchors')
    .select('*')
    .eq('company', 'waymo')
    .eq('city', 'Seattle')
    .eq('metric', 'city_active')
    .limit(1)
  return data?.[0] || null
}

async function step1_pending() {
  console.log('\n=== STEP 1: Insert pending Seattle ===')
  // Delete any existing Seattle row first
  await supabase.from('historical_anchors').delete().eq('city', 'Seattle').eq('company', 'waymo')

  const { data, error } = await supabase.from('historical_anchors').insert({
    company: 'waymo',
    year: 2026,
    month: 6,
    metric: 'city_active',
    value: 1,
    unit: 'boolean',
    city: 'Seattle',
    confidence: 'pending',
    status: 'proposed',
    source_title: 'Sanity check — pending city',
    source_publisher: 'Test',
  }).select()

  if (error) { console.error('Insert error:', error.message); return }
  console.log('✅ Inserted:', data[0].city, '| confidence =', data[0].confidence, '| status =', data[0].status)
  console.log('→ Expected: yellow dashed ring on map. Not in citiesTotal.')
}

async function step2_anchored() {
  console.log('\n=== STEP 2: Promote Seattle to anchored ===')
  const row = await findSeattle()
  if (!row) { console.error('No Seattle row found. Run step 1 first.'); return }

  const { data, error } = await supabase.from('historical_anchors')
    .update({ confidence: 'approved', status: 'anchored' })
    .eq('id', row.id)
    .select()

  if (error) { console.error('Update error:', error.message); return }
  console.log('✅ Updated:', data[0].city, '| confidence =', data[0].confidence, '| status =', data[0].status)
  console.log('→ Expected: blue solid dot on map. Counts toward citiesTotal starting 2026.')
}

async function step3_annotated() {
  console.log('\n=== STEP 3: Convert Seattle to annotated pilot ===')
  const row = await findSeattle()
  if (!row) { console.error('No Seattle row found. Run step 1 first.'); return }

  const { data, error } = await supabase.from('historical_anchors')
    .update({ confidence: 'approved', status: 'annotated' })
    .eq('id', row.id)
    .select()

  if (error) { console.error('Update error:', error.message); return }
  console.log('✅ Updated:', data[0].city, '| confidence =', data[0].confidence, '| status =', data[0].status)
  console.log('→ Expected: purple ring on map. No citiesTotal impact.')
}

async function cleanup() {
  console.log('\n=== CLEANUP: Remove test Seattle row ===')
  const { error } = await supabase.from('historical_anchors').delete().eq('city', 'Seattle').eq('company', 'waymo')
  if (error) { console.error('Cleanup error:', error.message); return }
  console.log('✅ Cleaned up Seattle test row.')
}

if (step === '1') await step1_pending()
else if (step === '2') await step2_anchored()
else if (step === '3') await step3_annotated()
else if (step === 'clean') await cleanup()
else {
  // Run all 3 sequentially with pauses
  await step1_pending()
  console.log('\n⏳ Refresh the app to verify yellow dashed ring...')
  console.log('   Then run: node scripts/sanity-check-cities.mjs --step=2')
}

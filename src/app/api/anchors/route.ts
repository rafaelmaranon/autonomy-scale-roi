import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company') || 'Waymo'

  const { data, error } = await supabaseAdmin
    .from('historical_anchors')
    .select('*')
    .eq('company', company)
    .not('confidence', 'eq', 'rejected')
    .order('year', { ascending: true })
    .order('month', { ascending: true })

  if (error) {
    console.error('Anchors fetch error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch anchors' }, { status: 500 })
  }

  return NextResponse.json({ anchors: data }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
  })
}

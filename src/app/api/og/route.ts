import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const imagePath = path.join(process.cwd(), 'public', 'og.png')
    const imageBuffer = fs.readFileSync(imagePath)
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err) {
    return new NextResponse('Not found', { status: 404 })
  }
}

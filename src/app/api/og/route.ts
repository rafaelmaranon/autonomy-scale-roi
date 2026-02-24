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
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    return new NextResponse('Not found', { status: 404 })
  }
}

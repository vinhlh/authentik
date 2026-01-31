/**
 * Admin API Routes
 * For managing content extraction and curation
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractFromVideo } from '@/lib/extraction-pipeline'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, creatorName } = body

    if (!url) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    const result = await extractFromVideo(url, creatorName || 'Authentik')

    return NextResponse.json({
      success: true,
      collection: result.collection,
      stats: result.stats,
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}

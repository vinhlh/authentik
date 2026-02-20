/**
 * Admin API Routes
 * For managing content extraction and curation
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Extraction API is temporarily disabled for deployment size constraints.',
    },
    { status: 503 }
  )
}

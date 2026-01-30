/**
 * TikTok Video Parser
 * Extracts restaurant information from TikTok food review videos
 */

import type { RestaurantMention } from './youtube'

export interface TikTokVideoMetadata {
  videoId: string
  description: string
  authorName: string
  authorId: string
  createTime: number
  duration: number
  playCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  hashtags: string[]
}

/**
 * Extract video ID from TikTok URL
 */
export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/v\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Get TikTok video metadata
 * Note: TikTok doesn't have an official public API
 * This would require web scraping or unofficial API
 */
export async function getTikTokVideoMetadata(
  videoId: string
): Promise<TikTokVideoMetadata | null> {
  try {
    // This would use web scraping or unofficial TikTok API
    // For now, return null to indicate it needs implementation
    console.log(`Getting TikTok metadata for video: ${videoId}`)

    // Example implementation would use:
    // - Playwright/Puppeteer for web scraping
    // - Or unofficial TikTok API wrapper

    return null
  } catch (error) {
    console.error('Error fetching TikTok metadata:', error)
    return null
  }
}

/**
 * Extract text from TikTok video
 * This includes:
 * - Video description
 * - On-screen text (OCR)
 * - Audio transcription (if available)
 */
export async function extractTikTokText(videoId: string): Promise<{
  description: string
  onScreenText: string[]
  audioTranscript: string | null
}> {
  try {
    // This would involve:
    // 1. Getting video description from metadata
    // 2. Downloading video and running OCR on frames
    // 3. Extracting audio and transcribing

    console.log(`Extracting text from TikTok video: ${videoId}`)

    return {
      description: '',
      onScreenText: [],
      audioTranscript: null,
    }
  } catch (error) {
    console.error('Error extracting TikTok text:', error)
    return {
      description: '',
      onScreenText: [],
      audioTranscript: null,
    }
  }
}

/**
 * Extract restaurant mentions from TikTok content
 */
export async function extractRestaurantsFromTikTok(
  metadata: TikTokVideoMetadata,
  textContent: {
    description: string
    onScreenText: string[]
    audioTranscript: string | null
  }
): Promise<RestaurantMention[]> {
  // Combine all text sources
  const allText = [
    textContent.description,
    ...textContent.onScreenText,
    textContent.audioTranscript || '',
  ].join('\n')

  // Extract hashtags that might indicate location
  // const locationHashtags = metadata.hashtags.filter(tag =>
  //   tag.toLowerCase().includes('danang') ||
  //   tag.toLowerCase().includes('vietnam') ||
  //   tag.toLowerCase().includes('food')
  // )

  const prompt = `
Extract restaurant information from this TikTok food review.
Return a JSON array of restaurants with the following structure:
{
  "name": "Restaurant name",
  "address": "Full address if mentioned",
  "dishes": ["dish1", "dish2"],
  "priceRange": "$ or $$ or $$$ or $$$$",
  "notes": "Any special notes or recommendations"
}

Content:
${allText}

Hashtags: ${metadata.hashtags.join(', ')}
Author: ${metadata.authorName}
`

  // TODO: Implement AI extraction using Gemini Flash or GPT
  console.log('Extracting restaurants from TikTok...')
  console.log('Prompt:', prompt)

  return []
}

/**
 * Parse TikTok video and extract restaurant data
 * Main entry point for TikTok video processing
 */
export async function parseTikTokVideo(url: string): Promise<{
  metadata: TikTokVideoMetadata | null
  restaurants: RestaurantMention[]
}> {
  const videoId = extractTikTokVideoId(url)

  if (!videoId) {
    throw new Error('Invalid TikTok URL')
  }

  // Get video metadata
  const metadata = await getTikTokVideoMetadata(videoId)

  if (!metadata) {
    throw new Error('Could not fetch TikTok video metadata')
  }

  // Extract text content
  const textContent = await extractTikTokText(videoId)

  // Extract restaurants
  const restaurants = await extractRestaurantsFromTikTok(metadata, textContent)

  return { metadata, restaurants }
}

/**
 * Determine video platform from URL
 */
export function detectVideoPlatform(url: string): 'youtube' | 'tiktok' | 'unknown' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube'
  }

  if (url.includes('tiktok.com')) {
    return 'tiktok'
  }

  return 'unknown'
}

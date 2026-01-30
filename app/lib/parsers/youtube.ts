/**
 * YouTube Video Parser
 * Extracts restaurant information from YouTube food review videos
 */

import { z } from 'zod'

// YouTube transcript API would be used here
// For now, we'll define the structure

export const RestaurantMentionSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  dishes: z.array(z.string()).optional(),
  priceRange: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.number().optional(), // Video timestamp in seconds
})

export type RestaurantMention = z.infer<typeof RestaurantMentionSchema>

export interface YouTubeVideoMetadata {
  videoId: string
  title: string
  description: string
  channelName: string
  channelId: string
  publishedAt: string
  duration: number
  viewCount: number
  likeCount: number
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
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
 * Get video metadata from YouTube Data API
 */
export async function getVideoMetadata(
  videoId: string
): Promise<YouTubeVideoMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    console.warn('⚠️  YOUTUBE_API_KEY not set')
    return null
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`
    )

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return null
    }

    const video = data.items[0]
    const snippet = video.snippet
    const statistics = video.statistics
    const contentDetails = video.contentDetails

    // Parse ISO 8601 duration (PT1H2M3S)
    const durationMatch = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    const hours = parseInt(durationMatch?.[1] || '0')
    const minutes = parseInt(durationMatch?.[2] || '0')
    const seconds = parseInt(durationMatch?.[3] || '0')
    const duration = hours * 3600 + minutes * 60 + seconds

    return {
      videoId,
      title: snippet.title,
      description: snippet.description,
      channelName: snippet.channelTitle,
      channelId: snippet.channelId,
      publishedAt: snippet.publishedAt,
      duration,
      viewCount: parseInt(statistics.viewCount || '0'),
      likeCount: parseInt(statistics.likeCount || '0'),
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error)
    return null
  }
}

/**
 * Get video transcript using youtube-transcript library
 * Note: This requires the youtube-transcript package
 */
export async function getVideoTranscript(videoId: string): Promise<string | null> {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript')

    // We cannot assume the language, but youtube-transcript tries to find "en" or auto-generated
    // We might need to fetch available transcripts first if we want specific languages like "vi"
    // For now, let's try default behavior which usually grabs auto-generated or English

    // Try to get transcript
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcriptItems || transcriptItems.length === 0) {
      return null
    }

    return transcriptItems.map(t => t.text).join(' ')
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return null
  }
}

/**
 * Extract restaurant mentions from transcript using AI
 * This would use Gemini Flash (free) or GPT for extraction
 */
export async function extractRestaurantsFromTranscript(
  transcript: string,
  videoMetadata: YouTubeVideoMetadata
): Promise<RestaurantMention[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set, skipping AI extraction')
    return []
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)

    // Use Gemini 1.5 Flash for speed and cost effectiveness
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: "application/json" }
    })

    const prompt = `
    You are an expert food critic and data extractor.
    Analyze the following YouTube video transcript and metadata to extract restaurant information.

    Target: Vietnamese food review video in Da Nang or Vietnam.

    Extract a JSON array of restaurants mentioned. Each object should have:
    - name: The name of the restaurant or food stall. Be precise.
    - address: The address if mentioned (or "Da Nang" if inferred but not specific).
    - dishes: Array of dishes recommended or eaten there.
    - priceRange: Estimation based on context ("$" = cheap street food, "$$" = casual, "$$$" = upscale).
    - notes: Brief summary of the reviewer's opinion (e.g., "Best banh mi," "Soup was salty").
    - timestamp: Approximate timestamp in seconds where it appears (estimate based on text position if possible, otherwise 0).

    Return ONLY the JSON array. If no restaurants are clearly identified, return empty array [].

    Video Title: ${videoMetadata.title}
    Channel: ${videoMetadata.channelName}
    Transcript:
    ${transcript.substring(0, 30000)} // Truncate to avoid token limits if extremely long
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        console.error('AI returned non-array format', data)
        return []
      }

      // Validate and clean up data
      const validRestaurants = data
        .map(item => {
          // Basic cleanup
          return {
            ...item,
            name: item.name?.trim(),
            dishes: Array.isArray(item.dishes) ? item.dishes : [],
            priceRange: item.priceRange || '$',
            timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0
          }
        })
        .filter(item => item.name && item.name.length > 2)

      return validRestaurants as RestaurantMention[]

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('Raw response:', text)
      return []
    }

  } catch (error) {
    console.error('Error during AI extraction:', error)
    return []
  }
}

/**
 * Extract restaurants from video description using regex (no AI needed)
 * Parses timestamp patterns like "0:54 Mỳ Quảng Nhung" or "2:15 Bún cá 109"
 */
export function extractRestaurantsFromDescriptionRegex(
  metadata: YouTubeVideoMetadata
): RestaurantMention[] {
  if (!metadata.description || metadata.description.length < 30) {
    return []
  }

  const restaurants: RestaurantMention[] = []

  // Match patterns like "0:00 Intro", "0:54 Mỳ Quảng Nhung", "2:15 Bún cá 109"
  // Timestamp format: MM:SS or H:MM:SS
  const timestampPattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(.+)$/gm

  // Terms to skip (intro, outro, BTS, etc.)
  const skipTerms = ['intro', 'outro', 'bts', 'tổng hợp', 'thông tin', 'liên hệ', 'end', 'credits']

  let match
  while ((match = timestampPattern.exec(metadata.description)) !== null) {
    const hours = match[3] ? parseInt(match[1]) : 0
    const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1])
    const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2])
    const name = match[4].trim()

    // Skip non-restaurant entries
    const nameLower = name.toLowerCase()
    if (skipTerms.some(term => nameLower.includes(term))) {
      continue
    }

    // Infer dish from name (common Vietnamese patterns)
    const dishes: string[] = []
    const dishPatterns = [
      { pattern: /mỳ quảng/i, dish: 'Mỳ Quảng' },
      { pattern: /bún cá/i, dish: 'Bún Cá' },
      { pattern: /bún bò/i, dish: 'Bún Bò' },
      { pattern: /cơm gà/i, dish: 'Cơm Gà' },
      { pattern: /hải sản/i, dish: 'Hải Sản' },
      { pattern: /phở/i, dish: 'Phở' },
      { pattern: /bánh mì/i, dish: 'Bánh Mì' },
      { pattern: /bánh xèo/i, dish: 'Bánh Xèo' },
      { pattern: /bánh canh/i, dish: 'Bánh Canh' },
      { pattern: /coffee|cà phê/i, dish: 'Coffee' },
    ]

    for (const { pattern, dish } of dishPatterns) {
      if (pattern.test(name)) {
        dishes.push(dish)
        break
      }
    }

    const timestamp = hours * 3600 + minutes * 60 + seconds

    restaurants.push({
      name,
      address: 'Da Nang',
      dishes,
      priceRange: '$',
      notes: `Featured at ${match[1]}:${match[2]}${match[3] ? ':' + match[3] : ''} in the video`,
      timestamp,
    })
  }

  return restaurants
}

/**
 * Extract restaurants from video description using AI
 * Fallback when transcript is not available
 */
export async function extractRestaurantsFromDescription(
  metadata: YouTubeVideoMetadata
): Promise<RestaurantMention[]> {
  // Check if description has meaningful content
  if (!metadata.description || metadata.description.length < 50) {
    console.warn('⚠️ Video description too short for extraction')
    return []
  }

  // First try regex-based extraction (always works, no API needed)
  const regexResults = extractRestaurantsFromDescriptionRegex(metadata)

  if (regexResults.length > 0) {
    console.log(`✅ Extracted ${regexResults.length} restaurants from description using regex`)
    return regexResults
  }

  // If regex didn't work, try AI extraction
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set and regex extraction found nothing')
    return []
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: "application/json" }
    })

    const prompt = `
    You are an expert at extracting restaurant information from YouTube video descriptions.

    Analyze the following YouTube video title and description to extract ALL restaurants/food places mentioned.
    This is a Vietnamese food review video, so names may be in Vietnamese.

    Look for:
    - Restaurant names in timestamp listings (e.g., "0:54 Mỳ Quảng Nhung")
    - Any "quán" (restaurant/shop) names mentioned
    - Coffee shops, street food stalls, or any food establishments

    Extract a JSON array where each object has:
    - name: The exact name of the restaurant/food stall (e.g., "Mỳ Quảng Nhung", "Bún cá 109")
    - address: "Da Nang" (since this is a Da Nang food tour)
    - dishes: Infer the main dish from the name if possible (e.g., "Mỳ Quảng" for "Mỳ Quảng Nhung", "Bún cá" for "Bún cá 109")
    - priceRange: "$" for street food (default assumption for these types of videos)
    - notes: Brief note about what type of food they serve
    - timestamp: Convert timestamp to seconds if available (e.g., "2:15" = 135)

    Return ONLY the JSON array. If no restaurants are identified, return [].

    Video Title: ${metadata.title}
    Video Description:
    ${metadata.description}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        console.error('AI returned non-array format', data)
        return []
      }

      // Validate and clean up data
      const validRestaurants = data
        .map(item => ({
          ...item,
          name: item.name?.trim(),
          dishes: Array.isArray(item.dishes) ? item.dishes : (item.dishes ? [item.dishes] : []),
          priceRange: item.priceRange || '$',
          timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0
        }))
        .filter(item => item.name && item.name.length > 2)

      return validRestaurants as RestaurantMention[]

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('Raw response:', text)
      return []
    }

  } catch (error) {
    console.error('Error during AI extraction from description:', error)
    return []
  }
}

/**
 * Parse YouTube video and extract restaurant data
 * Main entry point for YouTube video processing
 */
export async function parseYouTubeVideo(url: string): Promise<{
  metadata: YouTubeVideoMetadata | null
  restaurants: RestaurantMention[]
}> {
  const videoId = extractVideoId(url)

  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Get video metadata
  let metadata = await getVideoMetadata(videoId)

  if (!metadata) {
    console.warn('⚠️ Could not fetch video metadata (API key missing or invalid). Proceeding with defaults.')
    // valid default metadata just to pass through to extraction
    metadata = {
      videoId,
      title: 'Unknown Video Title',
      description: '',
      channelName: 'Unknown Channel',
      channelId: '',
      publishedAt: new Date().toISOString(),
      duration: 0,
      viewCount: 0,
      likeCount: 0,
    }
  }

  // Get transcript
  console.log(`fetching transcript for video: ${videoId}`)
  const transcript = await getVideoTranscript(videoId)

  let restaurants: RestaurantMention[]

  if (transcript) {
    // Extract restaurants from transcript
    console.log('Extracting restaurants from transcript...')
    restaurants = await extractRestaurantsFromTranscript(transcript, metadata)
  } else {
    // Fallback: try to extract from video description
    console.log('⚠️ Transcript not available, trying description-based extraction...')
    restaurants = await extractRestaurantsFromDescription(metadata)
  }

  return { metadata, restaurants }
}

/**
 * Validate extracted restaurant data
 */
export function validateRestaurantMention(data: unknown): RestaurantMention | null {
  try {
    return RestaurantMentionSchema.parse(data)
  } catch (error) {
    console.error('Invalid restaurant mention:', error)
    return null
  }
}

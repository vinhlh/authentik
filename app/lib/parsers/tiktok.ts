/**
 * TikTok Video Parser
 * Uses Gemini Multimodal (Video/Audio) to extract restaurant data
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import util from 'util'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { RestaurantMention } from './youtube'

const execAsync = util.promisify(exec)

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
// @ts-ignore
const { GEMINI_CONFIG } = require('../ai/config');
const model = genAI.getGenerativeModel({
  model: GEMINI_CONFIG.modelName,
  generationConfig: GEMINI_CONFIG.generationConfig
})

/**
 * TikTok Metadata structure
 */
export interface TikTokVideoMetadata {
  videoId: string
  description: string
  authorName: string
  hashtags: string[]
  url: string
}

/**
 * Main entry point: Parse TikTok video
 */
export async function parseTikTokVideo(url: string): Promise<{
  metadata: TikTokVideoMetadata | null
  restaurants: RestaurantMention[]
}> {
  console.log(`🎬 Processing TikTok: ${url}`)

  // Guard: Reject channel URLs
  if (url.includes('/@') && !url.includes('/video/')) {
    throw new Error('❌ This looks like a Channel URL. Please use "npm run discover" for channels, or provide a specific video URL.')
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required for TikTok extraction')
  }

  const tempDir = os.tmpdir()
  const tempFile = path.join(tempDir, `tiktok-${Date.now()}.mp4`)

  try {
    // 1. Get Metadata first (fast)
    const metadata = await extractMetadata(url)
    console.log(`   📝 Title: ${metadata.description.slice(0, 50)}...`)
    console.log(`   👤 Author: ${metadata.authorName}`)

    // 2. Download Video (yt-dlp)
    console.log('   ⬇️  Downloading video for AI analysis...')
    await downloadVideo(url, tempFile)

    // 3. Upload to Gemini
    console.log('   🧠 Sending to Gemini 1.5 Flash (Multimodal)...')
    const restaurants = await extractWithGemini(tempFile, metadata)

    return { metadata, restaurants }

  } catch (error) {
    console.error('Error parsing TikTok:', error)
    throw error
  } finally {
    // Cleanup
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
    }
  }
}

/**
 * Extract basic metadata using yt-dlp --dump-json
 */
async function extractMetadata(url: string): Promise<TikTokVideoMetadata> {
  const { stdout } = await execAsync(`yt-dlp --dump-json "${url}"`, { maxBuffer: 10 * 1024 * 1024 })
  const data = JSON.parse(stdout)

  return {
    videoId: data.id,
    description: data.description || data.title || '',
    authorName: data.uploader || 'Unknown',
    hashtags: data.tags || [],
    url: data.webpage_url || url
  }
}

/**
 * Download video to temp file
 */
async function downloadVideo(url: string, outputPath: string) {
  // Download best quality that is mp4
  await execAsync(`yt-dlp -f "best[ext=mp4]" -o "${outputPath}" "${url}"`)
}

/**
 * Upload file to Gemini and extract structured data
 */
async function extractWithGemini(
  filePath: string,
  metadata: TikTokVideoMetadata
): Promise<RestaurantMention[]> {
  // Read file as base64
  const fileData = fs.readFileSync(filePath)
  const base64Data = fileData.toString('base64')

  const prompt = `
  You are an expert food critic assistant.
  Watch this TikTok video and extract restaurant recommendations.

  Context:
  - Description: ${metadata.description}
  - Author: ${metadata.authorName}
  - Location context: Da Nang, Vietnam

  Task:
  1. Identify any restaurants or food stalls mentioned or shown.
  2. Extract the name, approximate address, recommended dishes, and price estimation.
  3. Ignore non-food places.

  Output ONLY valid JSON array with this structure:
  [
    {
      "name": "Restaurant Name",
      "address": "Address or location description",
      "dishes": ["dish 1", "dish 2"],
      "priceRange": "Cheap ($) or Moderate ($$) or Expensive ($$$)",
      "description": "Detailed summary of the review, including atmosphere and specific food feedback"
    }
  ]
  If no restaurants found, return []
  `

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "video/mp4",
        data: base64Data
      }
    },
    { text: prompt }
  ])

  const response = result.response
  const text = response.text()

  // Clean JSON (handle markdown code blocks)
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

  // Find array
  const jsonMatch = cleanText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const rawData = JSON.parse(jsonMatch[0])

    // Map to RestaurantMention
    return rawData.map((item: any) => ({
      name: item.name,
      address: item.address || '',
      dishes: item.dishes || [],
      priceRange: item.priceRange,
      description: item.description || '',
      timestamp: 0 // Cannot easily get timestamp from Gemini yet without more complex prompting
    }))
  } catch (e) {
    console.error('Failed to parse Gemini JSON:', text)
    return []
  }
}

/**
 * Platform detection helper
 */
export function detectVideoPlatform(url: string): 'youtube' | 'tiktok' | 'unknown' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  return 'unknown'
}

/**
 * Photo Download & AI Enhancement Pipeline
 * Downloads highlight food photos and enhances them using Gemini AI
 */

import { mkdir, writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PlaceDetails, selectBestPhotos, getPhotoUrl, EnhancedPhoto } from './api/google-places'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Photo analysis result from Gemini Vision
 */
export interface PhotoAnalysis {
  isFood: boolean
  foodScore: number      // 0-100: how appealing the food looks
  qualityScore: number   // 0-100: image quality (lighting, focus, composition)
  category: 'food_closeup' | 'food_table' | 'interior' | 'exterior' | 'other'
  description: string    // Brief description of what's in the photo
}

/**
 * Create a URL-friendly slug from text
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/^-|-$/g, '')
}

/**
 * Get short place ID for filenames
 */
function getShortPlaceId(placeId: string): string {
  // Place IDs can be long - take last 12 chars
  return placeId.slice(-12)
}

/**
 * Analyze a photo using Gemini Vision
 * Identifies food content, quality, and appeal
 */
export async function analyzePhotoWithAI(imageBuffer: Buffer): Promise<PhotoAnalysis | null> {
  if (!GEMINI_API_KEY) {
    return null
  }

  try {
    const base64Image = imageBuffer.toString('base64')

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analyze this restaurant photo. Respond ONLY with valid JSON:
{
  "isFood": boolean,        // true if photo shows food
  "foodScore": number,      // 0-100: how appealing the food looks
  "qualityScore": number,   // 0-100: image quality (lighting, focus)
  "category": "food_closeup" | "food_table" | "interior" | "exterior" | "other",
  "description": "brief description"
}`
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Gemini Vision error:', response.status)
      return null
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0]) as PhotoAnalysis
  } catch (error) {
    console.error('Error analyzing photo:', error)
    return null
  }
}

/**
 * Enhance a photo using Gemini 2.0 Flash image generation
 * Creates an enhanced version while preserving authenticity
 */
export async function enhancePhotoWithAI(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set - using Sharp fallback')
    return enhancePhotoWithSharp(inputPath, outputPath)
  }

  try {
    const imageBuffer = await readFile(inputPath)
    const base64Image = imageBuffer.toString('base64')

    const response = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Enhance this food photo:
- Improve lighting and color balance subtly
- Sharpen food details
- Keep authentic Vietnamese street food atmosphere
- Do NOT over-process or make it look artificial
- Preserve original colors and setting`
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            responseModalities: ['image'],
          }
        })
      }
    )

    if (!response.ok) {
      // Fall back to Sharp if Gemini image gen not available
      console.log('   ⚠️ Gemini image gen unavailable, using Sharp')
      return enhancePhotoWithSharp(inputPath, outputPath)
    }

    const result = await response.json()
    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (!imagePart?.inlineData?.data) {
      return enhancePhotoWithSharp(inputPath, outputPath)
    }

    const enhancedBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
    await writeFile(outputPath, enhancedBuffer)
    return true
  } catch (error) {
    console.error('Gemini enhancement error, falling back to Sharp:', error)
    return enhancePhotoWithSharp(inputPath, outputPath)
  }
}

/**
 * Photo with AI analysis
 */
interface AnalyzedPhoto {
  url: string
  photoReference: string
  analysis: PhotoAnalysis | null
  tempPath?: string
}

/**
 * Select best food photos using AI analysis
 * Downloads photos, analyzes with Gemini Vision, selects top food shots
 */
export async function selectBestPhotosWithAI(
  place: PlaceDetails,
  tempDir: string,
  maxPhotos: number = 3
): Promise<EnhancedPhoto[]> {
  if (!place.photos || place.photos.length === 0) {
    return []
  }

  // If no API key, fall back to heuristic selection
  if (!GEMINI_API_KEY) {
    return selectBestPhotos(place, maxPhotos)
  }

  console.log(`   🤖 AI analyzing ${Math.min(place.photos.length, 10)} photos...`)

  // Analyze up to 10 photos (API cost consideration)
  const photosToAnalyze = place.photos.slice(0, 10)
  const analyzed: AnalyzedPhoto[] = []

  for (let i = 0; i < photosToAnalyze.length; i++) {
    const photo = photosToAnalyze[i]
    const url = getPhotoUrl(photo.photo_reference, 400) // Smaller for analysis

    try {
      // Rate limiting: wait between API calls
      if (i > 0) await new Promise(r => setTimeout(r, 500))

      const response = await fetch(url, { redirect: 'follow' })
      if (!response.ok) continue

      const buffer = Buffer.from(await response.arrayBuffer())
      const analysis = await analyzePhotoWithAI(buffer)

      analyzed.push({
        url: getPhotoUrl(photo.photo_reference, 800), // Full size URL
        photoReference: photo.photo_reference,
        analysis
      })
    } catch {
      continue
    }
  }

  // Sort by food score (food photos first), then by quality
  const sorted = analyzed
    .filter(p => p.analysis?.isFood === true)
    .sort((a, b) => {
      const aScore = (a.analysis?.foodScore || 0) + (a.analysis?.qualityScore || 0)
      const bScore = (b.analysis?.foodScore || 0) + (b.analysis?.qualityScore || 0)
      return bScore - aScore
    })

  // If not enough food photos, add non-food ones
  if (sorted.length < maxPhotos) {
    const nonFood = analyzed
      .filter(p => !p.analysis?.isFood)
      .sort((a, b) => (b.analysis?.qualityScore || 0) - (a.analysis?.qualityScore || 0))
    sorted.push(...nonFood)
  }

  // Convert to EnhancedPhoto format
  return sorted.slice(0, maxPhotos).map(p => ({
    url: p.url,
    photoReference: p.photoReference,
    width: 0,
    height: 0,
    category: (p.analysis?.category === 'food_closeup' || p.analysis?.category === 'food_table')
      ? 'food' as const
      : p.analysis?.category === 'interior'
        ? 'interior' as const
        : p.analysis?.category === 'exterior'
          ? 'exterior' as const
          : 'unknown' as const,
    score: (p.analysis?.foodScore || 0) + (p.analysis?.qualityScore || 0)
  }))
}

/**
 * Download a photo from URL and save to disk
 */
export async function downloadPhoto(
  url: string,
  destPath: string
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      redirect: 'follow', // Google redirects photo URLs
    })

    if (!response.ok) {
      console.error(`Failed to download photo: ${response.status}`)
      return false
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await writeFile(destPath, buffer)
    return true
  } catch (error) {
    console.error('Error downloading photo:', error)
    return false
  }
}

/**
 * Enhance a photo using Sharp (fallback)
 * Applies subtle improvements while preserving authenticity
 */
export async function enhancePhotoWithSharp(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  try {
    const sharp = (await import('sharp')).default

    await sharp(inputPath)
      // Light sharpening to bring out food details
      .sharpen({
        sigma: 1.0,        // Subtle sharpening
        m1: 0.5,           // Flat area sharpening
        m2: 1.5,           // Edge sharpening
      })
      // Normalize colors - subtle enhancement
      .modulate({
        brightness: 1.02,  // Very slight brightness boost
        saturation: 1.08,  // Subtle color boost for food appeal
      })
      // Ensure good quality output
      .jpeg({
        quality: 90,
        mozjpeg: true,     // Better compression
      })
      .toFile(outputPath)

    return true
  } catch (error) {
    console.error('Error enhancing photo:', error)
    return false
  }
}

/**
 * Photo processing result
 */
export interface PhotoResult {
  originalPath: string
  enhancedPath: string | null
  category: EnhancedPhoto['category']
  success: boolean
}

/**
 * Process photos for a restaurant
 * Downloads originals and creates AI-enhanced versions
 */
export async function processRestaurantPhotos(
  place: PlaceDetails,
  collectionSlug: string,
  maxPhotos: number = 3
): Promise<PhotoResult[]> {
  const results: PhotoResult[] = []

  // Create images directory
  const imagesDir = path.join(process.cwd(), 'images', collectionSlug)
  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true })
  }

  // Select best photos using AI (falls back to heuristics if no API key)
  const selectedPhotos = await selectBestPhotosWithAI(place, imagesDir, maxPhotos)

  if (selectedPhotos.length === 0) {
    console.log('   📷 No photos available')
    return results
  }

  const shortId = getShortPlaceId(place.place_id)

  for (let i = 0; i < selectedPhotos.length; i++) {
    const photo = selectedPhotos[i]
    const index = i + 1

    const originalFilename = `${shortId}-original-${index}.jpg`
    const enhancedFilename = `${shortId}-enhanced-${index}.jpg`

    const originalPath = path.join(imagesDir, originalFilename)
    const enhancedPath = path.join(imagesDir, enhancedFilename)

    // Download original
    console.log(`   📥 Downloading photo ${index}/${selectedPhotos.length}...`)
    const downloadSuccess = await downloadPhoto(photo.url, originalPath)

    if (!downloadSuccess) {
      results.push({
        originalPath,
        enhancedPath: null,
        category: photo.category,
        success: false
      })
      continue
    }

    // Enhance with AI (falls back to Sharp if unavailable)
    console.log(`   ✨ Enhancing photo ${index}/${selectedPhotos.length}...`)
    const enhanceSuccess = await enhancePhotoWithAI(originalPath, enhancedPath)

    results.push({
      originalPath,
      enhancedPath: enhanceSuccess ? enhancedPath : null,
      category: photo.category,
      success: true
    })
  }

  const successCount = results.filter(r => r.success).length
  const enhancedCount = results.filter(r => r.enhancedPath).length
  console.log(`   📸 Photos: ${successCount} downloaded, ${enhancedCount} enhanced`)

  return results
}

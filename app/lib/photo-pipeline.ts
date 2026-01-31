import { GEMINI_CONFIG } from './ai/config'

/**
 * Photo Download & AI Enhancement Pipeline
 * Downloads highlight food photos and enhances them using Gemini AI
 * Uploads to Supabase Storage
 */

import { mkdir, writeFile, readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import os from 'os'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { PlaceDetails, selectBestPhotos, getPhotoUrl, EnhancedPhoto, calculatePhotoScore } from './api/google-places'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Supabase Storage configuration
const STORAGE_BUCKET = 'Authentik Images'

// Initialize Supabase client for storage operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key are required. Check your .env.local file.')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Upload a file to Supabase Storage
 * Returns the public URL
 */
async function uploadToStorage(
  filePath: string,
  storagePath: string
): Promise<string | null> {
  const supabase = getSupabaseClient()

  try {
    const fileBuffer = await readFile(filePath)

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true // Overwrite if exists
      })

    if (error) {
      console.error(`   ❌ Upload failed: ${error.message}`)
      return null
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    return urlData.publicUrl
  } catch (err) {
    console.error(`   ❌ Upload error:`, err)
    return null
  }
}

/**
 * Cleanup old photos for a restaurant from Supabase Storage
 */
export async function cleanupOldPhotos(
  collectionSlug: string,
  shortPlaceId: string
): Promise<void> {
  const supabase = getSupabaseClient()
  const storagePath = `${collectionSlug}`

  try {
    // List files in the collection folder
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(storagePath, {
        limit: 100,
        search: shortPlaceId // Filter by place ID
      })

    if (listError) {
      console.error(`   ⚠️ Failed to list files for cleanup: ${listError.message}`)
      return
    }

    if (!files || files.length === 0) return

    // Delete found files
    const filesToDelete = files.map(f => `${storagePath}/${f.name}`)
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filesToDelete)

    if (deleteError) {
      console.error(`   ⚠️ Failed to delete old photos: ${deleteError.message}`)
    } else {
      console.log(`   🧹 Cleaned up ${files.length} old photos`)
    }
  } catch (err) {
    console.error(`   ⚠️ Cleanup error:`, err)
  }
}

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
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelayMs: 2000,  // Start with 2 seconds
  maxDelayMs: 30000,     // Max 30 seconds
  backoffMultiplier: 2,   // Double delay each retry
}

/**
 * Sleep helper
 */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Retry a function with exponential backoff on rate limit errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let delay = RETRY_CONFIG.initialDelayMs

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429')

      if (!isRateLimit || attempt === RETRY_CONFIG.maxRetries) {
        throw error
      }

      console.log(`   ⏳ Rate limited (${context}), retry ${attempt}/${RETRY_CONFIG.maxRetries} in ${delay / 1000}s...`)
      await sleep(delay)
      delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs)
    }
  }

  throw new Error(`Max retries exceeded for ${context}`)
}

/**
 * Analyze a photo using Gemini Vision
 * Identifies food content, quality, and appeal
 */
export async function analyzePhotoWithAI(imageBuffer: Buffer): Promise<PhotoAnalysis | null> {
  const { GEMINI_CONFIG } = await import('./ai/config')

  if (!GEMINI_API_KEY) {
    return null
  }

  return retryWithBackoff(async () => {
    const base64Image = imageBuffer.toString('base64')

    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_CONFIG.modelName}:generateContent?key=${GEMINI_API_KEY}`,
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
      const error = new Error(`Gemini Vision error: ${response.status}`) as any
      error.status = response.status
      throw error
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0]) as PhotoAnalysis
  }, 'photo analysis')
}

/**
 * Enhance a photo using Gemini 2.0 Flash image generation
 * Creates an enhanced version while preserving authenticity
 * Retries on rate limit errors
 */
export async function enhancePhotoWithAI(
  inputPath: string,
  outputPath: string
): Promise<boolean> {
  const { GEMINI_CONFIG } = await import('./ai/config')

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set')
  }

  return retryWithBackoff(async () => {
    const imageBuffer = await readFile(inputPath)
    const base64Image = imageBuffer.toString('base64')

    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_CONFIG.imageModelName}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Enhance the lighting and color of this food photo to make it look like a high-end food delivery app studio shot:
- STRICTLY PRESERVE all food ingredients and arrangement
- Do NOT add or remove any items
- Focus on Relighting (Bright, soft, studio quality) and Color Grading (Vibrant, appetizing)
- Keep geometry 100% identical to original
- Make it look delicious without changing the food itself`
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
      const error = new Error(`Gemini enhancement error: ${response.status}`) as any
      error.status = response.status
      throw error
    }

    const result = await response.json()
    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (!imagePart?.inlineData?.data) {
      throw new Error('No image in response')
    }

    const enhancedBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
    await writeFile(outputPath, enhancedBuffer)
    return true
  }, 'photo enhancement')
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
  isEnhanced: boolean
  webPath: string // Web-accessible path (e.g., /images/slug/file.jpg)
}

/**
 * Process photos for a restaurant
 * 1. Downloads all photos (up to 10) as candidates to temp dir
 * 2. AI analyzes and selects best 3 food photos
 * 3. Uploads selected photos to Supabase Storage
 */
export async function processRestaurantPhotos(
  place: PlaceDetails,
  collectionSlug: string,
  maxPhotos: number = 3,
  maxCandidates: number = 10,
  options: { skipAnalysis?: boolean; skipEnhancement?: boolean } = {}
): Promise<PhotoResult[]> {
  const results: PhotoResult[] = []

  if (!place.photos || place.photos.length === 0) {
    console.log('   📷 No photos available')
    return results
  }

  // Use temp directory for downloads
  const tempDir = path.join(os.tmpdir(), 'authentik-photos', collectionSlug)
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true })
  }

  const shortId = getShortPlaceId(place.place_id)

  // Clean up old photos first to ensure we don't have mixed content
  console.log(`   🧹 Cleaning up old photos...`)
  await cleanupOldPhotos(collectionSlug, shortId)

  // Sort photos by score to prioritize food photos
  const sortedPhotos = [...place.photos].sort((a, b) => {
    const scoreA = calculatePhotoScore(a).score
    const scoreB = calculatePhotoScore(b).score
    return scoreB - scoreA
  })

  const photosToDownload = sortedPhotos.slice(0, maxCandidates)

  console.log(`   📥 Downloading ${photosToDownload.length} candidate photos...`)

  // Step 1: Download all candidate photos to temp
  const downloaded: { path: string; index: number; analysis: PhotoAnalysis | null }[] = []

  for (let i = 0; i < photosToDownload.length; i++) {
    const photo = photosToDownload[i]

    // Use a hash of the photo reference for the filename to avoid collisions/stale cache
    // when sort order changes
    const photoHash = createHash('md5').update(photo.photo_reference).digest('hex').slice(0, 8)
    const candidateFilename = `${shortId}-${photoHash}.jpg`
    const candidatePath = path.join(tempDir, candidateFilename)

    const url = getPhotoUrl(photo.photo_reference, 800)
    let success = false
    if (existsSync(candidatePath)) {
      success = true
    } else {
      success = await downloadPhoto(url, candidatePath)
    }

    if (success) {
      downloaded.push({ path: candidatePath, index: i, analysis: null })
    }
  }

  console.log(`   ✅ Downloaded ${downloaded.length}/${photosToDownload.length} photos`)

  // Step 2: AI analyze each photo (if API available and not skipped)
  if (!options.skipAnalysis && GEMINI_API_KEY && downloaded.length > 0) {
    console.log(`   🤖 AI analyzing ${downloaded.length} photos...`)

    for (let i = 0; i < downloaded.length; i++) {
      const item = downloaded[i]

      // Rate limiting: wait 10s between API calls to strictly respect Free Tier limits
      if (i > 0) await new Promise(r => setTimeout(r, 10000))

      try {
        const buffer = await readFile(item.path)
        item.analysis = await analyzePhotoWithAI(buffer)
      } catch {
        // Analysis failed, will use heuristic scoring
      }
    }
  } else if (options.skipAnalysis) {
    console.log(`   ⏩ Skipping AI analysis as requested`)
  }

  // Step 3: Rank and select best photos
  const ranked = downloaded
    .map(item => ({
      ...item,
      score: item.analysis
        ? (item.analysis.isFood ? 100 : 0) + item.analysis.foodScore + item.analysis.qualityScore
        : 50 // Default score for unanalyzed
    }))
    .sort((a, b) => b.score - a.score)

  const selected = ranked.slice(0, maxPhotos)
  const selectedPaths = new Set(selected.map(s => s.path))

  console.log(`   🏆 Selected top ${selected.length} photos for processing`)

  // Step 4: Enhance (or upload original) selected photos
  for (let i = 0; i < selected.length; i++) {
    const item = selected[i]

    let enhancedPath: string | null = null
    let isEnhanced = false
    let finalStoragePath = ''
    let publicUrl: string | null = null

    // Enhance if requested and not skipped
    if (!options.skipEnhancement) {
      // Rate limiting for enhancement (stricter limit for Image Gen)
      if (i > 0) await new Promise(r => setTimeout(r, 10000))

      const enhancedFilename = `${shortId}-enhanced-${item.index}.jpg`
      const targetEnhancedPath = path.join(tempDir, enhancedFilename)
      finalStoragePath = `${collectionSlug}/${enhancedFilename}`

      console.log(`   ✨ Enhancing photo ${item.index}...`)
      try {
        await enhancePhotoWithAI(item.path, targetEnhancedPath)
        enhancedPath = targetEnhancedPath
        isEnhanced = true

        // Upload enhanced
        publicUrl = await uploadToStorage(enhancedPath, finalStoragePath)
        if (publicUrl) console.log(`   ☁️  Uploaded enhanced: ${finalStoragePath}`)
      } catch (error) {
        console.log(`   ⚠️ Enhancement failed, using original:`, error instanceof Error ? error.message : String(error))
      }
    } else {
      console.log(`   ⏩ Skipping enhancement for photo ${item.index}`)
    }

    // Fallback logic: If enhancement skipped or failed, upload original
    if (!publicUrl) {
      const originalFilename = `${shortId}-${item.index}.jpg`
      finalStoragePath = `${collectionSlug}/${originalFilename}`

      publicUrl = await uploadToStorage(item.path, finalStoragePath)
      if (publicUrl) console.log(`   ☁️  Uploaded original: ${finalStoragePath}`)
    }

    if (publicUrl) {
      results.push({
        originalPath: item.path,
        enhancedPath,
        category: item.analysis?.category === 'food_closeup' || item.analysis?.category === 'food_table'
          ? 'food'
          : item.analysis?.category === 'interior'
            ? 'interior'
            : item.analysis?.category === 'exterior'
              ? 'exterior'
              : 'unknown',
        success: true,
        isEnhanced,
        webPath: publicUrl
      })
    }
  }

  const enhancedCount = results.filter(r => r.isEnhanced).length
  console.log(`   📸 Photos: ${downloaded.length} saved, ${enhancedCount} enhanced`)

  return results
}

/**
 * Process already downloaded photos in a directory
 */
export async function processLocalPhotos(
  imagesDir: string,
  shortId: string,
  maxPhotos: number = 3
): Promise<PhotoResult[]> {
  const results: PhotoResult[] = []

  // Find candidate photos
  const candidates = (await import('fs/promises')).readdir(imagesDir)
    .then(files => files
      .filter(f => f.startsWith(`${shortId}-candidate-`) && f.endsWith('.jpg'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/candidate-(\d+)/)?.[1] || '0')
        const numB = parseInt(b.match(/candidate-(\d+)/)?.[1] || '0')
        return numA - numB
      })
      .map(f => ({
        path: path.join(imagesDir, f),
        index: parseInt(f.match(/candidate-(\d+)/)?.[1] || '0'),
        analysis: null as PhotoAnalysis | null
      }))
    )

  const downloaded = await candidates
  console.log(`   📂 Found ${downloaded.length} candidate photos locally`)

  if (downloaded.length === 0) return []

  // Step 2: AI Analyze
  console.log(`   🤖 AI analyzing ${downloaded.length} photos...`)
  for (let i = 0; i < downloaded.length; i++) {
    const item = downloaded[i]

    // Rate limiting: wait 10s between API calls
    if (i > 0) await new Promise(r => setTimeout(r, 10000))

    try {
      const buffer = await readFile(item.path)
      item.analysis = await analyzePhotoWithAI(buffer)
    } catch (e) {
      console.error(`Warning: Analysis failed for ${item.path}`, e)
    }
  }

  // Step 3: Rank
  const ranked = downloaded
    .map(item => ({
      ...item,
      score: item.analysis
        ? (item.analysis.isFood ? 100 : 0) + item.analysis.foodScore + item.analysis.qualityScore
        : 50
    }))
    .sort((a, b) => b.score - a.score)

  const selected = ranked.slice(0, maxPhotos)
  const selectedPaths = new Set(selected.map(s => s.path))

  console.log(`   🏆 Selected top ${selected.length} photos for enhancement`)

  // Step 4: Enhance
  for (let i = 0; i < selected.length; i++) {
    const item = selected[i]

    // Rate limiting
    if (i > 0) await new Promise(r => setTimeout(r, 10000))

    const enhancedFilename = `${shortId}-enhanced-${item.index}.jpg`
    const enhancedPath = path.join(imagesDir, enhancedFilename)

    // Check if already enhanced
    if (existsSync(enhancedPath)) {
      console.log(`   ✨ Photo ${item.index} already enhanced, skipping`)
      continue
    }

    console.log(`   ✨ Enhancing photo ${item.index}...`)
    try {
      await enhancePhotoWithAI(item.path, enhancedPath)
    } catch (error) {
      console.log(`   ⚠️ Enhancement failed:`, error instanceof Error ? error.message : String(error))
    }
  }

  // Results
  for (const item of downloaded) {
    const isSelected = selectedPaths.has(item.path)
    const expectedEnhancedPath = path.join(imagesDir, `${shortId}-enhanced-${item.index}.jpg`)
    const enhancedExists = isSelected && existsSync(expectedEnhancedPath)

    results.push({
      originalPath: item.path,
      enhancedPath: enhancedExists ? expectedEnhancedPath : null,
      category: item.analysis?.category as any || 'unknown',
      success: true,
      isEnhanced: isSelected,
      webPath: `/images/${shortId}/${path.basename(enhancedExists ? expectedEnhancedPath : item.path)}` // Note: shortId logic might need review if folder is slug
    })
  }

  return results
}

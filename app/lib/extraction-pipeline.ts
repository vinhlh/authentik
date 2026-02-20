/**
 * Content Extraction Pipeline
 * Orchestrates video parsing, verification, and data enrichment
 */

import { parseYouTubeVideo, type RestaurantMention } from './parsers/youtube'
import { parseTikTokVideo, detectVideoPlatform } from './parsers/tiktok'
import {
  verifyRestaurant,
  classifyRestaurant,
  calculateAuthenticityWithSignals,
  selectBestPhotos,
  type PlaceDetails,
} from './api/google-places'
import {
  detectMarketCityFromText,
  getCityLocationBias,
  replaceCollectionCityTags,
  type MarketCity,
} from './market-cities'
import { supabase } from './supabase'
import { processRestaurantPhotos, createSlug } from './photo-pipeline'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface ExtractionOptions {
  dry?: boolean  // Preview mode - don't import to database
}

export interface ExtractionResult {
  collection: {
    id: string
    url_key?: string | null
    name: string
    name_vi?: string
    name_en?: string | null
    description_vi?: string | null
    description_en?: string | null
    creator_name: string
    source_url: string
    source_channel_id?: string | null
    source_channel_url?: string | null
    source_channel_name?: string | null
  }
  restaurants: Array<{
    mention: RestaurantMention
    verified: PlaceDetails | null
    imported: boolean
    restaurantId?: string
  }>
  stats: {
    totalMentions: number
    verified: number
    imported: number
    failed: number
  }
  logs?: string[]
  dry: boolean
}

/**
 * Extract restaurants from a video URL
 */
export async function extractFromVideo(
  url: string,
  creatorName: string,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  const { dry = false } = options
  const platform = detectVideoPlatform(url)

  if (platform === 'unknown') {
    throw new Error('Unsupported video platform')
  }

  if (dry) {
    console.log('🔍 DRY RUN MODE - No changes will be made to the database\n')
  }

  console.log(`📹 Extracting from ${platform} video: ${url}`)

  // Parse video based on platform
  let metadata: {
    title?: string
    description?: string
    channelName?: string
    channelId?: string
    authorName?: string
  } | null = null
  let restaurants: RestaurantMention[]

  if (platform === 'youtube') {
    const result = await parseYouTubeVideo(url)
    metadata = result.metadata
    restaurants = result.restaurants
  } else {
    const result = await parseTikTokVideo(url)
    metadata = result.metadata
    restaurants = result.restaurants
  }

  console.log(`✅ Found ${restaurants.length} restaurant mentions`)
  const targetCity = detectMarketCityFromText(
    metadata?.title,
    metadata?.description,
    ...restaurants.slice(0, 5).map(r => r.address),
    url
  )
  console.log(`🌏 Market focus: ${targetCity.name}, ${targetCity.country}`)

  const sourceChannelId =
    platform === 'youtube'
      ? (metadata?.channelId || null)
      : null
  const sourceChannelName =
    platform === 'youtube'
      ? (metadata?.channelName || creatorName)
      : platform === 'tiktok'
        ? (metadata?.authorName || creatorName)
        : creatorName
  const sourceChannelUrl =
    platform === 'youtube' && sourceChannelId
      ? `https://www.youtube.com/channel/${sourceChannelId}`
      : null

  // --- OPTIMIZED: Unified AI Extraction ---
  console.log(`🧠 AI Processing: Generating unified collection details and reviews...`)
  let unifiedData = await generateUnifiedExtraction(
    metadata || { title: '', description: '' },
    restaurants,
    creatorName,
    targetCity
  )

  // Use AI data or fallbacks
  const collectionName = unifiedData?.collection.name_vi || metadata?.title || `Collection from ${creatorName}`
  const collectionDescription = unifiedData?.collection.description_vi || metadata?.description || null
  const nameEn = unifiedData?.collection.name_en || null
  const descriptionEn = unifiedData?.collection.description_en || null

  // In dry mode, create a mock collection
  let collection: {
    id: string;
    url_key?: string | null;
    name: string;
    name_vi?: string;
    name_en?: string | null;
    description_vi?: string | null;
    description_en?: string | null;
    creator_name?: string;
    source_url?: string;
    source_channel_id?: string | null;
    source_channel_url?: string | null;
    source_channel_name?: string | null;
  }

  if (dry) {
    collection = {
      id: 'dry-run-preview',
      url_key: createSlug(collectionName) || 'dry-run-preview',
      name: collectionName,
      name_vi: collectionName,
      source_channel_id: sourceChannelId,
      source_channel_url: sourceChannelUrl,
      source_channel_name: sourceChannelName,
    }
    console.log(`📝 Would create collection: ${collection.name}`)
    if (nameEn) console.log(`   (EN): ${nameEn}`)
    if (descriptionEn) console.log(`   (EN Desc): ${descriptionEn?.substring(0, 50)}...`)
  } else {
    // Check if collection already exists by source_url OR video ID search
    // We normalize by searching for the video ID to handle different URL formats
    let existingCollection: any = null

    if (platform === 'youtube') {
      const { extractVideoId } = await import('./parsers/youtube')
      const videoId = extractVideoId(url)

      if (videoId) {
        // Search for any source_url that contains this video ID
        const { data } = await supabase
          .from('collections')
          .select('*')
          .ilike('source_url', `%${videoId}%`)
          .single()
        existingCollection = data
      }
    }

    // Fallback to exact match if no ID found or not YouTube
    if (!existingCollection) {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('source_url', url)
        .single()
      existingCollection = data
    }

    if (existingCollection) {
      console.log(`🔄 Found existing collection: ${existingCollection.name_vi || existingCollection.name}`)
      const updatePayload: Record<string, unknown> = {
        name_vi: collectionName, // Update name if video title changed
        description_vi: collectionDescription,
        name_en: nameEn,
        description_en: descriptionEn,
        creator_name: creatorName,
        source_channel_name: sourceChannelName,
        // Keep non-city tags but enforce a single canonical city tag set.
        tags: replaceCollectionCityTags(existingCollection.tags, targetCity),
      }
      if (sourceChannelId) updatePayload.source_channel_id = sourceChannelId
      if (sourceChannelUrl) updatePayload.source_channel_url = sourceChannelUrl

      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('collections')
        .update(updatePayload)
        .eq('id', existingCollection.id)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(`Failed to update collection: ${updateError?.message}`)
      }
      collection = updated
      console.log(`✅ Updated collection: ${collection.name_vi || collection.name}`)
    } else {
      // Create new collection
      const { data: dbCollection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          name_vi: collectionName,
          description_vi: collectionDescription,
          name_en: nameEn,
          description_en: descriptionEn,
          creator_name: creatorName,
          source_url: url,
          source_channel_id: sourceChannelId,
          source_channel_url: sourceChannelUrl,
          source_channel_name: sourceChannelName,
          tags: replaceCollectionCityTags(null, targetCity),
        })
        .select()
        .single()

      if (collectionError || !dbCollection) {
        throw new Error(`Failed to create collection: ${collectionError?.message}`)
      }

      collection = dbCollection
      console.log(`📝 Created collection: ${collection.name_vi || collection.name}`)
    }
  }

  // Process each restaurant mention
  const results = []
  const stats = {
    totalMentions: restaurants.length,
    verified: 0,
    imported: 0,
    failed: 0,
  }

  for (const mention of restaurants) {
    try {
      console.log(`🔍 Verifying: ${mention.name}`)

      // Verify with Google Places
      const verified = await verifyRestaurant(mention.name, mention.address, {
        locationBias: getCityLocationBias(targetCity),
        cityName: targetCity.name,
      })

      if (!verified) {
        console.log(`❌ Could not verify: ${mention.name}`)
        stats.failed++
        results.push({ mention, verified: null, imported: false })
        continue
      }

      stats.verified++
      console.log(`✅ Verified: ${verified.name}`)

      if (dry) {
        // In dry mode, just show what would be imported
        const classification = classifyRestaurant(verified)
        const authenticity = calculateAuthenticityWithSignals(verified)
        const venueClassification = classifyVenue(verified.types || [], mention.dishes || [])
        const photos = selectBestPhotos(verified, 3)

        console.log(`   📍 Address: ${verified.formatted_address}`)
        console.log(`   ⭐ Rating: ${verified.rating || 'N/A'} (${verified.user_ratings_total || 0} reviews)`)
        console.log(`   🏪 Venue: ${venueClassification.venueType}`)
        console.log(`   🍜 Cuisine: ${venueClassification.cuisineStyles.join(', ')}`)
        if (venueClassification.specialties.length > 0) {
          console.log(`   ⭐ Specialties: ${venueClassification.specialties.join(', ')}`)
        }
        // Show authenticity badge and signals
        console.log(`   ${authenticity.badgeIcon} ${authenticity.badgeLabel} (Level ${authenticity.level}/5)`)
        for (const signal of authenticity.signals) {
          const icon = signal.value === 'positive' ? '✅' : signal.value === 'negative' ? '❌' : '➖'
          console.log(`      ${icon} ${signal.description}`)
        }
        console.log(`   💬 "${authenticity.summary}"`)
        // Show review warning if applicable
        if (authenticity.reviewWarning.hasWarning) {
          console.log(`   ⚠️  REVIEW WARNING: ${authenticity.reviewWarning.message}`)
          console.log(`      (${authenticity.reviewWarning.suspiciousCount}/${authenticity.reviewWarning.totalCount} reviews flagged)`)
        }
        if (photos.length > 0) {
          console.log(`   📸 Photos: ${photos.length} selected`)
        }

        // Match Unified Review
        const unifiedReview = unifiedData?.reviews.find(r => r.restaurant_name === mention.name)
        if (unifiedReview) {
          console.log(`   ✨ AI Review (VI): "${unifiedReview.summary_vi}"`)
          console.log(`   ✨ AI Review (EN): "${unifiedReview.summary_en}"`)
        }

        stats.imported++ // Count as "would be imported"
        results.push({ mention, verified, imported: false })
      } else {
        // Import to database
        const restaurantId = await importRestaurant(verified, mention)

        if (restaurantId) {
          // Get AI review summaries from Unified Data
          let aiSummaryEn: string | null = null
          let aiSummaryVi: string | null = null

          const unifiedReview = unifiedData?.reviews.find(r => r.restaurant_name === mention.name);
          if (unifiedReview) {
            aiSummaryVi = unifiedReview.summary_vi;
            aiSummaryEn = unifiedReview.summary_en;
            console.log(`   ✨ AI Review (VI): "${aiSummaryVi}"`)
          } else if (mention.notes && mention.notes.length > 20) {
            // Fallback to individual call if missed in unified pass (rare but possible)
            console.log(`   ⚠️ Missed in unified pass, generating fallback review...`);
            aiSummaryVi = await generateReviewSummary(mention.notes, creatorName, verified.name);
            await delay(12000);
          }

          // Link to collection (upsert/handle duplicates)
          await linkRestaurantToCollection(collection.id, restaurantId, mention, verified, aiSummaryEn, aiSummaryVi)

          // Process Photos (Non-blocking / Graceful fail)
          try {
            console.log(`   📸 Processing photos for: ${verified.name}...`)
            const collectionSlug = createSlug(collection.name_vi || collection.name)

            // We use the verified place details which has the photos array
            await processRestaurantPhotos(verified, collectionSlug, 3, 10, {
              skipEnhancement: true // Set to true if too slow/expensive
            })
          } catch (photoError) {
            console.error(`   ⚠️ Photo processing failed for ${verified.name}:`, photoError)
            // Don't fail the whole import just because photos failed
          }

          stats.imported++
          results.push({ mention, verified, imported: true, restaurantId })
        } else {
          stats.failed++
          results.push({ mention, verified, imported: false })
        }
      }
    } catch (error) {
      console.error(`Error processing ${mention.name}:`, error)
      stats.failed++
      results.push({ mention, verified: null, imported: false })
    }
  }

  console.log(`\n📊 Extraction ${dry ? 'preview' : 'complete'}:`)
  console.log(`   Total mentions: ${stats.totalMentions}`)
  console.log(`   Verified: ${stats.verified}`)
  console.log(`   ${dry ? 'Would import' : 'Imported'}: ${stats.imported}`)
  console.log(`   Failed: ${stats.failed}`)

  const logs: string[] = results
    .filter(r => !r.imported && !r.verified)
    .map(r => `Failed to process ${r.mention.name}`)

  if (stats.failed > 0) {
    logs.push(`${stats.failed} mentions failed verification/import`)
  }

  return {
    collection: {
      id: collection.id,
      url_key: collection.url_key || null,
      name: collection.name_vi || collection.name,
      creator_name: creatorName,
      source_url: url,
      source_channel_id: collection.source_channel_id || sourceChannelId || null,
      source_channel_url: collection.source_channel_url || sourceChannelUrl || null,
      source_channel_name: collection.source_channel_name || sourceChannelName || creatorName,
    },
    restaurants: results,
    stats,
    logs,
    dry,
  }
}

/**
 * Import restaurant to database (Upsert)
 */
async function importRestaurant(
  placeDetails: PlaceDetails,
  _mention: RestaurantMention
): Promise<string | null> {
  try {
    // Classify restaurant
    const classification = classifyRestaurant(placeDetails)
    const authenticity = calculateAuthenticityWithSignals(placeDetails)

    // Extract cuisine types from Google types
    const cuisineTypes = extractCuisineTypes(placeDetails.types || [])

    // Prepare restaurant data
    const restaurantData = {
      google_place_id: placeDetails.place_id,
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      location: placeDetails.geometry?.location
        ? `POINT(${placeDetails.geometry.location.lng} ${placeDetails.geometry.location.lat})`
        : null,
      cuisine_type: cuisineTypes,
      price_level: placeDetails.price_level || null,
      classification,
      authenticity_score: authenticity.score,
      phone_number: placeDetails.formatted_phone_number || null,
      website: placeDetails.website || null,
      opening_hours: placeDetails.opening_hours || null,
      google_rating: placeDetails.rating || null,
      google_user_ratings_total: placeDetails.user_ratings_total || null,
      authenticity_details: authenticity,
    }

    // Check if exists first (to decide update vs insert)
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('google_place_id', placeDetails.place_id)
      .single()

    let restaurantId: string

    if (existing) {
      console.log(`   🔄 Updating existing restaurant: ${placeDetails.name}`)
      const { error: updateError } = await supabase
        .from('restaurants')
        .update(restaurantData)
        .eq('id', existing.id)

      if (updateError) {
        console.error(`   ❌ Failed to update restaurant: ${updateError.message}`)
        return null
      }
      restaurantId = existing.id
    } else {
      console.log(`   ✨ Creating new restaurant: ${placeDetails.name}`)
      const { data: newRestaurant, error: insertError } = await supabase
        .from('restaurants')
        .insert(restaurantData)
        .select('id')
        .single()

      if (insertError || !newRestaurant) {
        console.error(`   ❌ Failed to insert restaurant: ${insertError?.message}`)
        return null
      }
      restaurantId = newRestaurant.id
    }

    return restaurantId
  } catch (error) {
    console.error('Error importing restaurant:', error)
    return null
  }
}

/**
 * Link restaurant to collection (Handle duplicates)
 */
async function linkRestaurantToCollection(
  collectionId: string,
  restaurantId: string,
  mention: RestaurantMention,
  verified: PlaceDetails,
  aiSummaryEn: string | null = null,
  aiSummaryVi: string | null = null
): Promise<void> {
  // Try to insert
  const { error } = await supabase
    .from('collection_restaurants')
    .insert({
      collection_id: collectionId,
      restaurant_id: restaurantId,
      notes: mention.notes,
      recommended_dishes: mention.dishes || null,
      ai_summary_en: aiSummaryEn,
      ai_summary_vi: aiSummaryVi
    })

  if (error) {
    if (error.code === '23505') { // Unique violation
      console.log(`   🔗 Already linked to collection (Updating notes & review)`)
      const updateData: any = {
        notes: mention.notes,
        recommended_dishes: mention.dishes || null,
      }
      if (aiSummaryEn) updateData.ai_summary_en = aiSummaryEn;
      if (aiSummaryVi) updateData.ai_summary_vi = aiSummaryVi;

      await supabase
        .from('collection_restaurants')
        .update(updateData)
        .eq('collection_id', collectionId)
        .eq('restaurant_id', restaurantId)
    } else {
      console.error('Error linking restaurant to collection:', error)
    }
  }
}

/**
 * Venue classification result with granular types
 */
interface VenueClassification {
  venueType: 'restaurant' | 'cafe' | 'street_food' | 'bar' | 'bakery' | 'food_stall'
  cuisineStyles: string[]   // e.g., ['Vietnamese', 'Seafood']
  specialties: string[]     // e.g., ['Bún Bò', 'Mì Quảng']
}

/**
 * Classify venue based on Google Place types and dish mentions
 */
function classifyVenue(types: string[], dishes: string[] = []): VenueClassification {
  // Determine venue type from Google Place types
  let venueType: VenueClassification['venueType'] = 'restaurant'

  if (types.includes('cafe') || types.includes('coffee_shop')) {
    venueType = 'cafe'
  } else if (types.includes('bar') || types.includes('night_club')) {
    venueType = 'bar'
  } else if (types.includes('bakery')) {
    venueType = 'bakery'
  } else if (types.includes('meal_takeaway') && !types.includes('restaurant')) {
    venueType = 'street_food'
  } else if (types.includes('food')) {
    // Generic food type often indicates street food stalls
    venueType = types.includes('restaurant') ? 'restaurant' : 'food_stall'
  }

  // Determine cuisine styles
  const cuisineStyles = new Set<string>()

  // Check Google types for cuisine hints
  const cuisineTypeMap: Record<string, string> = {
    'vietnamese_restaurant': 'Vietnamese',
    'seafood_restaurant': 'Seafood',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'korean_restaurant': 'Korean',
    'thai_restaurant': 'Thai',
    'indian_restaurant': 'Indian',
    'pizza_restaurant': 'Western',
    'hamburger_restaurant': 'Western',
  }

  for (const type of types) {
    if (cuisineTypeMap[type]) {
      cuisineStyles.add(cuisineTypeMap[type])
    }
  }

  // Infer cuisine from dish names
  const dishPatterns: { pattern: RegExp; cuisine: string; specialty: string }[] = [
    { pattern: /bún bò|bun bo/i, cuisine: 'Vietnamese', specialty: 'Bún Bò' },
    { pattern: /mì quảng|mi quang|mỳ quảng/i, cuisine: 'Vietnamese', specialty: 'Mì Quảng' },
    { pattern: /phở|pho/i, cuisine: 'Vietnamese', specialty: 'Phở' },
    { pattern: /bánh mì|banh mi/i, cuisine: 'Vietnamese', specialty: 'Bánh Mì' },
    { pattern: /bánh xèo|banh xeo/i, cuisine: 'Vietnamese', specialty: 'Bánh Xèo' },
    { pattern: /bánh canh|banh canh/i, cuisine: 'Vietnamese', specialty: 'Bánh Canh' },
    { pattern: /bún cá|bun ca/i, cuisine: 'Vietnamese', specialty: 'Bún Cá' },
    { pattern: /cơm gà|com ga/i, cuisine: 'Vietnamese', specialty: 'Cơm Gà' },
    { pattern: /hải sản|hai san|seafood/i, cuisine: 'Seafood', specialty: 'Hải Sản' },
    { pattern: /cà phê|ca phe|coffee/i, cuisine: 'Cafe', specialty: 'Cà Phê' },
    { pattern: /nem|chả|cha/i, cuisine: 'Vietnamese', specialty: 'Nem/Chả' },
    { pattern: /gỏi cuốn|goi cuon|spring roll/i, cuisine: 'Vietnamese', specialty: 'Gỏi Cuốn' },
    { pattern: /bò né|bo ne/i, cuisine: 'Vietnamese', specialty: 'Bò Né' },
    { pattern: /cháo|chao/i, cuisine: 'Vietnamese', specialty: 'Cháo' },
    { pattern: /lẩu|lau|hotpot/i, cuisine: 'Vietnamese', specialty: 'Lẩu' },
    { pattern: /nướng|nuong|bbq/i, cuisine: 'BBQ', specialty: 'Nướng' },
  ]

  const specialties = new Set<string>()

  for (const dish of dishes) {
    for (const { pattern, cuisine, specialty } of dishPatterns) {
      if (pattern.test(dish)) {
        cuisineStyles.add(cuisine)
        specialties.add(specialty)
      }
    }
  }

  // Default to Vietnamese if no specific cuisine found
  if (cuisineStyles.size === 0) {
    cuisineStyles.add('Vietnamese')
  }

  return {
    venueType,
    cuisineStyles: Array.from(cuisineStyles),
    specialties: Array.from(specialties),
  }
}

/**
 * Legacy function for backward compatibility
 * Extract cuisine types from Google Place types
 */
function extractCuisineTypes(types: string[], dishes: string[] = []): string[] {
  const classification = classifyVenue(types, dishes)
  return classification.cuisineStyles
}

/**
 * Batch process multiple videos
 */
export async function batchExtract(
  videos: Array<{ url: string; creatorName: string }>,
  options: ExtractionOptions = {}
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = []

  for (const video of videos) {
    try {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Processing: ${video.url}`)
      console.log(`${'='.repeat(60)}\n`)

      const result = await extractFromVideo(video.url, video.creatorName, options)
      results.push(result)

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`Failed to process ${video.url}:`, error)
    }
  }

  return results
}

/**
 * Use AI to generate a unified set of extraction data (JSON)
 * Combines Name, Description, and Reviews into a SINGLE request.
 */
async function generateUnifiedExtraction(
  metadata: { title?: string; description?: string },
  restaurants: RestaurantMention[],
  creatorName: string,
  targetCity: MarketCity
): Promise<{
  collection: {
    name_vi: string;
    name_en: string;
    description_vi: string;
    description_en: string;
  };
  reviews: Array<{
    restaurant_name: string;
    summary_vi: string;
    summary_en: string;
  }>;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const { GEMINI_CONFIG } = await import('./ai/config');
    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.modelName,
      generationConfig: GEMINI_CONFIG.generationConfig
    });

    const listings = restaurants.map(r =>
      `- Name: ${r.name}\n  Notes: "${(r.notes || '').substring(0, 300)}"`
    ).join('\n');

    const prompt = `
    You are an AI editor for a food discovery app. Process this video data and output a JSON object.

    Input Data:
    - Creator: "${creatorName}"
    - Market focus: Vietnam and Singapore
    - Target city: "${targetCity.name}, ${targetCity.country}"
    - Video Title: "${metadata.title || ''}"
    - Description: "${(metadata.description || '').substring(0, 1000)}"
    - Restaurants:
${listings}

    Tasks:
    1. Refine the Collection Name (VI & EN): Concise, no episode numbers/SEO fluff.
    2. Refine the Collection Description (VI & EN): Engaging, 2-3 sentences.
    3. Generate a 1-sentence Review Summary for each restaurant (VI & EN).

    Rules for Collection Name:
    - Remove episode numbers (e.g. #290), SEO keywords (e.g. "Must Try"), and excessive punctuation.
    - Format: "Food Topic inside Location with CreatorName" if natural.
    - SPECIAL: If Creator is generic (like "Authentik"), use the real host name if found in the title.

    Rules for Description:
    - Remove social links, affiliate links, "Subscribe" requests.
    - Focus on FOOD experience and LOCATION.
    - SPECIAL: Do NOT use generic creator names like "Authentik" as a person's name.

    Rules for Reviews:
    - CONCISE & KEYWORD-DRIVEN: Use short phrases or keywords, easy to scan.
    - STRICTLY NO NAMES: Never mention the restaurant name.
    - KEYWORDS ONLY: Use short, punchy phrases. Max 10 words.
    - FOCUS: Taste, Texture, Atmosphere.
    - Example: "Nước dùng thanh ngọt, thịt mềm tan." or "Crispy skin, juicy meat, lively vibe."
    - VI summary must be in VIETNAMESE.
    - BANNED WORDS: Do NOT use "hấp dẫn", "ngon", "tuyệt vời", "đậm đà" universally. Use specific sensory words (e.g. "giòn rụm", "thanh ngọt", "béo ngậy", "thơm nức").
    - VARIETY: Ensure each review uses DIFFERENT adjectives.
    - AUTHENTIC LOCAL ONLY: Keep authentic local cuisine for the target city. For Vietnam cities, keep Vietnamese dishes. For Singapore, keep local hawker/Singaporean dishes. Exclude unrelated imported cuisines.

    Output JSON Schema:
    {
      "collection": {
        "name_vi": "Refined Name VI",
        "name_en": "English Name",
        "description_vi": "Refined Description VI",
        "description_en": "English Description"
      },
      "reviews": [
        {
          "restaurant_name": "Exact Name Match",
          "summary_vi": "Vietnamese Review",
          "summary_en": "English Review"
        }
      ]
    }
    `;

    console.log("🚀 Sending Unified Gemini Request...");

    // Retry logic
    let result
    for (let i = 0; i < 5; i++) {
      try {
        result = await model.generateContent(prompt)
        break
      } catch (e: any) {
        if (e.message?.includes('429') || e.status === 429) {
          if (i === 4) throw e
          const waitTime = (i + 1) * 15000
          console.log(`⏳ AI Rate limit hit. Retrying in ${waitTime / 1000}s...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw e
        }
      }
    }

    if (!result) return null;
    const response = await result.response;
    const text = response.text();

    // Parse JSON
    try {
      const data = JSON.parse(text);
      console.log("✅ Unified Data Extracted Successfully");
      return data;
    } catch (e) {
      console.error("❌ Failed to parse JSON from AI response:", text);
      return null;
    }

  } catch (error) {
    console.error('❌ FATAL: Error in Unified Extraction:', error)
    return null;
  }
}

// Keeping individual functions as legacy/fallbacks if needed,
// strictly speaking they could be removed if we trust the unified one fully.
// For now, I'll update generateReviewSummary to be exported just in case manual fallback is triggered elsewhere.

/**
 * Legacy: Generate a concise 1-sentence review summary
 */
export async function generateReviewSummary(
  notes: string,
  creatorName: string,
  restaurantName: string
): Promise<string | null> {
  // ... (Existing implementation preserved for fallback)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `
    Summarize the creator's opinion of this restaurant into a SINGLE, punchy sentence in Vietnamese.

    Creator: "${creatorName}"
    Restaurant: "${restaurantName}"
    Notes/Context: "${notes.substring(0, 500)}"

    Rules:
    1. EXTRACT the opinion about the FOOD/ATMOSPHERE only.
    2. FORBIDDEN: Do not mention timestamps (e.g. "at 2:15"), do not say "check the video", do not mention "Authentik" or "Creator".
    3. BAD EXAMPLE: "Xem video lúc 2:15 để biết..." (DELETE THIS).
    4. GOOD EXAMPLE: "Bún chả cá ở đây nước dùng rất thanh và ngọt tự nhiên."
    5. If no specific opinion is found, describe the dish neutrally based on the notes.
    6. Keep it under 20 words.
    7. MUST be in VIETNAMESE.
    8. NO QUOTES in the output.
    `

    // Retry logic with backoff
    let result
    for (let i = 0; i < 5; i++) {
      try {
        result = await model.generateContent(prompt)
        break
      } catch (e: any) {
        if (e.message?.includes('429') || e.status === 429) {
          if (i === 4) throw e
          const waitTime = (i + 1) * 15000
          console.log(`⏳ AI Rate limit hit (Review). Retrying in ${waitTime / 1000}s...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw e
        }
      }
    }

    if (!result) return null
    const response = await result.response
    return response.text()?.trim().replace(/^["']|["']$/g, '') || null

  } catch (error) {
    console.error('❌ FATAL: Failed to generate review summary:', error)
    return null
  }
}

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
import { supabase } from './supabase'
import { processRestaurantPhotos, createSlug } from './photo-pipeline'

export interface ExtractionOptions {
  dry?: boolean  // Preview mode - don't import to database
}

export interface ExtractionResult {
  collection: {
    id: string
    name: string
    creator_name: string
    source_url: string
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
  let metadata: { title?: string; description?: string } | null = null
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

  // Refine collection name using AI (always enabled for text)
  let collectionName = metadata?.title || `Collection from ${creatorName}`

  if (metadata?.title) {
    try {
      const refinedName = await generateConciseCollectionName(metadata.title, creatorName)
      if (refinedName) {
        console.log(`✨ AI Refined Name: "${collectionName}" -> "${refinedName}"`)
        collectionName = refinedName
      }
    } catch (e) {
      console.warn('Failed to refine collection name with AI, using original.')
    }
  }

  // Refine collection description using AI (new request)
  let collectionDescription = metadata?.description || null

  if (metadata?.description && metadata.description.length > 100) {
    try {
      const refinedDesc = await generateConciseDescription(metadata.description, creatorName)
      if (refinedDesc) {
        console.log(`✨ AI Refined Description: length ${metadata.description.length} -> ${refinedDesc.length}`)
        collectionDescription = refinedDesc
      }
    } catch (e) {
      console.warn('Failed to refine description with AI, using original.')
    }
  }

  // In dry mode, create a mock collection
  let collection: { id: string; name: string }

  if (dry) {
    collection = {
      id: 'dry-run-preview',
      name: collectionName,
    }
    console.log(`📝 Would create collection: ${collection.name}`)
  } else {
    // Check if collection already exists by source_url
    const { data: existingCollection } = await supabase
      .from('collections')
      .select('*')
      .eq('source_url', url)
      .single()

    if (existingCollection) {
      console.log(`🔄 Found existing collection: ${existingCollection.name}`)
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('collections')
        .update({
          name: collectionName, // Update name if video title changed
          description: collectionDescription,
          creator_name: creatorName,
          // Don't update source_url as it matched
        })
        .eq('id', existingCollection.id)
        .select()
        .single()

      if (updateError || !updated) {
        throw new Error(`Failed to update collection: ${updateError?.message}`)
      }
      collection = updated
      console.log(`✅ Updated collection: ${collection.name}`)
    } else {
      // Create new collection
      const { data: dbCollection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          name: collectionName,
          description: collectionDescription,
          creator_name: creatorName,
          source_url: url,
        })
        .select()
        .single()

      if (collectionError || !dbCollection) {
        throw new Error(`Failed to create collection: ${collectionError?.message}`)
      }

      collection = dbCollection
      console.log(`📝 Created collection: ${collection.name}`)
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
      const verified = await verifyRestaurant(mention.name, mention.address)

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
        stats.imported++ // Count as "would be imported"
        results.push({ mention, verified, imported: false })
      } else {
        // Import to database
        const restaurantId = await importRestaurant(verified, mention)

        if (restaurantId) {
          // Link to collection (upsert/handle duplicates)
          await linkRestaurantToCollection(collection.id, restaurantId, mention, verified)

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

  return {
    collection: {
      id: collection.id,
      name: collection.name,
      creator_name: creatorName,
      source_url: url,
    },
    restaurants: results,
    stats,
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
  verified: PlaceDetails
): Promise<void> {
  // Try to insert
  const { error } = await supabase
    .from('collection_restaurants')
    .insert({
      collection_id: collectionId,
      restaurant_id: restaurantId,
      notes: mention.notes,
      recommended_dishes: mention.dishes || null
    })

  if (error) {
    if (error.code === '23505') { // Unique violation
      console.log(`   🔗 Already linked to collection (Updating notes)`)
      await supabase
        .from('collection_restaurants')
        .update({
          notes: mention.notes,
          recommended_dishes: mention.dishes || null
        })
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
 * Use AI to generate a concise, attractive collection name
 */
async function generateConciseCollectionName(
  originalTitle: string,
  creatorName: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) // Available per list-models output

    const prompt = `
    Refine this video title into a concise, attractive collection name for a food discovery app.

    Current Title: "${originalTitle}"
    Creator: "${creatorName}"

    Rules:
    1. Remove episode numbers (e.g., #290, Vol. 1, Part 2).
    2. Remove SEO keywords, clickbait phrases (e.g., "Must Try", "Shocking", "Too delicious").
    3. Remove excessive punctuation or separators (e.g., " | ", " - ").
    4. Focus on the core topic (Location + Food Type).
    5. You MAY format it as "Food Topic inside Location with CreatorName" if it sounds natural in the original language (e.g., "Ẩm thực đường phố Đà Nẵng cùng Yêu Máy Bay").
    6. Keep it in the ORIGINAL language (Vietnamese).
    7. Return ONLY the new name, no quotes or explanations.
    `

    // Simple retry logic with linear backoff
    let result
    for (let i = 0; i < 3; i++) {
      try {
        result = await model.generateContent(prompt)
        break
      } catch (e: any) {
        if (e.message?.includes('429') || e.status === 429) {
          if (i === 2) throw e // Rethrow on last attempt
          const waitTime = (i + 1) * 2000
          console.log(`⏳ AI Rate limit hit.Retrying in ${waitTime / 1000}s...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else {
          throw e
        }
      }
    }

    if (!result) return null; // Should not trigger if throw works correctly
    const response = await result.response
    const text = response.text()?.trim().replace(/^["']|["']$/g, '') // Remove quotes

    return text.length > 0 && text.length < originalTitle.length ? text : null
  } catch (error) {
    console.error('❌ FATAL: Error generating concise name:', error)
    throw error // Exit script on failure as requested
  }
}

/**
 * Use AI to generate a concise, attractive collection description
 * Removes social links, gear lists, and SEO fluff
 */
async function generateConciseDescription(
  originalDescription: string,
  creatorName: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
    Summarize this YouTube video description into a engaging, concise description for a food collection.

    Creator: "${creatorName}"
    Current Description:
    "${originalDescription.substring(0, 5000)}" // Truncate to avoid token limits

    Rules:
    1. Remove all social media links, "Subscribe" requests, affiliate links, and gear lists.
    2. Focus on the FOOD experience and the LOCATION. What is this collection about? (e.g., "A tour of the best Bánh Mì spots in Da Nang...").
    3. Keep it to 2-3 engaging sentences.
    4. Maintain the voice of the creator but make it cleaner.
    5. Keep it in the ORIGINAL language (Vietnamese).
    6. Return ONLY the new description.
    `

    // Simple retry logic
    let result
    for (let i = 0; i < 3; i++) {
      try {
        result = await model.generateContent(prompt)
        break
      } catch (e: any) {
        if (e.message?.includes('429') || e.status === 429) {
          if (i === 2) throw e
          const waitTime = (i + 1) * 2000
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
    console.error('❌ FATAL: Error generating concise description:', error)
    throw error // Exit script on failure as requested
  }
}

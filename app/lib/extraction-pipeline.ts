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

  const collectionName = metadata?.title || `Collection from ${creatorName}`

  // In dry mode, create a mock collection
  let collection: { id: string; name: string }

  if (dry) {
    collection = {
      id: 'dry-run-preview',
      name: collectionName,
    }
    console.log(`📝 Would create collection: ${collection.name}`)
  } else {
    // Create collection in database
    const { data: dbCollection, error: collectionError } = await supabase
      .from('collections')
      .insert({
        name: collectionName,
        description: metadata?.description || null,
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
          // Link to collection
          await linkRestaurantToCollection(collection.id, restaurantId, mention)

          // Download and enhance photos
          const collectionSlug = createSlug(collection.name)
          await processRestaurantPhotos(verified, collectionSlug, 3)

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
 * Import restaurant to database
 */
async function importRestaurant(
  placeDetails: PlaceDetails,
  _mention: RestaurantMention
): Promise<string | null> {
  try {
    // Check if restaurant already exists
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('google_place_id', placeDetails.place_id)
      .single()

    if (existing) {
      console.log(`   ℹ️  Restaurant already exists: ${placeDetails.name}`)
      return existing.id
    }

    // Classify restaurant
    const classification = classifyRestaurant(placeDetails)
    const authenticity = calculateAuthenticityWithSignals(placeDetails)

    // Extract cuisine types from Google types
    const cuisineTypes = extractCuisineTypes(placeDetails.types || [])

    // Create restaurant record
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
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
      })
      .select()
      .single()

    if (error || !restaurant) {
      console.error(`   ❌ Failed to import: ${error?.message}`)
      return null
    }

    console.log(`   ✅ Imported: ${restaurant.name}`)
    return restaurant.id
  } catch (error) {
    console.error('Error importing restaurant:', error)
    return null
  }
}

/**
 * Link restaurant to collection
 */
async function linkRestaurantToCollection(
  collectionId: string,
  restaurantId: string,
  mention: RestaurantMention
): Promise<void> {
  const { error } = await supabase
    .from('collection_restaurants')
    .insert({
      collection_id: collectionId,
      restaurant_id: restaurantId,
      notes: mention.notes || null,
      recommended_dishes: mention.dishes || null,
    })

  if (error) {
    console.error('Error linking restaurant to collection:', error)
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


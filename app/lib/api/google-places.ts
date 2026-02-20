/**
 * Google Places API Service (New v1)
 * Handles restaurant verification and data enrichment
 * Using Places API (New) - https://developers.google.com/maps/documentation/places/web-service
 */

import crypto from 'crypto'
import { detectMarketCityFromTextOrNull } from '../market-cities'
import { supabase } from '../supabase'

// Use getter function to read API key at runtime (not at module load time)
function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    console.warn('⚠️  GOOGLE_PLACES_API_KEY not set - Places API features will not work')
    return ''
  }
  return key
}

// Places API (New) v1 endpoints
const PLACES_API_NEW = 'https://places.googleapis.com/v1'
// Legacy API for photo URLs (still needed for photo_reference compatibility)
const PLACES_API_LEGACY = 'https://maps.googleapis.com/maps/api/place'

const GOOGLE_PLACES_CACHE_TTL_MS = (Number(process.env.GOOGLE_PLACES_CACHE_TTL_SECONDS || 7 * 24 * 60 * 60) || 7 * 24 * 60 * 60) * 1000
const inMemoryPlacesCache = new Map<string, { value: unknown; expiresAt: number }>()

type PlacesCacheKind = 'search' | 'details'

function normalizeCacheText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildLocationKey(location?: { lat: number; lng: number }): string | null {
  if (!location) return null
  // Round to reduce cardinality while preserving meaningful locality.
  return `${location.lat.toFixed(3)},${location.lng.toFixed(3)}`
}

function buildCacheKey(kind: PlacesCacheKind, rawKey: string): string {
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex')
  return `${kind}:${hash}`
}

function readFromMemoryCache<T>(cacheKey: string): T | null {
  const entry = inMemoryPlacesCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    inMemoryPlacesCache.delete(cacheKey)
    return null
  }
  return entry.value as T
}

function writeToMemoryCache(cacheKey: string, value: unknown): void {
  inMemoryPlacesCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + GOOGLE_PLACES_CACHE_TTL_MS,
  })

  if (inMemoryPlacesCache.size > 500) {
    const oldestKey = inMemoryPlacesCache.keys().next().value as string | undefined
    if (oldestKey) inMemoryPlacesCache.delete(oldestKey)
  }
}

function isMissingCacheTableError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase()
  return (
    message.includes('google_places_cache') &&
    (message.includes('does not exist') || message.includes('relation') || message.includes('schema cache'))
  )
}

async function readFromPersistentCache<T>(cacheKey: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('google_places_cache')
      .select('response, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (error) {
      if (!isMissingCacheTableError(error)) {
        console.warn('⚠️ Failed reading Google Places persistent cache:', (error as any)?.message || error)
      }
      return null
    }

    if (!data) {
      return null
    }

    const expiresAt = new Date(data.expires_at).getTime()
    if (Number.isNaN(expiresAt) || Date.now() >= expiresAt) {
      return null
    }

    return data.response as T
  } catch (error) {
    if (!isMissingCacheTableError(error)) {
      console.warn('⚠️ Failed reading Google Places persistent cache:', (error as any)?.message || error)
    }
    return null
  }
}

async function writeToPersistentCache(params: {
  cacheKey: string
  cacheKind: PlacesCacheKind
  response: unknown
  placeId?: string | null
  queryText?: string | null
  locationKey?: string | null
}): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + GOOGLE_PLACES_CACHE_TTL_MS).toISOString()

    await supabase
      .from('google_places_cache')
      .upsert({
        cache_key: params.cacheKey,
        cache_kind: params.cacheKind,
        place_id: params.placeId || null,
        query_text: params.queryText || null,
        location_key: params.locationKey || null,
        response: params.response,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cache_key' })
  } catch (error) {
    if (!isMissingCacheTableError(error)) {
      console.warn('⚠️ Failed writing Google Places persistent cache:', (error as any)?.message || error)
    }
  }
}

/**
 * Common headers for Places API (New)
 */
function getApiHeaders(fieldMask: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': getApiKey(),
    'X-Goog-FieldMask': fieldMask,
  }
}

// Keep legacy interfaces for internal compatibility
export interface PlaceSearchResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

export interface PlaceDetails extends PlaceSearchResult {
  formatted_phone_number?: string
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  website?: string
  reviews?: Array<{
    author_name: string
    author_uri?: string  // New: author profile URL
    rating: number
    text: string
    time: number
    language: string
  }>
}

/**
 * Convert new API response to legacy format for compatibility
 */
function convertPlaceToLegacy(place: any): PlaceSearchResult {
  return {
    place_id: place.id,
    name: place.displayName?.text || '',
    formatted_address: place.formattedAddress || '',
    geometry: {
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
    },
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    price_level: convertPriceLevel(place.priceLevel),
    types: place.types || [],
    photos: place.photos?.map((p: any) => ({
      photo_reference: p.name, // New API uses 'name' as reference
      height: p.heightPx || 0,
      width: p.widthPx || 0,
    })),
  }
}

/**
 * Convert new API place details to legacy format
 */
function convertDetailsToLegacy(place: any): PlaceDetails {
  const base = convertPlaceToLegacy(place)
  return {
    ...base,
    formatted_phone_number: place.nationalPhoneNumber,
    opening_hours: place.regularOpeningHours ? {
      open_now: place.currentOpeningHours?.openNow,
      weekday_text: place.regularOpeningHours?.weekdayDescriptions,
    } : undefined,
    website: place.websiteUri,
    reviews: place.reviews?.map((r: any) => ({
      author_name: r.authorAttribution?.displayName || 'Anonymous',
      author_uri: r.authorAttribution?.uri,  // Store author URI for tracking
      rating: r.rating || 0,
      text: r.text?.text || r.originalText?.text || '',
      time: r.publishTime ? new Date(r.publishTime).getTime() / 1000 : 0,
      language: r.text?.languageCode || r.originalText?.languageCode || 'en',
    })),
  }
}

/**
 * Convert new price level enum to numeric
 */
function convertPriceLevel(priceLevel?: string): number | undefined {
  const map: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  }
  return priceLevel ? map[priceLevel] : undefined
}

/**
 * Search for a place by name and location (Places API New)
 */
export async function searchPlace(
  query: string,
  location?: { lat: number; lng: number }
): Promise<PlaceSearchResult[]> {
  const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos'
  const normalizedQuery = normalizeCacheText(query)
  const locationKey = buildLocationKey(location)
  const cacheKey = buildCacheKey('search', `q:${normalizedQuery}|loc:${locationKey || 'none'}`)

  const inMemoryHit = readFromMemoryCache<PlaceSearchResult[]>(cacheKey)
  if (inMemoryHit) return inMemoryHit

  const persistentHit = await readFromPersistentCache<PlaceSearchResult[]>(cacheKey)
  if (persistentHit) {
    writeToMemoryCache(cacheKey, persistentHit)
    return persistentHit
  }

  const body: any = { textQuery: query }

  if (location) {
    body.locationBias = {
      circle: {
        center: { latitude: location.lat, longitude: location.lng },
        radius: 5000.0,
      },
    }
  }

  const response = await fetch(`${PLACES_API_NEW}/places:searchText`, {
    method: 'POST',
    headers: getApiHeaders(fieldMask),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Places API error: ${response.status} - ${error}`)
  }

  const data = await response.json()

  // Convert to legacy format for compatibility
  const converted = (data.places || []).map(convertPlaceToLegacy)
  writeToMemoryCache(cacheKey, converted)
  await writeToPersistentCache({
    cacheKey,
    cacheKind: 'search',
    response: converted,
    queryText: normalizedQuery,
    locationKey,
  })
  return converted
}

/**
 * Get detailed information about a place (Places API New)
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const fieldMask = 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,types,photos,nationalPhoneNumber,regularOpeningHours,currentOpeningHours,websiteUri,reviews'

  // Ensure place ID is clean (strip any prefix if accidentally included)
  const cleanPlaceId = placeId.startsWith('places/') ? placeId.substring(7) : placeId
  const cacheKey = buildCacheKey('details', cleanPlaceId)

  const inMemoryHit = readFromMemoryCache<PlaceDetails>(cacheKey)
  if (inMemoryHit) return inMemoryHit

  const persistentHit = await readFromPersistentCache<PlaceDetails>(cacheKey)
  if (persistentHit) {
    writeToMemoryCache(cacheKey, persistentHit)
    return persistentHit
  }

  const url = `${PLACES_API_NEW}/places/${cleanPlaceId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getApiHeaders(fieldMask),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Google Places API error: ${response.status}`)
    console.error(`  Place ID: ${cleanPlaceId}`)
    console.error(`  URL: ${url}`)
    console.error(`  Response: ${errorText}`)
    return null
  }

  const data = await response.json()

  // Convert to legacy format for compatibility
  const converted = convertDetailsToLegacy(data)
  writeToMemoryCache(cacheKey, converted)
  await writeToPersistentCache({
    cacheKey,
    cacheKind: 'details',
    response: converted,
    placeId: cleanPlaceId,
  })
  return converted
}

/**
 * Get photo URL from photo reference
 * Note: New API uses different photo format - need to use the photos endpoint
 */
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 800
): string {
  // New API photo references look like: places/PLACE_ID/photos/PHOTO_REFERENCE
  if (photoReference.startsWith('places/')) {
    return `${PLACES_API_NEW}/${photoReference}/media?maxWidthPx=${maxWidth}&key=${getApiKey()}`
  }

  // Legacy photo reference - use legacy endpoint
  const params = new URLSearchParams({
    photo_reference: photoReference,
    maxwidth: maxWidth.toString(),
    key: getApiKey(),
  })

  return `${PLACES_API_LEGACY}/photo?${params.toString()}`
}

/**
 * Check if a place matches valid food venue types
 */
function isValidFoodVenue(place: PlaceSearchResult): boolean {
  if (!place.types || place.types.length === 0) return false

  // Explicitly excluded types (locations, services, etc.)
  const EXCLUDED_TYPES = [
    'locality', 'political', 'sublocality', 'administrative_area_level_1',
    'administrative_area_level_2', 'country', 'continent',
    'airport', 'park', 'school', 'university', 'gym', 'health',
    'finance', 'place_of_worship', 'church', 'hindu_temple', 'mosque', 'synagogue',
    'cemetery', 'rv_park', 'campground', 'bus_station', 'train_station'
  ]

  // If it's a generic location/geo-political entity, reject it
  if (place.types.some(t => EXCLUDED_TYPES.includes(t))) {
    // Determine if it's mixed use (e.g. hotel + restaurant)?
    // Usually a Hotel is 'lodging', but if it has 'restaurant', it's valid.
    // But 'locality' (City) is NEVER valid.
    if (place.types.some(t => ['locality', 'political', 'country', 'administrative_area_level_1'].includes(t))) {
      return false
    }
  }

  // Must have at least one of these specific food types
  // Note: 'food' is too generic (could be grocery), so we avoid it unless combined with others?
  const REQUIRED_TYPES = [
    'restaurant', 'cafe', 'bakery', 'bar', 'meal_takeaway', 'meal_delivery',
    'ice_cream_shop', 'night_club', 'coffee_shop', 'sandwich_shop', 'steak_house'
  ]

  // Check if any of the place types indicate it's a food establishment
  // Google Places types are specific (e.g., 'vietnamese_restaurant'), so we check valid substrings too
  return place.types.some(t =>
    REQUIRED_TYPES.includes(t) ||
    t.includes('restaurant') ||
    t === 'food_court' // Specific enough
  )
}

/**
 * Verify and enrich restaurant data with Google Places
 */
export async function verifyRestaurant(
  name: string,
  address?: string,
  options: {
    locationBias?: { lat: number; lng: number }
    cityName?: string
  } = {}
): Promise<PlaceDetails | null> {
  try {
    // Search for the restaurant
    const inferredCityFromAddress = address ? detectMarketCityFromTextOrNull(address) : null
    const searchLocation = options.locationBias ||
      (inferredCityFromAddress ? { lat: inferredCityFromAddress.latitude, lng: inferredCityFromAddress.longitude } : undefined)
    const query = address
      ? `${name} ${address}`
      : options.cityName
        ? `${name} ${options.cityName}`
        : name
    const results = await searchPlace(query, searchLocation)

    if (results.length === 0) {
      console.log(`No results found for: ${query}`)
      return null
    }

    // Find the first result that is actually a food venue
    const validPlace = results.find(isValidFoodVenue)

    if (!validPlace) {
      console.log(`❌ Found results for "${name}" but none were valid food venues (Top: ${results[0].name} - [${results[0].types?.join(', ')}])`)
      return null
    }

    // Get detailed information for the valid place
    const details = await getPlaceDetails(validPlace.place_id)

    return details
  } catch (error) {
    console.error('Error verifying restaurant:', error)
    return null
  }
}

/**
 * Determine if a restaurant is a local favorite or tourist spot
 * Based on review analysis and location
 */
export function classifyRestaurant(details: PlaceDetails): 'LOCAL_FAVORITE' | 'TOURIST_SPOT' | null {
  if (!details.reviews || details.reviews.length === 0) {
    return null
  }

  // Simple heuristic: check language of reviews
  const vietnameseReviews = details.reviews.filter(
    r => r.language === 'vi' || r.language === 'vi-VN'
  ).length

  const totalReviews = details.reviews.length
  const vietnameseRatio = vietnameseReviews / totalReviews

  // If more than 40% of reviews are in Vietnamese, likely a local favorite
  if (vietnameseRatio > 0.4) {
    return 'LOCAL_FAVORITE'
  }

  // If less than 20% are in Vietnamese, likely a tourist spot
  if (vietnameseRatio < 0.2) {
    return 'TOURIST_SPOT'
  }

  // Otherwise, unclear
  return null
}

/**
 * Authenticity signal - explains why a place got its badge
 */
export interface AuthenticitySignal {
  name: string
  value: 'positive' | 'neutral' | 'negative'
  description: string
  icon: string
}

/**
 * User-friendly authenticity result with badge and signals
 */
export interface AuthenticityResult {
  badge: 'LOCAL_GEM' | 'NEIGHBORHOOD_SPOT' | 'MIXED_CROWD' | 'TOURIST_FAVORITE' | 'TOURIST_TRAP'
  badgeLabel: string
  badgeIcon: string
  level: 1 | 2 | 3 | 4 | 5  // 5 = most authentic
  score: number  // Raw 0-1 score for sorting
  signals: AuthenticitySignal[]
  summary: string  // Human-readable one-liner
  reviewWarning: {
    hasWarning: boolean
    message: string | null
    suspiciousCount: number
    totalCount: number
  }
}

/**
 * Calculate authenticity with user-friendly badges and signal breakdown
 * Returns a structured result that's easy to display to users
 */
export function calculateAuthenticityWithSignals(details: PlaceDetails): AuthenticityResult {
  const signals: AuthenticitySignal[] = []
  let score = 0.5 // Start at neutral

  if (!details.reviews || details.reviews.length === 0) {
    return createResult(score, signals, 'No reviews available yet')
  }

  // Filter out suspicious reviews
  const credibleReviews = filterSuspiciousReviews(details.reviews)
  const suspiciousCount = details.reviews.length - credibleReviews.length
  const suspiciousRatio = suspiciousCount / details.reviews.length

  // Signal: Review quality
  if (suspiciousRatio > 0.5) {
    signals.push({
      name: 'signal.reviewQuality',
      value: 'negative',
      description: 'Many suspicious reviews detected',
      icon: '⚠️'
    })
    score -= 0.15
  } else if (suspiciousRatio < 0.2 && credibleReviews.length >= 3) {
    signals.push({
      name: 'signal.reviewQuality',
      value: 'positive',
      description: 'Genuine, detailed reviews',
      icon: '✅'
    })
  }

  if (credibleReviews.length === 0) {
    return createResult(0.3, signals, 'Limited reliable reviews')
  }

  // Signal: Local reviews (Vietnamese language)
  const vietnameseReviews = credibleReviews.filter(
    r => r.language === 'vi' || r.language === 'vi-VN'
  ).length
  const vietnameseRatio = vietnameseReviews / credibleReviews.length
  score += vietnameseRatio * 0.4

  if (vietnameseRatio > 0.6) {
    signals.push({
      name: 'signal.localReviews',
      value: 'positive',
      description: `Loved by Vietnamese reviewers (${Math.round(vietnameseRatio * 100)}% local)`,
      icon: '🇻🇳'
    })
  } else if (vietnameseRatio < 0.2) {
    signals.push({
      name: 'signal.localReviews',
      value: 'negative',
      description: 'Mostly foreign reviews',
      icon: '🌍'
    })
  } else {
    signals.push({
      name: 'signal.localReviews',
      value: 'neutral',
      description: 'Mixed local and tourist reviews',
      icon: '🤝'
    })
  }

  // Signal: Price level
  if (details.price_level) {
    const priceScore = (5 - details.price_level) / 4
    score += priceScore * 0.2

    if (details.price_level <= 1) {
      signals.push({
        name: 'signal.price',
        value: 'positive',
        description: 'Street food prices',
        icon: '💰'
      })
    } else if (details.price_level >= 3) {
      signals.push({
        name: 'signal.price',
        value: 'negative',
        description: 'Tourist pricing',
        icon: '💸'
      })
    }
  }

  // Signal: Venue type and location
  if (details.types) {
    const localTypes = ['restaurant', 'food', 'meal_delivery', 'meal_takeaway']
    const touristTypes = ['tourist_attraction', 'point_of_interest']

    const hasLocalTypes = details.types.some(t => localTypes.includes(t))
    const hasTouristTypes = details.types.some(t => touristTypes.includes(t))

    if (hasLocalTypes && !hasTouristTypes) {
      score += 0.2
      signals.push({
        name: 'signal.location',
        value: 'positive',
        description: 'Local neighborhood spot',
        icon: '🏘️'
      })
    } else if (hasTouristTypes) {
      score -= 0.1
      signals.push({
        name: 'signal.location',
        value: 'negative',
        description: 'In tourist area',
        icon: '📸'
      })
    }
  }

  // Signal: Rating and consistency
  if (details.rating && details.user_ratings_total) {
    const ratingScore = (details.rating / 5) * Math.min(details.user_ratings_total / 100, 1)
    score += ratingScore * 0.2

    if (details.rating >= 4.2 && details.user_ratings_total >= 50) {
      signals.push({
        name: 'signal.reputation',
        value: 'positive',
        description: `Consistently rated ${details.rating}★ (${details.user_ratings_total} reviews)`,
        icon: '⭐'
      })
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(1, score))

  // Generate summary
  const summary = generateSummary(score, signals)

  // Build review warning
  const reviewWarning: AuthenticityResult['reviewWarning'] = {
    hasWarning: suspiciousRatio > 0.4 || suspiciousCount >= 3,
    message: suspiciousRatio > 0.6
      ? 'Many reviews appear suspicious - proceed with caution'
      : suspiciousRatio > 0.4
        ? 'Some reviews may not be genuine'
        : null,
    suspiciousCount,
    totalCount: details.reviews?.length || 0,
  }

  return createResult(score, signals, summary, reviewWarning)
}

/**
 * Map score to badge and create result
 */
function createResult(
  score: number,
  signals: AuthenticitySignal[],
  summary: string,
  reviewWarning: AuthenticityResult['reviewWarning'] = { hasWarning: false, message: null, suspiciousCount: 0, totalCount: 0 }
): AuthenticityResult {
  let badge: AuthenticityResult['badge']
  let badgeLabel: string
  let badgeIcon: string
  let level: AuthenticityResult['level']

  if (score >= 0.8) {
    badge = 'LOCAL_GEM'
    badgeLabel = 'badge.localGem'
    badgeIcon = '🏆'
    level = 5
  } else if (score >= 0.65) {
    badge = 'NEIGHBORHOOD_SPOT'
    badgeLabel = 'badge.neighborhoodSpot'
    badgeIcon = '🏠'
    level = 4
  } else if (score >= 0.45) {
    badge = 'MIXED_CROWD'
    badgeLabel = 'badge.mixedCrowd'
    badgeIcon = '🤝'
    level = 3
  } else if (score >= 0.25) {
    badge = 'TOURIST_FAVORITE'
    badgeLabel = 'badge.touristFavorite'
    badgeIcon = '📸'
    level = 2
  } else {
    badge = 'TOURIST_TRAP'
    badgeLabel = 'badge.touristTrap'
    badgeIcon = '⚠️'
    level = 1
  }

  return { badge, badgeLabel, badgeIcon, level, score, signals, summary, reviewWarning }
}

/**
 * Generate human-readable summary based on signals
 */
function generateSummary(score: number, signals: AuthenticitySignal[]): string {
  const positives = signals.filter(s => s.value === 'positive')
  const negatives = signals.filter(s => s.value === 'negative')

  if (score >= 0.8) {
    return 'A true local favorite - where Da Nang residents eat'
  } else if (score >= 0.65) {
    return 'Popular with locals, may see some tourists'
  } else if (score >= 0.45) {
    return 'Mix of local and tourist crowds'
  } else if (negatives.length > positives.length) {
    return 'Primarily caters to tourists'
  } else {
    return 'Tourist-oriented venue'
  }
}

/**
 * Legacy function for backward compatibility
 * Calculate authenticity score (0-1)
 */
export function calculateAuthenticityScore(details: PlaceDetails): number {
  return calculateAuthenticityWithSignals(details).score
}

/**
 * Extended review interface with credibility info
 */
export interface ReviewWithCredibility {
  author_name: string
  rating: number
  text: string
  time: number
  language: string
  isCredible: boolean
  suspiciousFlags: string[]
}

/**
 * Analysis of review quality for a place
 */
export interface ReviewQualityAnalysis {
  totalReviews: number
  credibleReviews: number
  suspiciousReviews: number
  suspiciousRatio: number
  hasReviewWarning: boolean
  warningMessage: string | null
  flagBreakdown: Record<string, number>  // Count of each flag type
}

/**
 * Analyze review quality and filter suspicious reviews
 * Based on research patterns for fake review detection
 */
export function analyzeReviewQuality(
  reviews: PlaceDetails['reviews']
): ReviewQualityAnalysis {
  if (!reviews || reviews.length === 0) {
    return {
      totalReviews: 0,
      credibleReviews: 0,
      suspiciousReviews: 0,
      suspiciousRatio: 0,
      hasReviewWarning: false,
      warningMessage: null,
      flagBreakdown: {},
    }
  }

  const flagBreakdown: Record<string, number> = {}
  let suspiciousCount = 0

  for (const review of reviews) {
    const flags = detectSuspiciousPatterns(review)
    if (flags.length > 0) {
      suspiciousCount++
      for (const flag of flags) {
        flagBreakdown[flag] = (flagBreakdown[flag] || 0) + 1
      }
    }
  }

  const suspiciousRatio = suspiciousCount / reviews.length
  const hasReviewWarning = suspiciousRatio > 0.4 || suspiciousCount >= 3

  let warningMessage: string | null = null
  if (suspiciousRatio > 0.6) {
    warningMessage = 'Many reviews appear suspicious - proceed with caution'
  } else if (suspiciousRatio > 0.4) {
    warningMessage = 'Some reviews may not be genuine'
  }

  return {
    totalReviews: reviews.length,
    credibleReviews: reviews.length - suspiciousCount,
    suspiciousReviews: suspiciousCount,
    suspiciousRatio,
    hasReviewWarning,
    warningMessage,
    flagBreakdown,
  }
}

/**
 * Detect suspicious patterns in a single review
 * Based on research: generic text, extreme ratings, superlatives, etc.
 */
function detectSuspiciousPatterns(review: NonNullable<PlaceDetails['reviews']>[0]): string[] {
  const flags: string[] = []
  const text = review.text || ''
  const lowerText = text.toLowerCase()

  // 1. Very short/empty reviews (< 20 chars)
  if (text.length < 20) {
    flags.push('too_short')
  }

  // 2. Generic phrases common in fake reviews
  const genericPhrases = [
    'good food', 'nice place', 'recommended', 'must try', 'great service',
    'amazing food', 'delicious', 'yummy', 'best ever', 'highly recommend',
    'tuyệt vời', 'rất ngon', 'ngon lắm', 'quán đẹp', 'phục vụ tốt',
    '👍', '⭐', '🔥', '💯', '❤️'
  ]

  // Flag if entire review is just a generic phrase or emoji
  if (text.length < 40 && genericPhrases.some(phrase =>
    lowerText === phrase || lowerText.trim() === phrase
  )) {
    flags.push('generic_only')
  }

  // 3. Emoji-only reviews
  const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u
  if (emojiPattern.test(text.trim())) {
    flags.push('emoji_only')
  }

  // 4. Excessive superlatives (overenthusiastic fake reviews)
  const superlatives = ['best', 'amazing', 'incredible', 'perfect', 'excellent', 'fantastic', 'wonderful', 'tuyệt vời', 'hoàn hảo']
  const superlativeCount = superlatives.filter(s => lowerText.includes(s)).length
  if (superlativeCount >= 3 && text.length < 100) {
    flags.push('excessive_superlatives')
  }

  // 5. Extreme rating (5★ or 1★) with minimal justification
  if ((review.rating === 5 || review.rating === 1) && text.length < 50) {
    flags.push('extreme_rating_no_detail')
  }

  // 6. Repetitive text patterns (copy-paste indicators)
  const words = lowerText.split(/\s+/)
  const uniqueWords = new Set(words)
  if (words.length > 5 && uniqueWords.size < words.length * 0.5) {
    flags.push('repetitive_text')
  }

  // 7. No specific details about food/experience
  const specificIndicators = [
    'dish', 'ordered', 'tried', 'ate', 'drink', 'menu', 'taste', 'flavor',
    'món', 'ăn', 'uống', 'thử', 'gọi', 'vị', 'ngon'
  ]
  if (text.length > 30 && !specificIndicators.some(ind => lowerText.includes(ind))) {
    flags.push('lacks_specifics')
  }

  return flags
}

/**
 * Filter out suspicious reviews - returns only credible ones
 */
export function filterSuspiciousReviews(
  reviews: PlaceDetails['reviews']
): NonNullable<PlaceDetails['reviews']> {
  if (!reviews) return []

  return reviews.filter(review => {
    const flags = detectSuspiciousPatterns(review)
    return flags.length === 0
  })
}

/**
 * Photo with metadata for selection
 */
export interface EnhancedPhoto {
  url: string
  photoReference: string
  width: number
  height: number
  category: 'food' | 'interior' | 'exterior' | 'unknown'
  score: number
}

/**
 * Select best photos from Google Places
 * Prioritizes food photos (typically smaller/portrait) over exterior/interior shots
 */
/**
 * Calculate a score for a photo based on heuristics
 * Higher score = more likely to be a food photo
 */
export function calculatePhotoScore(photo: { width: number; height: number }): { score: number; category: EnhancedPhoto['category'] } {
  let score = 50 // Base score
  let category: EnhancedPhoto['category'] = 'unknown'

  const aspectRatio = photo.width / photo.height

  // Heuristics for Food vs Place (Relaxed per user feedback)
  // - Phone photos can be any aspect ratio (Portrait, Square, 4:3, 16:9)
  // - We only want to filter out obvious non-food like panoramas or tiny icons

  if (aspectRatio <= 1.0) {
    // Portrait or Square (e.g. 3:4, 9:16, 1:1)
    // Slight boost as these are very common for food/Instagram
    score += 20
    category = 'food'
  } else if (aspectRatio > 1.0 && aspectRatio <= 1.8) {
    // Standard Landscape (4:3, 3:2, 16:9)
    // Neutral score - could be food or environment
    score += 5
    category = 'unknown'
  } else if (aspectRatio > 1.8) {
    // Wide Panorama (> 16:9) - Likely environment/street view
    score -= 40
    category = 'exterior'
  }

  // Size heuristics
  // Penalize only extreme sizes
  if (photo.width > 5000) {
    // Very high res professional/panorama
    score -= 20
  }

  if (photo.width < 500) {
    // Too small/low quality
    score -= 20
  }

  return { score, category }
}

/**
 * Select best photos from Google Places
 * Prioritizes food photos (typically smaller/portrait) over exterior/interior shots
 */
export function selectBestPhotos(
  place: PlaceDetails,
  maxPhotos: number = 5
): EnhancedPhoto[] {
  if (!place.photos || place.photos.length === 0) {
    return []
  }

  const scoredPhotos: EnhancedPhoto[] = place.photos.map(photo => {
    const { score, category } = calculatePhotoScore(photo)

    return {
      url: getPhotoUrl(photo.photo_reference, 800),
      photoReference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      category,
      score,
    }
  })

  // Sort by score (highest first) and return top N
  return scoredPhotos
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPhotos)
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase client for database operations
 * Used for querying restaurants, collections, and reviews
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Database types
 */
export type Restaurant = {
  id: string
  google_place_id: string | null
  name: string
  address: string | null
  location: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  } | null
  cuisine_type: string[] | null
  price_level: number | null
  authenticity_score: number | null
  classification: 'LOCAL_FAVORITE' | 'TOURIST_SPOT' | null
  // New fields for comparison/display
  phone_number: string | null
  website: string | null
  opening_hours: any | null // JSON
  google_rating: number | null
  google_user_ratings_total: number | null
  images: string[] | null // JSON array of web paths
  authenticity_details: any | null // JSON full analysis
  created_at: string
}

export type Collection = {
  id: string
  name: string
  description: string | null
  creator_id: string | null
  creator_name: string | null
  source_url: string | null
  source_channel_id: string | null
  source_channel_url: string | null
  source_channel_name: string | null
  tags: string[] | null
  created_at: string
}

export type CollectionRestaurant = {
  collection_id: string
  restaurant_id: string
  notes: string | null
  recommended_dishes: string[] | null
}

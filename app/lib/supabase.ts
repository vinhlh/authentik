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
  created_at: string
}

export type Collection = {
  id: string
  name: string
  description: string | null
  creator_id: string | null
  creator_name: string | null
  source_url: string | null
  created_at: string
}

export type CollectionRestaurant = {
  collection_id: string
  restaurant_id: string
  notes: string | null
  recommended_dishes: string[] | null
}

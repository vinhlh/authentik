import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600 // Refresh sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://authentik.app'

  // Fetch Collections
  const { data: collections } = await supabase
    .from('collections')
    .select('id, updated_at')

  const collectionUrls = (collections || []).map((collection) => ({
    url: `${baseUrl}/collections/${collection.id}`,
    lastModified: new Date(collection.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch Restaurants
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, updated_at')

  const restaurantUrls = (restaurants || []).map((restaurant) => ({
    url: `${baseUrl}/restaurants/${restaurant.id}`,
    lastModified: new Date(restaurant.updated_at || Date.now()),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...collectionUrls,
    ...restaurantUrls,
  ]
}

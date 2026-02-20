import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { getUrlKey } from '@/lib/url-keys'
import { getChannelSlug } from '@/lib/channel-slug'

export const revalidate = 3600 // Refresh sitemap every hour

type CollectionSitemapRow = {
  id: string
  url_key?: string | null
  created_at?: string | null
  source_channel_id?: string | null
  source_channel_name?: string | null
}

type RestaurantSitemapRow = {
  id: string
  url_key?: string | null
  created_at?: string | null
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  return new URL(path, `${baseUrl}/`).toString()
}

function toLastModified(value?: string | null): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://authentik.app').replace(/\/+$/, '')

  const [collectionsResult, restaurantsResult] = await Promise.all([
    supabase
      .from('collections')
      .select('id, url_key, created_at, source_channel_id, source_channel_name')
      .eq('is_visible', true),
    supabase
      .from('restaurants')
      .select('id, url_key, created_at'),
  ])

  if (collectionsResult.error) {
    console.error('[sitemap] Failed to load collections:', collectionsResult.error.message)
  }
  if (restaurantsResult.error) {
    console.error('[sitemap] Failed to load restaurants:', restaurantsResult.error.message)
  }

  const collections = (collectionsResult.data || []) as CollectionSitemapRow[]
  const restaurants = (restaurantsResult.data || []) as RestaurantSitemapRow[]

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl(baseUrl, '/'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: toAbsoluteUrl(baseUrl, '/collections'),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const collectionUrls = collections.map((collection) => ({
    url: toAbsoluteUrl(baseUrl, `/collections/${getUrlKey(collection)}`),
    lastModified: toLastModified(collection.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const restaurantUrls = restaurants.map((restaurant) => ({
    url: toAbsoluteUrl(baseUrl, `/restaurants/${getUrlKey(restaurant)}`),
    lastModified: toLastModified(restaurant.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Channel pages are generated from source channel metadata in visible collections.
  const channelMap = new Map<string, Date>()
  for (const collection of collections) {
    const channelSlug = getChannelSlug(
      collection.source_channel_name,
      collection.source_channel_id
    )
    if (!channelSlug) continue

    const channelUrl = toAbsoluteUrl(baseUrl, `/channels/${encodeURIComponent(channelSlug)}`)
    const lastModified = toLastModified(collection.created_at)
    const previous = channelMap.get(channelUrl)

    if (!previous || lastModified > previous) {
      channelMap.set(channelUrl, lastModified)
    }
  }

  const channelUrls: MetadataRoute.Sitemap = Array.from(channelMap.entries()).map(([url, lastModified]) => ({
    url,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    ...staticUrls,
    ...collectionUrls,
    ...channelUrls,
    ...restaurantUrls,
  ]
}

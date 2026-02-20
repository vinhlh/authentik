import { supabase } from '@/lib/supabase'
import { CollectionsGrid } from '@/components/collections-grid'
import { Suspense } from 'react'
import { getCollectionCityTags, getMarketCityById } from '@/lib/market-cities'

export const revalidate = 60 // Revalidate every minute

type PageSearchParams = {
  city?: string | string[]
}

async function resolveSearchParams(
  searchParams?: PageSearchParams | Promise<PageSearchParams>
): Promise<PageSearchParams> {
  if (!searchParams) return {}
  if (typeof (searchParams as Promise<PageSearchParams>).then === 'function') {
    return await (searchParams as Promise<PageSearchParams>)
  }
  return searchParams as PageSearchParams
}

function getFirstValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams?: PageSearchParams | Promise<PageSearchParams>
}) {
  const resolvedSearchParams = await resolveSearchParams(searchParams)
  const selectedCity = getMarketCityById(getFirstValue(resolvedSearchParams.city))
  const cityTags = getCollectionCityTags(selectedCity)

  let collectionsQuery = supabase
    .from('collections')
    .select('*, collection_restaurants(count), tags')
    .eq('is_visible', true)
    .order('display_rank', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (cityTags.length > 0) {
    collectionsQuery = collectionsQuery.overlaps('tags', cityTags)
  }

  const { data: collections, error } = await collectionsQuery

  if (error) {
    console.error('Error fetching collections:', error)
    return <div>Error loading collections</div>
  }



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Curated Collections</h1>
        <p className="text-lg text-muted-foreground">
          Discover restaurant lists from trusted local food reviewers
        </p>
      </div>

      <Suspense fallback={<div>Loading collections...</div>}>
        <CollectionsGrid initialCollections={collections} />
      </Suspense>
    </div>
  )
}

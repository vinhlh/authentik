import { supabase } from '@/lib/supabase'
import { CollectionsGrid } from '@/components/collections-grid'
import { Suspense } from 'react'

export const revalidate = 60 // Revalidate every minute

export default async function CollectionsPage() {
  const { data: collections, error } = await supabase
    .from('collections')
    .select('*, collection_restaurants(count), tags')
    .order('created_at', { ascending: false })

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

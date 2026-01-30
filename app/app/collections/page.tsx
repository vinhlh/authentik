import { CollectionCard } from '@/components/collection-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { Collection } from '@/lib/supabase'

// Mock data
const MOCK_COLLECTIONS: Collection[] = [
  {
    id: '1',
    name: 'Best Street Food in Da Nang',
    description: 'My favorite local street food spots that tourists rarely find. From bánh mì to bún chả cá.',
    creator_name: 'Vinh Le',
    source_url: 'https://youtube.com/watch?v=example1',
    creator_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Authentic Seafood Restaurants',
    description: 'Fresh seafood where locals go, not the tourist traps on the beach.',
    creator_name: 'Food Explorer',
    source_url: 'https://youtube.com/watch?v=example2',
    creator_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Hidden Gems in Hải Châu',
    description: 'Small family-run restaurants in the heart of Da Nang that serve incredible food.',
    creator_name: 'Da Nang Foodie',
    source_url: null,
    creator_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Best Mì Quảng in Town',
    description: 'The ultimate guide to finding the best mì quảng in Da Nang.',
    creator_name: 'Noodle Hunter',
    source_url: null,
    creator_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Vegetarian & Vegan Spots',
    description: 'Delicious plant-based Vietnamese food that even meat-lovers will enjoy.',
    creator_name: 'Green Eats VN',
    source_url: null,
    creator_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Late Night Eats',
    description: 'Where to find amazing food after midnight in Da Nang.',
    creator_name: 'Night Owl Foodie',
    source_url: null,
    creator_id: null,
    created_at: new Date().toISOString(),
  },
]

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Curated Collections</h1>
        <p className="text-lg text-muted-foreground">
          Discover restaurant lists from trusted local food reviewers
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="md:w-auto">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_COLLECTIONS.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            restaurantCount={10}
          />
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <Button variant="outline" size="lg">
          Load More Collections
        </Button>
      </div>
    </div>
  )
}

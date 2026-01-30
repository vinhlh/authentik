'use client'

import { useState, useMemo, useEffect } from 'react'
import { CollectionCard } from '@/components/collection-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { Collection } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

interface CollectionsGridProps {
  initialCollections: (Collection & {
    collection_restaurants: { count: number }[] | { count: number } | null
    tags: string[] | null
  })[]
}

export function CollectionsGrid({ initialCollections }: CollectionsGridProps) {
  const searchParams = useSearchParams()
  const initialTag = searchParams.get('tag')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag)

  // Sync with URL
  useEffect(() => {
    const tag = searchParams.get('tag')
    if (tag !== selectedTag) {
      setSelectedTag(tag)
    }
  }, [searchParams])

  // 1. Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    initialCollections.forEach(c => {
      c.tags?.forEach(t => tags.add(t))
    })
    return Array.from(tags).sort()
  }, [initialCollections])

  // 2. Filter collections
  const filteredCollections = useMemo(() => {
    return initialCollections.filter(collection => {
      const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTag = selectedTag ? collection.tags?.includes(selectedTag) : true

      return matchesSearch && matchesTag
    })
  }, [initialCollections, searchQuery, selectedTag])

  return (
    <div>
      {/* Search and Filters */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* <Button variant="outline" className="md:w-auto">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button> */}
        </div>

        {/* Dynamic Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
              className="rounded-full"
            >
              All
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(tag)}
                className="rounded-full"
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => {
            // Normalize restaurant count
            // If collection_restaurants is array, take length? No, count is returned as object.
            // Actually, Supabase returns `{ count: number }[]`.
            const countData = collection.collection_restaurants as any
            const count = Array.isArray(countData) ? countData[0]?.count : 0

            return (
              <CollectionCard
                key={collection.id}
                collection={collection}
                restaurantCount={count}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No collections found matching your criteria.</p>
          <Button
            variant="link"
            onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}

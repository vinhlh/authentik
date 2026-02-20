import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPin } from 'lucide-react'
import type { Collection } from '@/lib/supabase'
import { withCityParam } from '@/lib/city-url'

interface CollectionCardProps {
  collection: Collection
  restaurantCount?: number
  cityId?: string | null
}

export function CollectionCard({ collection, restaurantCount = 0, cityId = null }: CollectionCardProps) {
  const { id, name, description, creator_name } = collection

  // Get initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Link href={withCityParam(`/collections/${id}`, cityId)}>
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full">
        {/* Cover Image - Placeholder for now */}
        <div className="relative aspect-square bg-gradient-to-br from-primary-light to-primary">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-white/80" />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Collection Name */}
          <h3 className="font-semibold text-xl mb-2 line-clamp-2">{name}</h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Creator Info */}
          {creator_name && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(creator_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                by {creator_name}
              </span>
            </div>
          )}

          {/* Restaurant Count */}
          <p className="text-sm text-muted-foreground">
            {restaurantCount} {restaurantCount === 1 ? 'restaurant' : 'restaurants'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

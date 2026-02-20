import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Utensils } from 'lucide-react'
import type { Restaurant } from '@/lib/supabase'
import { withCityParam } from '@/lib/city-url'

interface RestaurantCardProps {
  restaurant: Restaurant
  cityId?: string | null
}

const PRICE_LEVELS = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
}

export function RestaurantCard({ restaurant, cityId = null }: RestaurantCardProps) {
  const {
    id,
    name,
    address,
    cuisine_type,
    price_level,
    classification,
  } = restaurant

  return (
    <Link href={withCityParam(`/restaurants/${id}`, cityId)}>
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        {/* Restaurant Image - Placeholder for now */}
        <div className="relative aspect-video bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <Utensils className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Restaurant Name */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{name}</h3>

          {/* Classification Badge */}
          {classification && (
            <div className="mb-2">
              <Badge variant={classification === 'LOCAL_FAVORITE' ? 'local' : 'tourist'}>
                {classification === 'LOCAL_FAVORITE' ? '🌟 Local Favorite' : '🏖️ Tourist Spot'}
              </Badge>
            </div>
          )}

          {/* Cuisine Type and Price Level */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {cuisine_type && cuisine_type.length > 0 && (
              <span>{cuisine_type.join(', ')}</span>
            )}
            {cuisine_type && price_level && <span>•</span>}
            {price_level && (
              <span className="font-medium">{PRICE_LEVELS[price_level as keyof typeof PRICE_LEVELS]}</span>
            )}
          </div>

          {/* Address */}
          {address && (
            <div className="flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

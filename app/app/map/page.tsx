'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// Mock restaurant data
const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'Quán Bún Chả Cá',
    address: '123 Trần Phú, Hải Châu',
    classification: 'LOCAL_FAVORITE' as const,
    coordinates: [108.2022, 16.0544] as [number, number],
  },
  {
    id: '2',
    name: 'Bánh Mì Bà Lan',
    address: '62 Trần Quốc Toản, Hải Châu',
    classification: 'LOCAL_FAVORITE' as const,
    coordinates: [108.2100, 16.0600] as [number, number],
  },
  {
    id: '3',
    name: 'Seafood Paradise',
    address: '789 Võ Nguyên Giáp, Sơn Trà',
    classification: 'TOURIST_SPOT' as const,
    coordinates: [108.2500, 16.0700] as [number, number],
  },
]

export default function MapPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<typeof MOCK_RESTAURANTS[0] | null>(null)

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Interactive Map View</h2>
          <p className="text-muted-foreground mb-4">
            Mapbox integration will be added here
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            The map will show color-coded pins (green for local favorites, blue for tourist spots)
            with interactive popups and clustering for better performance.
          </p>
        </div>
      </div>

      {/* Restaurant Pins (Mock) */}
      <div className="absolute inset-0 pointer-events-none">
        {MOCK_RESTAURANTS.map((restaurant, index) => (
          <button
            key={restaurant.id}
            onClick={() => setSelectedRestaurant(restaurant)}
            className="pointer-events-auto absolute"
            style={{
              left: `${30 + index * 20}%`,
              top: `${40 + index * 10}%`,
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform ${restaurant.classification === 'LOCAL_FAVORITE'
                  ? 'bg-local-badge'
                  : 'bg-tourist-badge'
                }`}
            >
              <MapPin className="w-5 h-5 text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Sheet - Selected Restaurant */}
      {selectedRestaurant && (
        <div className="absolute bottom-0 left-0 right-0 z-10 animate-in slide-in-from-bottom">
          <Card className="rounded-t-2xl rounded-b-none border-t shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{selectedRestaurant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedRestaurant.address}
                  </p>
                  <Badge
                    variant={
                      selectedRestaurant.classification === 'LOCAL_FAVORITE' ? 'local' : 'tourist'
                    }
                  >
                    {selectedRestaurant.classification === 'LOCAL_FAVORITE'
                      ? '🌟 Local Favorite'
                      : '🏖️ Tourist Spot'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRestaurant(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-3">
                <Link href={`/restaurants/${selectedRestaurant.id}`} className="flex-1">
                  <Button className="w-full">View Details</Button>
                </Link>
                <Button variant="outline" className="flex-1">
                  <MapPin className="w-4 h-4 mr-2" />
                  Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      <Card className="absolute top-4 right-4 z-10">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Legend</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-local-badge"></div>
              <span>Local Favorite</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-tourist-badge"></div>
              <span>Tourist Spot</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

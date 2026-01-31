"use client";

import { useState, useEffect, useCallback } from "react";
import { Restaurant, RestaurantCard } from "@/components/stitch/restaurant-card";
import { CollectionMap } from "@/components/stitch/collection-map";
import { CollectionHeader } from "@/components/stitch/collection-header";

interface CollectionContentProps {
  collection: any;
  restaurants: Restaurant[];
  coverImage: string;
  coverImageSrcSet?: string;
}

export function CollectionContent({ collection, restaurants, coverImage, coverImageSrcSet }: CollectionContentProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredRestaurantId, setHoveredRestaurantId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Request location permission on page load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation permission denied or unavailable:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleUserLocationUpdate = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
  };

  const handleSelectRestaurant = useCallback((id: string) => {
    setSelectedRestaurantId(id);
    setHoveredRestaurantId(id);

    // Scroll to the restaurant card
    const element = document.getElementById(`restaurant-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Clear selection after a delay
    setTimeout(() => {
      setSelectedRestaurantId(null);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CollectionHeader collection={collection} coverImage={coverImage} coverImageSrcSet={coverImageSrcSet} />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-6">
          <span className="font-bold text-xl">{restaurants.length} Spots</span>
        </div>

        {restaurants.length > 0 && (
          <div className="flex gap-8">
            {/* Restaurant list */}
            <div className="flex-1 min-w-0">
              <div className="masonry">
                {restaurants.map((restaurant, index) => (
                  <div key={restaurant.id} id={`restaurant-${restaurant.id}`}>
                    <RestaurantCard
                      restaurant={restaurant}
                      index={index + 1}
                      userLocation={userLocation || undefined}
                      isHovered={hoveredRestaurantId === restaurant.id || selectedRestaurantId === restaurant.id}
                      onMouseEnter={() => setHoveredRestaurantId(restaurant.id)}
                      onMouseLeave={() => setHoveredRestaurantId(null)}
                      collectionId={collection.id}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky map */}
            <div className="hidden lg:block w-[350px] flex-shrink-0">
              <div className="sticky top-20">
                <CollectionMap
                  restaurants={restaurants}
                  userLocation={userLocation}
                  onUserLocationUpdate={handleUserLocationUpdate}
                  hoveredRestaurantId={hoveredRestaurantId || selectedRestaurantId}
                  onHoverRestaurant={setHoveredRestaurantId}
                  onSelectRestaurant={handleSelectRestaurant}
                />
              </div>
            </div>
          </div>
        )}

        {restaurants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No restaurants found in this collection.
          </div>
        )}
      </main>
    </div>
  );
}

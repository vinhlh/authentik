"use client";

import { useState, useEffect, useCallback } from "react";
import { Restaurant, RestaurantCard } from "@/components/stitch/restaurant-card";
import { CollectionMap } from "@/components/stitch/collection-map";
import { Map } from "lucide-react";

interface CollectionSectionProps {
  restaurants: Restaurant[];
  className?: string;
  emptyMessage?: string;
}

export function CollectionSection({
  restaurants,
  className = "",
  emptyMessage = "No restaurants found."
}: CollectionSectionProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredRestaurantId, setHoveredRestaurantId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(true);

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
    <div className={`w-full ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <span className="font-bold text-xl">{restaurants.length} Spots</span>
        {/* Mobile map toggle */}
        <button
          onClick={() => setShowMobileMap(!showMobileMap)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-full text-sm font-medium shadow-md"
        >
          <Map className="w-4 h-4" />
          {showMobileMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Mobile map (collapsible) */}
      {showMobileMap && (
        <div className="lg:hidden mb-6 rounded-xl overflow-hidden shadow-lg">
          <CollectionMap
            restaurants={restaurants}
            userLocation={userLocation}
            onUserLocationUpdate={handleUserLocationUpdate}
            hoveredRestaurantId={hoveredRestaurantId || selectedRestaurantId}
            onHoverRestaurant={setHoveredRestaurantId}
            onSelectRestaurant={handleSelectRestaurant}
            showLabels={true}
          />
        </div>
      )}

      {restaurants.length > 0 ? (
        <div className="flex gap-6 lg:gap-8">
          {/* Restaurant list */}
          <div className="flex-1 min-w-0">
            <div className="masonry">
              {restaurants.map((restaurant, index) => (
                <div key={restaurant.id} id={`restaurant-${restaurant.id}`} className="masonry-item">
                  <RestaurantCard
                    restaurant={restaurant}
                    index={index + 1}
                    userLocation={userLocation || undefined}
                    isHovered={hoveredRestaurantId === restaurant.id || selectedRestaurantId === restaurant.id}
                    onMouseEnter={() => setHoveredRestaurantId(restaurant.id)}
                    onMouseLeave={() => setHoveredRestaurantId(null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sticky map */}
          <div className="hidden lg:block w-[350px] xl:w-[400px] flex-shrink-0">
            <div className="sticky top-24">
              <CollectionMap
                restaurants={restaurants}
                userLocation={userLocation}
                onUserLocationUpdate={handleUserLocationUpdate}
                hoveredRestaurantId={hoveredRestaurantId || selectedRestaurantId}
                onHoverRestaurant={setHoveredRestaurantId}
                onSelectRestaurant={handleSelectRestaurant}
                showLabels={true}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 rounded-3xl bg-gray-50 border border-gray-100">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

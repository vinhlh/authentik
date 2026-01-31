"use client";

import { useEffect, useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, ViewStateChangeEvent, GeolocateResultEvent } from 'react-map-gl/mapbox';
import { MapPin, Navigation } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Restaurant } from './restaurant-card';
import { useLanguage } from '@/lib/i18n-context';
import { calculateDistance } from '@/lib/utils/distance';

// Mapbox token should be in environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface CollectionMapProps {
  restaurants: Restaurant[];
  userLocation?: { lat: number; lng: number } | null;
  onUserLocationUpdate?: (location: { lat: number; lng: number }) => void;
  hoveredRestaurantId?: string | null;
  onHoverRestaurant?: (id: string | null) => void;
  onSelectRestaurant?: (id: string) => void;
}

export function CollectionMap({ restaurants, userLocation, onUserLocationUpdate, hoveredRestaurantId, onHoverRestaurant, onSelectRestaurant }: CollectionMapProps) {
  const { t } = useLanguage();
  const [viewState, setViewState] = useState({
    longitude: 108.2022, // Da Nang default
    latitude: 16.0544,
    zoom: 12
  });

  // Calculate bounds to fit all markers
  useEffect(() => {
    if (restaurants.length > 0) {
      const lats = restaurants.map(r => r.coordinates?.lat).filter((l): l is number => l !== undefined);
      const lngs = restaurants.map(r => r.coordinates?.lng).filter((l): l is number => l !== undefined);

      if (lats.length > 0 && lngs.length > 0) {
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Calculate zoom based on the spread of coordinates
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);

        // Approximate zoom level (larger spread = lower zoom)
        let zoom = 14;
        if (maxDiff > 0.1) zoom = 11;
        else if (maxDiff > 0.05) zoom = 12;
        else if (maxDiff > 0.02) zoom = 13;
        else if (maxDiff > 0.01) zoom = 13.5;

        setViewState(prev => ({
          ...prev,
          longitude: (minLng + maxLng) / 2,
          latitude: (minLat + maxLat) / 2,
          zoom
        }));
      }
    }
  }, [restaurants]);

  const pins = useMemo(() => restaurants.map((restaurant, index) => {
    if (!restaurant.coordinates) return null;

    const isHovered = hoveredRestaurantId === restaurant.id;
    const number = index + 1;

    return (
      <Marker
        key={`marker-${restaurant.id}`}
        longitude={restaurant.coordinates.lng}
        latitude={restaurant.coordinates.lat}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onSelectRestaurant?.(restaurant.id);
        }}
      >
        <div
          className={`
            cursor-pointer transform transition-all duration-200 relative
            ${isHovered ? 'scale-125 z-50' : 'hover:scale-110'}
          `}
          onMouseEnter={() => onHoverRestaurant?.(restaurant.id)}
          onMouseLeave={() => onHoverRestaurant?.(null)}
        >
          {/* Custom teardrop marker SVG */}
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z"
              fill={isHovered ? '#E74C4C' : '#6B7280'}
              stroke="white"
              strokeWidth="2"
            />
          </svg>
          <span className="absolute top-0 left-0 right-0 flex items-center justify-center text-white text-sm font-bold h-6 mt-1">
            {number}
          </span>
        </div>
      </Marker>
    );
  }), [restaurants, hoveredRestaurantId, onHoverRestaurant, onSelectRestaurant]);

  return (
    <div className="h-[450px] w-full rounded-xl overflow-hidden border border-stone-200 relative">
      <Map
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <GeolocateControl
          position="top-right"
          onGeolocate={(e: GeolocateResultEvent) => {
            if (onUserLocationUpdate) {
              onUserLocationUpdate({ lat: e.coords.latitude, lng: e.coords.longitude });
            }
          }}
        />
        <NavigationControl position="top-right" />

        {pins}

        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}


      </Map>
    </div>
  );
}

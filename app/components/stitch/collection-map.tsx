"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, ViewStateChangeEvent, GeolocateResultEvent, MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
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
  showLabels?: boolean; // Show restaurant names on markers (for mobile)
}

export function CollectionMap({ restaurants, userLocation, onUserLocationUpdate, hoveredRestaurantId, onHoverRestaurant, onSelectRestaurant, showLabels = false }: CollectionMapProps) {
  const { t } = useLanguage();
  const [viewState, setViewState] = useState({
    longitude: 108.2022, // Da Nang default
    latitude: 16.0544,
    zoom: 12
  });

  // Calculate bounds to fit all markers
  const mapRef = useRef<MapRef>(null);

  // Fit bounds to show all markers
  useEffect(() => {
    if (restaurants.length > 0 && mapRef.current) {
      const validCoords = restaurants
        .map(r => r.coordinates)
        .filter((c): c is { lat: number, lng: number } => c !== undefined && c !== null);

      if (validCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validCoords.forEach(c => bounds.extend([c.lng, c.lat]));

        mapRef.current.fitBounds(bounds, {
          padding: 60,
          duration: 1000
        });
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
            cursor-pointer transform transition-all duration-200 relative flex flex-col items-center
            ${isHovered ? 'scale-125 z-50' : 'hover:scale-110'}
          `}
          onMouseEnter={() => onHoverRestaurant?.(restaurant.id)}
          onMouseLeave={() => onHoverRestaurant?.(null)}
        >
          {/* Custom teardrop marker SVG - Smaller Size (28x35) */}
          <svg width="28" height="35" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
            <path
              d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z"
              fill={isHovered ? '#E74C4C' : '#4B5563'} // Gray-600 normally, Red on hover
              stroke="white"
              strokeWidth="2"
            />
          </svg>
          <span className="absolute top-0 left-0 right-0 flex items-center justify-center text-white text-xs font-bold w-full h-[22px]" style={{ fontSize: '11px', marginTop: '1px' }}>
            {number}
          </span>
          {/* Restaurant name label - only on mobile */}
          {showLabels && (
            <span className="mt-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-medium text-gray-700 rounded shadow-sm text-center max-w-[100px] line-clamp-2 leading-tight">
              {restaurant.name}
            </span>
          )}
        </div>
      </Marker>
    );
  }), [restaurants, hoveredRestaurantId, onHoverRestaurant, onSelectRestaurant, showLabels]);

  return (
    <div className="h-[250px] lg:h-[450px] w-full rounded-xl overflow-hidden border border-stone-200 relative">
      <Map
        ref={mapRef}
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

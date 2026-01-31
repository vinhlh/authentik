"use client";

import Link from "next/link";
import { ArrowRight, Utensils, Quote, Star, Navigation } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";
import { calculateDistance } from "@/lib/utils/distance";

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  location: string;
  cuisine: string;
  price: string;
  tags: string[];
  image: string;
  alt: string;
  badge?: {
    text: string;
    type: "local" | "trending" | "tourist";
  };
  reviewSummary?: string;
  reviewSummaryVi?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function RestaurantCard({
  restaurant,
  index,
  userLocation,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  collectionId
}: {
  restaurant: Restaurant;
  index?: number;
  userLocation?: { lat: number, lng: number };
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  collectionId?: string;
}) {
  const { language, t } = useLanguage();

  const badgeColor =
    restaurant.badge?.type === "local"
      ? "bg-primary"
      : restaurant.badge?.type === "trending"
        ? "bg-[#1c1917]"
        : "bg-primary";

  // Select summary based on language
  const displayedSummary = language === 'vi'
    ? (restaurant.reviewSummaryVi || restaurant.reviewSummary)
    : (restaurant.reviewSummary || restaurant.reviewSummaryVi);

  return (
    <div
      className="masonry-item break-inside-avoid mb-6"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link href={`/restaurants/${restaurant.id}${collectionId ? `?collectionId=${collectionId}` : ''}`}>
        <div className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-200 group cursor-pointer ${isHovered ? 'ring-2 ring-primary scale-[1.02]' : ''}`}>
          <div className="relative">
            <img
              className="w-full h-auto object-cover"
              src={restaurant.image}
              alt={restaurant.alt}
            />
            {/* Numbered badge */}
            {index && (
              <span className="absolute top-3 right-3 w-7 h-7 bg-white text-gray-800 text-sm font-bold rounded-full flex items-center justify-center shadow-md border border-gray-200">
                {index}
              </span>
            )}
            {restaurant.badge && (
              <span
                className={`absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${badgeColor}`}
              >
                {t(restaurant.badge.text as any) || restaurant.badge.text}
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-sm font-bold">{restaurant.rating}</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-2">
              {restaurant.location} • {restaurant.cuisine}
            </p>
            {displayedSummary && (
              <div className="mb-3 relative pl-2">
                <Quote className="absolute -top-1 left-0 w-3 h-3 text-primary/40 rotate-180" />
                <p className="text-sm text-gray-600 italic leading-relaxed font-serif pl-4">
                  {displayedSummary}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                {restaurant.price} • {t(restaurant.tags[0] as any) || restaurant.tags[0]}
              </span>
              {userLocation && restaurant.coordinates && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                  <Navigation className="w-3 h-3" />
                  {calculateDistance(userLocation.lat, userLocation.lng, restaurant.coordinates.lat, restaurant.coordinates.lng)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

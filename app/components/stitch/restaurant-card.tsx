"use client";

import Link from "next/link";
import { ArrowRight, Utensils, Quote, Star, Navigation, Heart } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";
import { calculateDistance } from "@/lib/utils/distance";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LoginModal } from "@/components/auth/login-modal";
import { usePathname, useSearchParams } from "next/navigation";
import { getCityIdFromPathname, withCityParam } from "@/lib/city-url";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cityId = getCityIdFromPathname(pathname) || searchParams.get("city");
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    } else {
      setIsFavorite(false);
    }
  }, [user, restaurant.id]);

  const checkFavoriteStatus = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user!.id)
      .eq('restaurant_id', restaurant.id)
      .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple rows (shouldn't happen with unique constraint) or 0 rows

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isFavorite) {
      // Optimistic update
      setIsFavorite(false);
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id);
    } else {
      // Optimistic update
      setIsFavorite(true);
      await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          restaurant_id: restaurant.id
        });
    }
  };

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
  const restaurantHref = withCityParam(
    `/restaurants/${restaurant.id}${collectionId ? `?collectionId=${collectionId}` : ''}`,
    cityId
  );

  return (
    <div
      className="masonry-item break-inside-avoid mb-6"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link href={restaurantHref}>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-200 group cursor-default">
          <div className="relative overflow-hidden">
            <img
              className={`w-full h-auto object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}
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
            <div className="mb-1">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
                <h3 className={`font-bold text-base lg:text-lg leading-tight transition-colors group-hover:text-primary cursor-pointer ${isHovered ? 'text-primary' : ''}`}>
                  {restaurant.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 lg:mt-0">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-bold">{restaurant.rating}</span>
                </div>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs w-fit">
                {restaurant.price} • {t(restaurant.tags[0] as any) || restaurant.tags[0]}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  className={`group/fav w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${isFavorite
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                >
                  <Heart className={`w-4 h-4 transition-transform group-active/fav:scale-90 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                {restaurant.coordinates && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${restaurant.coordinates!.lat},${restaurant.coordinates!.lng}`,
                        '_blank'
                      );
                    }}
                    className="group/btn flex items-center gap-1 px-2 py-1 bg-primary-light/20 border border-primary/30 rounded-full text-xs font-medium text-primary hover:bg-primary-light/40 hover:text-primary transition-colors cursor-pointer whitespace-nowrap w-fit"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    {/* Mobile: Short version - just icon + distance */}
                    <span className="lg:hidden">
                      {userLocation
                        ? calculateDistance(userLocation.lat, userLocation.lng, restaurant.coordinates.lat, restaurant.coordinates.lng)
                        : 'Go'}
                    </span>
                    {/* Desktop: Show distance, swap to "Get Direction" on hover */}
                    <span className="hidden lg:inline group-hover/btn:hidden">
                      {userLocation
                        ? calculateDistance(userLocation.lat, userLocation.lng, restaurant.coordinates.lat, restaurant.coordinates.lng)
                        : 'Directions'}
                    </span>
                    <span className="hidden lg:group-hover/btn:inline">Get Direction</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

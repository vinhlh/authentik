"use client";

import { useLocation } from "@/lib/location-context";
import { Restaurant, RestaurantCard } from "./restaurant-card";

const FALLBACK_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "Mỳ Quảng Cô Sáu",
    rating: 4.9,
    location: "Hải Châu",
    cuisine: "Vietnamese",
    price: "$",
    tags: ["Cheap Eats"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtM4ttBBrU8DNs0NqPeAo_cfSU6V-PiUi2pYmm5ahmIvrCHu-MFEs6aTDQLLepaSz2l3H6wuWc2jvgNGfGEFPHzINTXviMpQ07V-LD6ignHvctXkpaz5pmsweF8zUVNIuQTCHWrAKeDj5WhaAg8X03uhFp0N1Vpe7SzwbP_YJuxQlnMZk-dTVfxXCcmv9331xGb46eyKNDCs1sn7OkPtGbYBcaIa_7KyfZdO4GdJvn1EgF9m2ibC-mjczW5ZxT0SHyjrlmjyWYU7MQ",
    alt: "Traditional Vietnamese noodle soup in a bowl",
    badge: { text: "Local Favorite", type: "local" },
  },
  {
    id: "2",
    name: "The Workshop Coffee",
    rating: 4.7,
    location: "Sơn Trà",
    cuisine: "Specialty Coffee",
    price: "$$",
    tags: ["Cafe"],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7GvymdlUHcFEO0T_sHOdobQ0UAT4d5xxAsaXyEL1BIVG4GYSrU1Ji4Koa6rTky31oE0auACPqoWD13j_8223mEfwn7X9J2i585cGicwyDY6FJW-QePlD4Uuz4hcmQ8RV56tmWRo1bptLaq-T91AjeqwxeqyWAuMnIkM3BOddFfEIOyQaVXutLDN3gcqaTI2QsO0BcQz21qsXBOa7M67QYAd4eno7CBBrxotYrC8qY8wqQUJbvL44TjZPhR7IW_77iYeeqbYh5UcrJ",
    alt: "Selection of iced coffee drinks on a table",
    badge: { text: "Trending", type: "trending" },
  },
  // ... keep a few fallbacks
];

export function MasonryGrid({ restaurants, hasMore = false, disableFallback = false }: { restaurants?: Restaurant[], hasMore?: boolean, disableFallback?: boolean }) {
  const { location } = useLocation();

  let displayRestaurants: Restaurant[] = [];
  if (restaurants && restaurants.length > 0) {
    displayRestaurants = restaurants;
  } else if (!disableFallback) {
    displayRestaurants = FALLBACK_RESTAURANTS;
  }

  return (
    <>
      <div className="masonry">
        {displayRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            userLocation={location || undefined}
          />
        ))}
      </div>

      {displayRestaurants.length === 0 && (
        <div className="text-center py-12 text-gray-500 italic">
          No restaurants found.
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-12">
          <button className="px-8 py-3 rounded-xl border-2 border-[#1c1917]/10 font-bold hover:bg-[#1c1917] hover:text-white transition-all">
            Show more spots
          </button>
        </div>
      )}
    </>
  );
}

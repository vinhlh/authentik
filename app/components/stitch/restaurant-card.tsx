import { Star } from "lucide-react";
import Link from "next/link";

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
}

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const badgeColor =
    restaurant.badge?.type === "local"
      ? "bg-primary"
      : restaurant.badge?.type === "trending"
        ? "bg-[#1c1917]"
        : "bg-primary"; // Default fallback, though HTML uses specific colors for badges.

  // HTML classes:
  // Local Favorite: bg-primary (#db7706)
  // Trending: bg-charcoal (#1c1917)
  // Tourist Favorite: bg-primary (wait, HTML says "Tourist Favorite" is bg-primary too in one case, but logic usually differs. Let's follow HTML exactly per instance).

  return (
    <div className="masonry-item break-inside-avoid mb-6">
      <Link href={`/restaurants/${restaurant.id}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
          <div className="relative">
            <img
              className="w-full h-auto object-cover"
              src={restaurant.image}
              alt={restaurant.alt}
            />
            {restaurant.badge && (
              <span
                className={`absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${badgeColor}`}
              >
                {restaurant.badge.text}
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
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                {restaurant.price} • {restaurant.tags[0]}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

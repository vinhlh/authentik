"use client";

import Link from "next/link";
import { ArrowRight, Utensils } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";
import { usePathname, useSearchParams } from "next/navigation";
import { getCityIdFromPathname, withCityParam } from "@/lib/city-url";

interface CollectionCardProps {
  collection: {
    id: string;
    name?: string;
    name_vi?: string | null;
    name_en?: string | null;
    restaurant_count?: number;
    source_url?: string | null;
    image_url?: string | null; // If we add this later
  };
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { getI18nText } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cityId = getCityIdFromPathname(pathname) || searchParams.get("city");

  const name = getI18nText(collection, 'name');

  // Extract YouTube video ID and build responsive thumbnail URLs
  const videoId = collection.source_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];

  // YouTube thumbnail resolutions
  const thumbDefault = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600";

  const thumbSrcSet = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg 320w, https://img.youtube.com/vi/${videoId}/hqdefault.jpg 480w, https://img.youtube.com/vi/${videoId}/sddefault.jpg 640w, https://img.youtube.com/vi/${videoId}/maxresdefault.jpg 1280w`
    : undefined;

  return (
    <Link href={withCityParam(`/collections/${collection.id}`, cityId)} className="group block h-full">
      <div className="relative h-full bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border border-transparent hover:border-gray-100 flex flex-col">
        {/* Image with responsive srcSet - 16:9 Ratio for YouTube style */}
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          <img
            src={thumbDefault}
            srcSet={thumbSrcSet}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white text-xs font-bold shadow-sm">
            <Utensils className="w-3 h-3" />
            <span>{collection.restaurant_count || 0} Spots</span>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-lg font-bold text-[#1c1917] leading-tight mb-2 group-hover:text-primary transition-colors">
              {name}
            </h3>
          </div>

          <div className="mt-4 flex items-center text-primary text-sm font-bold gap-1 group-hover:translate-x-1 transition-transform">
            Explore Collection <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}

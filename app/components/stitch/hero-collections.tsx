import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Collection } from "@/lib/supabase";

export interface HeroCollectionProps extends Collection {
  restaurant_count?: number;
}

const FALLBACK_COLLECTIONS = [
  {
    id: "1",
    name: "Best Bánh Mì",
    restaurant_count: 12,
    source_url: "https://www.youtube.com/watch?v=placeholder",
    // We'll simulate images for fallbacks below or handle in the render
  },
  // ... (keep other fallbacks if needed, simplified for brevity)
];

// Helper to get YouTube thumbnail
function getYouTubeThumbnail(url: string | null) {
  if (!url) return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000";
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000";
}

export function HeroCollections({ collections }: { collections?: HeroCollectionProps[] }) {
  const displayCollections = (collections && collections.length > 0) ? collections : FALLBACK_COLLECTIONS;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1c1917]">
            Curated Collections
          </h2>
          <p className="text-gray-500 mt-1">
            Hand-picked experiences by local food experts
          </p>
        </div>
        <Link
          href="/collections"
          className="text-primary font-semibold flex items-center gap-1 hover:underline"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="masonry">
        {displayCollections.map((collection) => (
          <div key={collection.id} className="masonry-item break-inside-avoid mb-6 group cursor-pointer">
            <Link href={`/collections/${collection.id}`}>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-3 bg-gray-100">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={getYouTubeThumbnail(collection.source_url)}
                  alt={collection.name}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1c1917] leading-tight mb-1 group-hover:text-primary transition-colors">
                  {collection.name}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  {collection.restaurant_count || 0} Spots
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

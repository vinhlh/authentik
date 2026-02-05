import { HeroCollections, HeroCollectionProps } from "@/components/stitch/hero-collections";
import { FilterBar } from "@/components/stitch/filter-bar";
import { MasonryGrid } from "@/components/stitch/masonry-grid";
import { supabase } from "@/lib/supabase";
import { Restaurant } from "@/components/stitch/restaurant-card";

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  let collections: HeroCollectionProps[] = [];
  let restaurants: Restaurant[] = [];

  try {
    // Fetch Collections
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('collections')
      .select('*, collection_restaurants(count)')
      .order('created_at', { ascending: false });

    if (!collectionsError && collectionsData) {
      collections = collectionsData.map((item: any) => ({
        ...item,
        restaurant_count: item.collection_restaurants?.[0]?.count || 0
      })).filter((item: any) => item.restaurant_count > 1);
    }

    // Fetch Restaurants
    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(20)
      .order('created_at', { ascending: false });

    if (!restaurantsError && restaurantsData) {
      restaurants = restaurantsData.map((r: any) => ({
        id: r.id,
        name: r.name,
        // Use authenticity score to mock rating if actual rating (cache) is missing
        rating: r.authenticity_score ? Number((3 + r.authenticity_score * 2).toFixed(1)) : 4.5,
        location: r.address?.split(',').slice(-2, -1)[0]?.trim().replace(/\s*\d{4,}(?:\s*-[a-zA-Z0-9]+)?$/, '') || "Da Nang",
        cuisine: r.cuisine_type?.[0] || "Vietnamese",
        price: ["$", "$$", "$$$", "$$$$"][(r.price_level || 1) - 1] || "$",
        tags: r.cuisine_type?.slice(0, 2) || ["Local"],
        // Placeholder images since we don't store them yet
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
        alt: r.name,
        badge: r.classification === 'LOCAL_FAVORITE'
          ? { text: "Local Favorite", type: "local" }
          : r.classification === 'TOURIST_SPOT'
            ? { text: "Tourist Spot", type: "tourist" }
            : undefined
      }));
    }

  } catch (e) {
    console.error("Failed to fetch data:", e);
    // Continue with empty arrays to show fallbacks
  }

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8 w-full">
      {/* Hero / Collections Section */}
      <HeroCollections collections={collections} />

      {/* Filter Bar - Removed per user request */}
      {/* <FilterBar /> */}

      {/* Discovery Grid - Removed per user request */}
      {/* <MasonryGrid restaurants={restaurants} /> */}
    </main>
  );
}

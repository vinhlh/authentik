import { supabase } from "@/lib/supabase";
import { Restaurant, RestaurantCard } from "@/components/stitch/restaurant-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let collection: any = null;
  let restaurants: Restaurant[] = [];

  const MOCK_COLLECTION = {
    id: "1",
    name: "Best Bánh Mì in Da Nang",
    description: "A curated tour of the crispiest, most flavorful Bánh Mì spots in the city, chosen by locals.",
    creator_name: "Vinh Le",
    source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    restaurants: [
      {
        id: "101",
        name: "Bánh Mì Bà Lan",
        rating: 4.8,
        location: "Hải Châu",
        cuisine: "Bánh Mì",
        price: "$",
        tags: ["Crispy", "Traditional"],
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
        alt: "Bánh Mì Bà Lan",
        badge: { text: "Local Legend", type: "local" }
      },
      {
        id: "102",
        name: "Bánh Mì Phượng (Branch 2)",
        rating: 4.5,
        location: "Sơn Trà",
        cuisine: "Bánh Mì",
        price: "$",
        tags: ["Fusion"],
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
        alt: "Bánh Mì Phượng"
      }
    ]
  };

  try {
    // If using mock ID "1" or explicit failover needed, use mock data
    if (id === '1' || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder_until_provided') {
      throw new Error("Using mock data");
    }

    // Fetch Collection
    const { data: collectionData, error: colError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (collectionData) {
      collection = collectionData;

      // Fetch Restaurants in Collection
      const { data: relData, error: relError } = await supabase
        .from('collection_restaurants')
        .select(`
          notes,
          recommended_dishes,
          restaurant:restaurants (*)
        `)
        .eq('collection_id', id);

      console.log(`[DEBUG] Collection ID: ${id}`);
      console.log(`[DEBUG] relData count: ${relData?.length}`);
      if (relError) console.error(`[DEBUG] relError:`, relError);

      if (relData && relData.length > 0) {
        // debug first item
        console.log(`[DEBUG] First item restaurant:`, relData[0].restaurant);
      } else {
        console.log(`[DEBUG] No relData found or empty array`);
      }

      if (relData) {
        restaurants = relData
          .filter((item: any) => item.restaurant)
          .map((item: any) => {
            const r = item.restaurant; // Assuming 'r' is defined here from item.restaurant
            const details = r.authenticity_details || {};
            const badgeLabel = details.badgeLabel ||
              (r.classification === 'LOCAL_FAVORITE' ? 'Local Favorite' : r.classification === 'TOURIST_SPOT' ? 'Tourist Spot' : undefined);

            // Use signals as tags if available, otherwise fallback to cuisine/dishes
            const signalTags = details.signals?.map((s: any) => s.name) || [];
            const displayTags = [...signalTags, ...(item.recommended_dishes || r.cuisine_type || ["Local"])].slice(0, 2);

            return {
              id: r.id,
              name: r.name,
              rating: r.google_rating || (r.authenticity_score ? Number((3 + r.authenticity_score * 2).toFixed(1)) : 4.5),
              // User requested specialties instead of location for Collection view
              location: item.recommended_dishes?.slice(0, 2).join(", ") || r.cuisine_type?.[0] || "Specialty Food",
              cuisine: r.cuisine_type?.[0] || "Vietnamese",
              price: ["$", "$$", "$$$", "$$$$"][(r.price_level || 1) - 1] || "$",
              tags: displayTags,
              image: r.images?.[0] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
              alt: r.name,
              badge: badgeLabel ? { text: badgeLabel, type: "local" } : undefined
            } as Restaurant;
          });
      }
    }
  } catch (e) {
    console.log("Falling back to mock data for Collection Page");
    // Fallback logic
    if (id === '1' || !collection) {
      collection = MOCK_COLLECTION;
      restaurants = MOCK_COLLECTION.restaurants as any;
    }
  }

  if (!collection) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">Collection not found</h1>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">
          Back to Home
        </Link>
        <p className="mt-4 text-gray-500 text-sm">(Try ID "1" for a demo collection)</p>
      </div>
    );
  }

  // Get video thumbnail for cover
  const videoId = collection.source_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  const coverImage = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000";

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Cover Header */}
      <div className="relative h-[40vh] w-full bg-black">
        <img
          src={coverImage}
          alt={collection.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <Link href="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors text-sm font-semibold text-white border border-white/20">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 pb-12 max-w-[1200px] mx-auto z-10">
          <div className="max-w-3xl">
            <span className="bg-[#db7706]/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block shadow-sm">
              Curated by {collection.creator_name || "Authentik"}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-lg text-gray-200 font-medium max-w-2xl line-clamp-3 drop-shadow-sm leading-relaxed">
                {collection.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-8 border-b pb-4">
          <span className="font-bold text-xl">{restaurants.length} Spots</span>
          {collection.source_url && (
            <a href={collection.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline ml-auto flex items-center gap-1 text-sm font-semibold">
              Watch Video source
            </a>
          )}
        </div>

        <div className="masonry">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No restaurants found in this collection.
          </div>
        )}
      </main>
    </div>
  );
}

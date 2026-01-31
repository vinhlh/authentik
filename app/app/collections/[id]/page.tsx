import { supabase } from "@/lib/supabase";
import { CollectionContent } from "@/components/stitch/collection-content";
import { Restaurant } from "@/components/stitch/restaurant-card";
import { parseWkbPoint } from "@/lib/utils/wkb-parser";
import Link from "next/link";

export const revalidate = 60;

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let collection: any = null;
  let restaurants: Restaurant[] = [];

  const MOCK_COLLECTION = {
    id: "1",
    name: "Best Bánh Mì in Da Nang",
    name_vi: "Bánh Mì Ngon Nhất Đà Nẵng",
    description: "A curated tour of the crispiest, most flavorful Bánh Mì spots in the city, chosen by locals.",
    description_vi: "Một vòng dạo quanh những quán bánh mì giòn rụm, đậm đà nhất thành phố, được người địa phương tuyển chọn.",
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
          ai_summary_en,
          ai_summary_vi,
          restaurant:restaurants(*)
        `)
        .eq('collection_id', id);

      if (relError) console.error(`[DEBUG] relError:`, relError);

      if (relData) {
        restaurants = relData
          .filter((item: any) => item.restaurant)
          .map((item: any) => {
            const r = item.restaurant; // Assuming 'r' is defined here from item.restaurant
            const details = r.authenticity_details || {};
            const badgeLabel = details.badgeLabel ||
              (r.classification === 'LOCAL_FAVORITE' ? 'badge.localFavorite' : r.classification === 'TOURIST_SPOT' ? 'badge.touristSpot' : undefined);

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
              badge: badgeLabel ? { text: badgeLabel, type: "local" } : undefined,
              reviewSummary: item.ai_summary_en,
              reviewSummaryVi: item.ai_summary_vi,
              coordinates: r.location ? parseWkbPoint(r.location) || undefined : undefined
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

  // Get video thumbnail for cover with responsive srcSet
  const videoId = collection.source_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  const coverImage = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000";

  const coverImageSrcSet = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg 320w, https://img.youtube.com/vi/${videoId}/hqdefault.jpg 480w, https://img.youtube.com/vi/${videoId}/sddefault.jpg 640w, https://img.youtube.com/vi/${videoId}/maxresdefault.jpg 1280w`
    : undefined;

  return (
    <CollectionContent
      collection={collection}
      restaurants={restaurants}
      coverImage={coverImage}
      coverImageSrcSet={coverImageSrcSet}
    />
  );
}

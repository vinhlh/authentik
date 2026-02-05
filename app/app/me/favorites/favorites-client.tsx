"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CollectionSection } from "@/components/stitch/collection-section";
import { useLanguage } from "@/lib/i18n-context";
import Link from "next/link";
import { Heart, Share2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@/components/stitch/restaurant-card";
import { parseWkbPoint } from "@/lib/utils/wkb-parser";

export function FavoritesClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          restaurant_id,
          restaurants (*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract and transform restaurants
      const favorites = data.map((item: any) => {
        const r = item.restaurants;
        // Transform DB shape to UI shape
        const priceSymbol = ["$", "$$", "$$$", "$$$$"][(r.price_level || 1) - 1] || "$";
        const image = r.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800'; // fallback

        // Tags mapping
        let tags = r.cuisine_type || [];
        if (tags.length === 0) tags = ["Local Food"];

        // Badge logic similar to restaurant-card usage elsewhere
        let badge = undefined;
        if (r.classification === 'LOCAL_FAVORITE') {
          badge = { text: 'Local Favorite', type: 'local' as const };
        } else if (r.classification === 'TOURIST_SPOT') {
          badge = { text: 'Tourist Spot', type: 'tourist' as const };
        }

        return {
          id: r.id,
          name: r.name,
          rating: r.google_rating || r.authenticity_score * 5 || 4.5,
          location: r.address?.split(',')[0] || 'Da Nang', // Simple short address
          cuisine: tags[0],
          price: priceSymbol,
          tags: tags,
          image: image,
          alt: r.name,
          badge: badge,
          reviewSummary: r.ai_summary_en,
          reviewSummaryVi: r.ai_summary_vi,
          coordinates: r.location ? parseWkbPoint(r.location) || undefined : undefined
        };
      }) as Restaurant[];

      setRestaurants(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    const url = `${window.location.origin}/u/${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-[1200px] mx-auto text-center py-20">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view favorites</h1>
          <p className="text-gray-500 mb-8">Save your favorite local spots to create your own collection.</p>
          <Link href="/" className="text-primary hover:underline font-bold">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Home
              </Link>
              <span>/</span>
              <span>Favorites</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1c1917]">My Collection</h1>
            <p className="text-gray-600 mt-2">
              {restaurants.length} {restaurants.length === 1 ? 'place' : 'places'} you love in Da Nang
            </p>
          </div>

          <Button
            onClick={handleShare}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm rounded-xl px-4 py-2 font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share Collection
          </Button>
        </div>

        {restaurants.length > 0 ? (
          <CollectionSection restaurants={restaurants} />
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start exploring and click the heart icon on restaurants you want to save.
            </p>
            <Link href="/" className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              Explore Restaurants
            </Link>
          </div>
        )}
      </div>

      {/* Copied Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1c1917] text-white px-6 py-3 rounded-full shadow-xl transition-all duration-300 flex items-center gap-3 z-50 ${showCopiedToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-green-500 rounded-full p-0.5">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm">Link copied to clipboard!</span>
      </div>
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';
import { CollectionSection } from "@/components/stitch/collection-section";
import { CollectionHeader } from "@/components/stitch/collection-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from 'next';
import { parseWkbPoint } from "@/lib/utils/wkb-parser";
import { supabase } from "@/lib/supabase";

interface Props {
  params: Promise<{
    userId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;

  // Fetch user profile name if possible
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const name = profile?.full_name || 'User';

  return {
    title: `${name}'s Collection | Authentik`,
    description: `Check out ${name}'s favorite authentic food spots in Da Nang.`,
    openGraph: {
      title: `${name}'s Collection | Authentik`,
      description: `Check out ${name}'s favorite authentic food spots in Da Nang.`,
    }
  };
}

export default async function PublicCollectionPage({ params }: Props) {
  const { userId } = await params;

  // Fetch user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const displayName = profile?.full_name || 'User';

  // Fetch favorites
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select(`
      restaurants (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !favorites) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <Link href="/" className="text-primary hover:underline font-bold">Back to Home</Link>
        </div>
      </div>
    );
  }

  // Transform data
  const restaurants = favorites.map((item: any) => {
    const r = item.restaurants;
    const priceSymbol = ["$", "$$", "$$$", "$$$$"][(r.price_level || 1) - 1] || "$";
    const image = r.images?.[0] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800';
    let tags = r.cuisine_type || [];
    if (tags.length === 0) tags = ["Local Food"];

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
      location: r.address?.split(',')[0] || 'Da Nang',
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
  });

  // Construct collection object for Header
  const title = `Da Nang Collection`;
  const desc = `Restaurants in Da Nang favorited by ${displayName}`;

  const collectionProp = {
    name: title,
    name_en: title,
    name_vi: title,
    description: desc,
    description_en: desc,
    description_vi: desc,
    creator_name: displayName,
  };

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CollectionHeader
        collection={collectionProp}
      />


      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <CollectionSection
          restaurants={restaurants}
          emptyMessage="No favorites yet. Start exploring to add some!"
        />
      </main>
    </div>
  );
}

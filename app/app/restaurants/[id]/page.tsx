import { supabase } from "@/lib/supabase";
import { RestaurantClient } from "./restaurant-client";
import { getUrlKey, isUuid } from "@/lib/url-keys";
import type { Metadata } from "next";

export const revalidate = 60;

// Helper to fetch restaurant
async function getRestaurant(key: string) {
  const byKeyResult = await supabase
    .from('restaurants')
    .select('*')
    .eq('url_key', key)
    .maybeSingle();

  if (byKeyResult.data) return byKeyResult.data;

  if (isUuid(key)) {
    const byIdResult = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', key)
      .maybeSingle();
    return byIdResult.data;
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: key } = await params;
  const restaurant = await getRestaurant(key);

  if (!restaurant) {
    return {
      title: "Restaurant Not Found | Authentik",
    }
  }

  const name = restaurant.name;
  const summary = restaurant.ai_summary_en || restaurant.ai_summary_vi || `${restaurant.cuisine_type?.[0] || 'Local'} food in Da Nang`;
  const image = restaurant.images?.[0] || "https://images.pinterest.com/originals/94/a3/52/94a3525166dc7e224e756816040445d4.jpg";

  return {
    title: `${name} - Authentic Local Food | Authentik`,
    description: summary,
    openGraph: {
      title: name,
      description: summary,
      images: [image],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: summary,
      images: [image],
    }
  }
}

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: key } = await params;
  const restaurant = await getRestaurant(key);

  const jsonLd = restaurant ? {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    image: restaurant.images || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressLocality: 'Da Nang',
      addressCountry: 'VN'
    },
    geo: restaurant.location?.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: restaurant.location.coordinates[1],
      longitude: restaurant.location.coordinates[0]
    } : undefined,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/restaurants/${getUrlKey(restaurant)}`,
    telephone: restaurant.phone_number,
    priceRange: restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$',
    servesCuisine: restaurant.cuisine_type || 'Vietnamese',
    review: restaurant.ai_summary_en ? {
      '@type': 'Review',
      reviewBody: restaurant.ai_summary_en,
      author: {
        '@type': 'Organization',
        name: 'Authentik'
      }
    } : undefined
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RestaurantClient initialRestaurant={restaurant} />
    </>
  );
}

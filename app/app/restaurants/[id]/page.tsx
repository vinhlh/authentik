import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, Utensils, DollarSign, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let restaurant: any = null;

  const MOCK_RESTAURANTS = [
    {
      id: '1',
      name: 'Mỳ Quảng Cô Sáu',
      address: '123 Pham Van Dong, Da Nang',
      authenticity_score: 0.95,
      classification: 'LOCAL_FAVORITE',
      cuisine_type: ['Vietnamese', 'Noodles'],
      price_level: 1
    },
    {
      id: '2',
      name: 'The Workshop Coffee',
      address: '456 Tran Phu, Da Nang',
      authenticity_score: 0.85,
      classification: 'TOURIST_SPOT',
      cuisine_type: ['Coffee', 'Cafe'],
      price_level: 2
    }
  ];

  try {
    // If using mock ID "1" or explicit failover needed, use mock data
    if ((id === '1' || id === '2') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'placeholder_until_provided') {
      throw new Error("Using mock data");
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      restaurant = data;
    }
  } catch (e) {
    console.log("Falling back to mock data for Restaurant Page");
    const mock = MOCK_RESTAURANTS.find(r => r.id === id);
    if (mock) {
      restaurant = mock;
    }
  }

  if (!restaurant) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">Restaurant not found</h1>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  // Derived data
  const rating = restaurant.google_rating ||
    (restaurant.authenticity_score ? Number((3 + restaurant.authenticity_score * 2).toFixed(1)) : 4.5);

  const priceSymbol = ["$", "$$", "$$$", "$$$$"][(restaurant.price_level || 1) - 1] || "$";

  // Use first image or fallback
  const heroImage = restaurant.images?.[0] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000";

  const details = restaurant.authenticity_details || {};
  const badgeLabel = details.badgeLabel ||
    (restaurant.classification === 'LOCAL_FAVORITE' ? 'Local Favorite' : 'Tourist Spot');

  const signals = details.signals || [];

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header Image */}
      <div className="relative h-[40vh] w-full bg-gray-100">
        <img
          src={heroImage}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-6 left-6">
          <Link href="/" className="bg-white/90 p-2 rounded-full flex items-center gap-2 hover:bg-white transition-colors text-sm font-semibold shadow-sm backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 -mt-20 relative bg-white rounded-t-3xl pt-8 pb-12 shadow-sm min-h-[500px]">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex-1 space-y-8">
            {/* Header Section */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${restaurant.classification === 'LOCAL_FAVORITE' || details.score >= 0.6 ? 'bg-[#db7706]' : 'bg-gray-800'
                  }`}>
                  {badgeLabel}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold bg-gray-100 px-2 py-1 rounded-full">
                  <Star className="w-3 h-3 text-[#db7706] fill-[#db7706]" /> {rating} ({restaurant.google_user_ratings_total || 0})
                </span>
              </div>

              <h1 className="text-4xl font-bold text-[#1c1917] mb-3 leading-tight">{restaurant.name}</h1>

              <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {restaurant.address}
                </div>
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-gray-400" />
                  {restaurant.cuisine_type?.[0] || "Vietnamese"}
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  {priceSymbol}
                </div>
              </div>
            </div>

            {/* Authenticity Analysis */}
            {signals.length > 0 && (
              <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-[#db7706]" /> Authenticity Signal
                </h2>
                <div className="grid gap-3">
                  {signals.map((signal: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100/50">
                      <span className="text-xl shrink-0">{signal.icon}</span>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{signal.name}</div>
                        <div className="text-sm text-gray-500">{signal.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {details.summary && (
                  <p className="mt-4 text-sm text-gray-600 italic border-t pt-4">
                    "{details.summary}"
                  </p>
                )}
              </section>
            )}

            {/* About & Tags */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Experience authentic {restaurant.cuisine_type?.[0]?.toLowerCase() || 'local'} flavors at {restaurant.name}.
                  {details.summary ? ` ${details.summary}.` : ''}
                </p>
              </section>

              {restaurant.cuisine_type && (
                <section>
                  <h2 className="text-xl font-bold mb-3">Cuisine & Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine_type.map((tag: string) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Gallery (If multiple images) */}
            {restaurant.images && restaurant.images.length > 1 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 gap-3">
                  {restaurant.images.slice(1, 5).map((img: string, i: number) => (
                    <img key={i} src={img} alt={`Gallery ${i}`} className="w-full h-48 object-cover rounded-xl" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-[320px] shrink-0 space-y-4">
            {/* Opening Hours */}
            {restaurant.opening_hours && (
              <div className="p-6 border rounded-2xl bg-gray-50">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" /> Opening Hours
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {restaurant.opening_hours.weekday_text?.map((day: string) => (
                    <div key={day} className="flex justify-between py-1 border-b border-gray-100 last:border-0 last:pb-0">
                      {day}
                    </div>
                  )) || (
                      <p className="text-gray-500 italic">Hours not available</p>
                    )}
                </div>
                {restaurant.opening_hours.open_now !== undefined && (
                  <div className={`mt-4 text-center py-2 rounded-lg text-sm font-bold ${restaurant.opening_hours.open_now ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {restaurant.opening_hours.open_now ? 'Open Now' : 'Closed'}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full h-12 text-base font-bold bg-[#db7706] hover:bg-[#b45309] shadow-md shadow-orange-200">
                Get Directions
              </Button>
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full h-12 rounded-md border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
                >
                  Visit Website
                </a>
              )}
              {restaurant.phone_number && (
                <a
                  href={`tel:${restaurant.phone_number}`}
                  className="flex items-center justify-center w-full h-12 rounded-md border border-gray-200 font-bold hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Call {restaurant.phone_number}
                </a>
              )}
            </div>

            {/* Location Map */}
            <div className="rounded-2xl overflow-hidden border h-[240px]">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

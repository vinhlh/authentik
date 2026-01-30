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
  const rating = restaurant.authenticity_score ? Number((3 + restaurant.authenticity_score * 2).toFixed(1)) : 4.5;
  const priceSymbol = ["$", "$$", "$$$", "$$$$"][(restaurant.price_level || 1) - 1] || "$";
  const image = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000"; // Placeholder

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      <div className="relative h-[40vh] w-full bg-gray-100">
        <img
          src={image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-6 left-6">
          <Link href="/" className="bg-white/90 p-2 rounded-full flex items-center gap-2 hover:bg-white transition-colors text-sm font-semibold shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 -mt-20 relative bg-white rounded-t-3xl pt-8 pb-12 shadow-sm min-h-[500px]">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${restaurant.classification === 'LOCAL_FAVORITE' ? 'bg-[#db7706]' : 'bg-gray-800'}`}>
                {restaurant.classification === 'LOCAL_FAVORITE' ? 'Local Favorite' : 'Tourist Spot'}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold bg-gray-100 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 text-[#db7706] fill-[#db7706]" /> {rating}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-[#1c1917] mb-2">{restaurant.name}</h1>

            <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-6">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {restaurant.address}
              </div>
              <div className="flex items-center gap-1">
                <Utensils className="w-4 h-4" />
                {restaurant.cuisine_type?.[0] || "Vietnamese"}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {priceSymbol}
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">
                  Experience authentic {restaurant.cuisine_type?.[0]?.toLowerCase() || 'local'} flavors at {restaurant.name}.
                  This spot is rated as a {restaurant.classification?.replace('_', ' ').toLowerCase()} with an authenticity score of {Math.round((restaurant.authenticity_score || 0.8) * 100)}%.
                </p>
              </section>

              {restaurant.cuisine_type && (
                <section>
                  <h2 className="text-xl font-bold mb-3">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine_type.map((tag: string) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="w-full md:w-[320px] shrink-0 space-y-4">
            <div className="p-6 border rounded-2xl bg-gray-50">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" /> Opening Hours
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex justify-between"><span>Mon-Sun</span> <span>10:00 AM - 10:00 PM</span></p>
                <p className="text-xs text-gray-400 mt-2 italic">* Approximate hours</p>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-bold bg-[#db7706] hover:bg-[#b45309]">
              Get Directions
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

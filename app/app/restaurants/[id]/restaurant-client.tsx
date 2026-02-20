"use client";

import { useLanguage } from "@/lib/i18n-context";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, Star, Utensils, DollarSign, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Restaurant } from "@/lib/supabase";
import { getCityIdFromPathname, withCityParam } from "@/lib/city-url";

interface RestaurantClientProps {
  initialRestaurant: any; // Type 'any' for now to match flexible schema, eventually 'Restaurant'
}

export function RestaurantClient({ initialRestaurant }: RestaurantClientProps) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const cityId = getCityIdFromPathname(pathname) || searchParams.get('city');
  const [restaurant] = useState<any>(initialRestaurant);

  if (!restaurant) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">{t('restaurant.notFound')}</h1>
        <Link href={withCityParam('/', cityId)} className="text-primary hover:underline mt-4 inline-block">
          {t('restaurant.backHome')}
        </Link>
      </div>
    );
  }

  // Derived data
  const rating = restaurant.google_rating ||
    (restaurant.authenticity_score ? Number((3 + restaurant.authenticity_score * 2).toFixed(1)) : 4.5);

  const priceSymbol = ["$", "$$", "$$$", "$$$$"][(restaurant.price_level || 1) - 1] || "$";

  // Use first image or fallback
  const heroImage = restaurant.images?.[0] || "https://images.pinterest.com/originals/94/a3/52/94a3525166dc7e224e756816040445d4.jpg"; // Updated pinterest fallback if needed

  const details = restaurant.authenticity_details || {};
  const badgeLabel = details.badgeLabel ||
    (restaurant.classification === 'LOCAL_FAVORITE' ? 'Local Favorite' : 'Tourist Spot');

  const signals = details.signals || [];

  // Dynamic Content Summary
  const aiSummary = language === 'vi'
    ? (restaurant.ai_summary_vi || restaurant.ai_summary_en)
    : (restaurant.ai_summary_en || restaurant.ai_summary_vi);

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header Image */}
      <div className="relative h-[40vh] w-full bg-gray-100">
        <img
          src={heroImage}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-6 left-6 z-10">
          <Link href={withCityParam(collectionId ? `/collections/${collectionId}` : "/", cityId)} className="bg-white/90 p-2 rounded-full flex items-center gap-2 hover:bg-white transition-colors text-sm font-semibold shadow-sm backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4" /> {t('common.viewAll')}
          </Link>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 -mt-20 relative bg-white rounded-t-3xl pt-8 pb-12 shadow-sm min-h-[500px]">
        <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex-1 space-y-8">
            {/* Header Section */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${restaurant.classification === 'LOCAL_FAVORITE' || details.score >= 0.6 ? 'bg-primary' : 'bg-gray-800'
                  }`}>
                  {t(badgeLabel as any) || badgeLabel}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold bg-gray-100 px-2 py-1 rounded-full">
                  <Star className="w-3 h-3 text-primary fill-primary" /> {rating} ({restaurant.google_user_ratings_total || 0})
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
                  <Hash className="w-5 h-5 text-primary" /> {t('restaurant.authenticitySignal')}
                </h2>
                <div className="grid gap-3">
                  {signals.map((signal: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100/50">
                      <span className="text-xl shrink-0">{signal.icon}</span>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{t(signal.name as any) || signal.name}</div>
                        <div className="text-sm text-gray-500">{signal.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {aiSummary && (
                  <p className="mt-4 text-sm text-gray-600 italic border-t pt-4">
                    "{aiSummary}"
                  </p>
                )}
              </section>
            )}

            {/* About & Tags */}
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-bold mb-3">{t('restaurant.about')}</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {t('restaurant.aboutTemplate').replace('{name}', restaurant.name)}
                  {aiSummary ? ` ${aiSummary}` : ''}
                </p>
              </section>

              {restaurant.cuisine_type && (
                <section>
                  <h2 className="text-xl font-bold mb-3">{t('restaurant.cuisineTags')}</h2>
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
                <h2 className="text-xl font-bold mb-4">{t('restaurant.gallery')}</h2>
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
              <div className="p-6 border border-gray-100 rounded-3xl bg-white shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-gray-400" /> {t('restaurant.openingHours')}
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {restaurant.opening_hours.weekday_text?.map((day: string) => {
                    const [d, t] = day.split(': ', 2);
                    return (
                      <div key={day} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 last:pb-0">
                        <span className="font-medium text-gray-900">{d}</span>
                        <span className="text-gray-500">{t}</span>
                      </div>
                    );
                  }) || (
                      <p className="text-gray-500 italic">{t('restaurant.hoursUnavailable')}</p>
                    )}
                </div>
                {restaurant.opening_hours.open_now !== undefined && (
                  <div className={`mt-5 text-center py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${restaurant.opening_hours.open_now ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className={`w-2 h-2 rounded-full ${restaurant.opening_hours.open_now ? 'bg-green-500' : 'bg-red-500'}`} />
                    {restaurant.opening_hours.open_now ? t('restaurant.openNow') : t('restaurant.closed')}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 rounded-xl"
                onClick={() => {
                  const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                }}
              >
                {t('restaurant.getDirections')}
              </Button>
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full h-12 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  {t('restaurant.visitWebsite')}
                </a>
              )}
              {restaurant.phone_number && (
                <a
                  href={`tel:${restaurant.phone_number}`}
                  className="flex items-center justify-center w-full h-12 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                >
                  {t('restaurant.call')} {restaurant.phone_number}
                </a>
              )}
            </div>

            {/* Location Map */}
            <div className="rounded-3xl overflow-hidden border border-gray-100 h-[240px] shadow-sm relative z-0">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

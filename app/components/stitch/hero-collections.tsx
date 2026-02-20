"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Collection } from "@/lib/supabase";
import { useLanguage } from "@/lib/i18n-context";
import { CollectionCard } from "./collection-card"; // Import the new card

export interface HeroCollectionProps extends Collection {
  restaurant_count?: number;
}

const FALLBACK_COLLECTIONS: HeroCollectionProps[] = [];

export function HeroCollections({ collections }: { collections?: HeroCollectionProps[] }) {
  const { t } = useLanguage();
  const displayCollections = collections || [];

  if (displayCollections.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-[#1c1917]">
              {t('collections.title')}
            </h2>
            <p className="text-gray-500 mt-1">
              {t('collections.subtitle')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-primary-light/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('collections.empty.title')}</h3>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1c1917]">
            {t('collections.title')}
          </h2>
          <p className="text-gray-500 mt-1">
            {t('collections.subtitle')}
          </p>
        </div>
      </div>
      <div className="masonry">
        {displayCollections.map((collection) => (
          <div key={collection.id} className="masonry-item break-inside-avoid mb-6 h-full">
            <CollectionCard collection={collection} />
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";

interface CollectionHeaderProps {
  collection: {
    name?: string; // Legacy/Fallback
    name_vi?: string | null;
    name_en?: string | null;
    description?: string | null;
    description_vi?: string | null;
    description_en?: string | null;
    creator_name?: string | null;
    source_url?: string;
  };
  coverImage: string;
  coverImageSrcSet?: string;
}

export function CollectionHeader({ collection, coverImage, coverImageSrcSet }: CollectionHeaderProps) {
  const { getI18nText, t } = useLanguage();

  return (
    <div className="relative min-h-[60vh] md:min-h-[40vh] w-full bg-black flex flex-col justify-end">
      {/* Background Image & Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={coverImage}
          srcSet={coverImageSrcSet}
          sizes="100vw"
          alt={getI18nText(collection, 'name')}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors text-sm font-semibold text-white border border-white/20">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Link>
      </div>

      <div className="relative z-10 w-full p-6 pt-20 pb-12 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <span className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block shadow-sm">
              {t('collection.curatedBy').replace('{name}', collection.creator_name || "Authentik")}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
              {getI18nText(collection, 'name')}
            </h1>
            {getI18nText(collection, 'description') && (
              <p className="text-lg text-gray-200 font-medium max-w-2xl drop-shadow-sm leading-relaxed">
                {getI18nText(collection, 'description')}
              </p>
            )}
          </div>

          {/* Video source button */}
          {collection.source_url && (
            <div className="flex-shrink-0">
              <a
                href={collection.source_url}
                target="_blank"
                rel="noreferrer"
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors text-sm font-semibold text-white border border-white/20 w-fit"
              >
                ▶ Watch Video
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

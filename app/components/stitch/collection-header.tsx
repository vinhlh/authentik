"use client";

import Link from "next/link";
import { ArrowLeft, Share2, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n-context";
import { useState } from "react";

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
  coverImage?: string | null;
  coverImageSrcSet?: string;
}

export function CollectionHeader({ collection, coverImage, coverImageSrcSet }: CollectionHeaderProps) {
  const { getI18nText, t } = useLanguage();
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const hasImage = !!coverImage;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className={`relative w-full flex flex-col justify-end ${hasImage ? 'min-h-[60vh] md:min-h-[40vh] bg-black' : 'min-h-[200px] md:min-h-[280px] bg-[#1c1917]'}`}>
      {/* Background Image & Gradient */}
      {hasImage && (
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
      )}

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

          <div className="flex flex-shrink-0 gap-3">
            <button
              onClick={handleShare}
              className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors text-sm font-semibold text-white border border-white/20 w-fit cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            {collection.source_url && (
              <a
                href={collection.source_url}
                target="_blank"
                rel="noreferrer"
                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition-colors text-sm font-semibold text-white border border-white/20 w-fit"
              >
                ▶ Watch Video
              </a>
            )}
          </div>
        </div>
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

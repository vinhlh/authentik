"use client";

import { useState, useEffect, useCallback } from "react";
import { Restaurant, RestaurantCard } from "@/components/stitch/restaurant-card";
import { CollectionMap } from "@/components/stitch/collection-map";
import { CollectionHeader } from "@/components/stitch/collection-header";
import { CollectionSection } from "@/components/stitch/collection-section";
import { Map, X } from "lucide-react";

interface CollectionContentProps {
  collection: any;
  restaurants: Restaurant[];
  coverImage: string;
  coverImageSrcSet?: string;
}

export function CollectionContent({ collection, restaurants, coverImage, coverImageSrcSet }: CollectionContentProps) {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <CollectionHeader collection={collection} coverImage={coverImage} coverImageSrcSet={coverImageSrcSet} />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <CollectionSection
          restaurants={restaurants}
          emptyMessage="No restaurants found in this collection."
        />
      </main>
    </div>
  );
}

import Link from "next/link";
import { ExternalLink, Layers } from "lucide-react";
import type { Metadata } from "next";
import { CollectionCard } from "@/components/stitch/collection-card";
import { withCityParam } from "@/lib/city-url";
import {
  DEFAULT_MARKET_CITY,
  getCollectionCityTags,
  getMarketCityById,
} from "@/lib/market-cities";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

type PageParams = Promise<{ id: string }>;

type PageSearchParams = {
  city?: string | string[];
  name?: string | string[];
  url?: string | string[];
};

type ChannelCollection = {
  id: string;
  name?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  source_url?: string | null;
  source_channel_id?: string | null;
  source_channel_name?: string | null;
  source_channel_url?: string | null;
  tags?: string[] | null;
  collection_restaurants?: { count: number }[] | null;
  restaurant_count?: number;
};

function getFirstValue(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function safeDecode(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getRestaurantCount(collection: ChannelCollection): number {
  const countData = collection.collection_restaurants;
  if (!Array.isArray(countData) || countData.length === 0) return 0;
  return countData[0]?.count || 0;
}

function createCollectionsQuery(cityTags: string[]) {
  let query = supabase
    .from("collections")
    .select("*, collection_restaurants(count), tags")
    .order("created_at", { ascending: false });

  if (cityTags.length > 0) {
    query = query.overlaps("tags", cityTags);
  }

  return query;
}

async function getChannelCollections(
  channelKey: string,
  cityTags: string[],
  requestedUrl?: string,
  requestedName?: string
): Promise<{
  collections: ChannelCollection[];
  resolvedName: string;
  resolvedUrl: string | null;
}> {
  const normalizedKey = channelKey.trim();
  const normalizedName = requestedName?.trim();
  const normalizedUrl = requestedUrl?.trim();

  const fallbackName = normalizedName || normalizedKey;

  if (!normalizedKey) {
    return {
      collections: [],
      resolvedName: fallbackName,
      resolvedUrl: normalizedUrl || null,
    };
  }

  const byIdResult = await createCollectionsQuery(cityTags)
    .eq("source_channel_id", normalizedKey);

  if (!byIdResult.error && byIdResult.data && byIdResult.data.length > 0) {
    const first = byIdResult.data[0];
    return {
      collections: byIdResult.data.map((item) => ({
        ...(item as ChannelCollection),
        restaurant_count: getRestaurantCount(item as ChannelCollection),
      })),
      resolvedName: first.source_channel_name || fallbackName,
      resolvedUrl: first.source_channel_url || normalizedUrl || null,
    };
  }

  if (normalizedUrl) {
    const byUrlResult = await createCollectionsQuery(cityTags)
      .eq("source_channel_url", normalizedUrl);

    if (!byUrlResult.error && byUrlResult.data && byUrlResult.data.length > 0) {
      const first = byUrlResult.data[0];
      return {
        collections: byUrlResult.data.map((item) => ({
          ...(item as ChannelCollection),
          restaurant_count: getRestaurantCount(item as ChannelCollection),
        })),
        resolvedName: first.source_channel_name || fallbackName,
        resolvedUrl: first.source_channel_url || normalizedUrl || null,
      };
    }
  }

  if (normalizedName) {
    const byNameResult = await createCollectionsQuery(cityTags)
      .eq("source_channel_name", normalizedName);

    if (!byNameResult.error && byNameResult.data && byNameResult.data.length > 0) {
      const first = byNameResult.data[0];
      return {
        collections: byNameResult.data.map((item) => ({
          ...(item as ChannelCollection),
          restaurant_count: getRestaurantCount(item as ChannelCollection),
        })),
        resolvedName: first.source_channel_name || fallbackName,
        resolvedUrl: first.source_channel_url || normalizedUrl || null,
      };
    }
  }

  const byKeyAsNameResult = await createCollectionsQuery(cityTags)
    .eq("source_channel_name", normalizedKey);

  if (!byKeyAsNameResult.error && byKeyAsNameResult.data && byKeyAsNameResult.data.length > 0) {
    const first = byKeyAsNameResult.data[0];
    return {
      collections: byKeyAsNameResult.data.map((item) => ({
        ...(item as ChannelCollection),
        restaurant_count: getRestaurantCount(item as ChannelCollection),
      })),
      resolvedName: first.source_channel_name || fallbackName,
      resolvedUrl: first.source_channel_url || normalizedUrl || null,
    };
  }

  return {
    collections: [],
    resolvedName: fallbackName,
    resolvedUrl: normalizedUrl || null,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
}): Promise<Metadata> {
  const { id } = await params;

  const resolvedSearchParams = searchParams
    ? typeof (searchParams as Promise<PageSearchParams>).then === "function"
      ? await (searchParams as Promise<PageSearchParams>)
      : (searchParams as PageSearchParams)
    : {};

  const channelKey = safeDecode(id) || id;
  const requestedName = safeDecode(getFirstValue(resolvedSearchParams.name));
  const titleName = requestedName || channelKey;

  return {
    title: `${titleName} Collections | Authentik`,
    description: `Browse food collections from ${titleName} on Authentik.`,
  };
}

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
}) {
  const { id } = await params;

  const resolvedSearchParams = searchParams
    ? typeof (searchParams as Promise<PageSearchParams>).then === "function"
      ? await (searchParams as Promise<PageSearchParams>)
      : (searchParams as PageSearchParams)
    : {};

  const selectedCity = getMarketCityById(getFirstValue(resolvedSearchParams.city));
  const cityTags = getCollectionCityTags(selectedCity);
  const cityForLinks =
    selectedCity.id === DEFAULT_MARKET_CITY.id ? null : selectedCity.id;

  const channelKey = safeDecode(id) || id;
  const requestedName = safeDecode(getFirstValue(resolvedSearchParams.name));
  const requestedUrl = safeDecode(getFirstValue(resolvedSearchParams.url));

  const { collections, resolvedName, resolvedUrl } = await getChannelCollections(
    channelKey,
    cityTags,
    requestedUrl,
    requestedName
  );

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8 w-full">
      <div className="mb-8">
        <Link
          href={withCityParam("/", cityForLinks)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Back to Home
        </Link>
      </div>

      <section className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-3">
            Channel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1c1917]">
            {resolvedName}
          </h1>
          <p className="mt-3 text-gray-600">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>

        {resolvedUrl && (
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Visit Channel <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </section>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-10 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-gray-100 p-3 mb-4">
            <Layers className="w-5 h-5 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1c1917] mb-2">
            No collections found for this channel
          </h2>
          <p className="text-gray-600">
            Try switching city, or check back after new collections are added.
          </p>
        </div>
      )}
    </main>
  );
}

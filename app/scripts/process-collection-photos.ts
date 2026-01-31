/**
 * Process Collection Photos
 *
 * Usage: npx tsx scripts/process-collection-photos.ts [collection_id]
 *
 * If no collection_id is provided, processes all collections that have
 * restaurants without images.
 *
 * Features:
 * - Processes all unprocessed restaurants across all collections
 * - Batches AI requests with configurable delays to avoid rate limits
 * - Updates restaurant image URLs in database after upload
 */

import * as dotenv from 'dotenv';
// Load env vars FIRST before any other imports that use them
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { getPlaceDetails } from '../lib/api/google-places';
import { processRestaurantPhotos, createSlug } from '../lib/photo-pipeline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configuration
const CONFIG = {
  maxPhotosPerRestaurant: 3,
  maxCandidatesPerRestaurant: 10,
  delayBetweenRestaurantsMs: 3000,  // 3 seconds between restaurants
  delayBetweenCollectionsMs: 5000, // 5 seconds between collections
  skipAI: true,
};

interface RestaurantToProcess {
  id: string;
  name: string;
  google_place_id: string;
  collectionSlug: string;
  collectionId: string;
}

/**
 * Get all collections
 */
async function getAllCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name_vi')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching collections:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get unprocessed restaurants for a collection
 * (restaurants that don't have images OR images array is empty/null)
 */
/**
 * Get unprocessed restaurants for a collection
 * (restaurants that don't have images OR images array is empty/null)
 * If force=true, returns ALL restaurants
 */
async function getUnprocessedRestaurants(collectionId: string, collectionName: string, force: boolean = false): Promise<RestaurantToProcess[]> {
  const { data: links, error } = await supabase
    .from('collection_restaurants')
    .select(`
      restaurant_id,
      restaurant:restaurants (
        id,
        name,
        google_place_id,
        images
      )
    `)
    .eq('collection_id', collectionId);

  if (error || !links) {
    console.error(`❌ Error fetching restaurants for ${collectionName}:`, error?.message);
    return [];
  }

  const collectionSlug = createSlug(collectionName);
  const unprocessed: RestaurantToProcess[] = [];

  for (const link of links) {
    const r = link.restaurant as any;
    if (!r || !r.google_place_id) continue;

    // Check if restaurant has no images or empty images array
    const hasImages = r.images && Array.isArray(r.images) && r.images.length > 0;

    // Process if no images OR if force mode is enabled
    if (!hasImages || force) {
      unprocessed.push({
        id: r.id,
        name: r.name,
        google_place_id: r.google_place_id,
        collectionSlug,
        collectionId,
      });
    }
  }

  return unprocessed;
}

// ... existing code ...

/**
 * Process a batch of restaurants
 */
async function processBatch(restaurants: RestaurantToProcess[]) {
  console.log(`\n🔄 Processing batch of ${restaurants.length} restaurants...\n`);

  let processed = 0;
  let failed = 0;

  for (const restaurant of restaurants) {
    console.log(`\n📸 [${processed + 1}/${restaurants.length}] Processing: ${restaurant.name}`);

    try {
      // Fetch fresh details from Google Places
      const details = await getPlaceDetails(restaurant.google_place_id);

      if (!details) {
        console.error(`   ❌ Failed to get Google Place details`);
        failed++;
        continue;
      }

      // Run Photo Pipeline
      const results = await processRestaurantPhotos(
        details,
        restaurant.collectionSlug,
        CONFIG.maxPhotosPerRestaurant,
        CONFIG.maxCandidatesPerRestaurant,
        { skipAI: CONFIG.skipAI }
      );

      if (results.length > 0) {
        // Get web paths (prefer enhanced, fallback to original)
        const imageUrls = results
          .filter(r => r.success)
          .slice(0, CONFIG.maxPhotosPerRestaurant)
          .map(r => r.webPath);

        if (imageUrls.length > 0) {
          // Update DB with image URLs
          const { error: updateError } = await supabase
            .from('restaurants')
            .update({ images: imageUrls })
            .eq('id', restaurant.id);

          if (updateError) {
            console.error(`   ❌ DB Update failed: ${updateError.message}`);
            failed++;
          } else {
            console.log(`   ✅ Updated with ${imageUrls.length} photos: ${imageUrls.join(', ')}`);
            processed++;
          }
        } else {
          console.log(`   ⚠️ No valid photos to save`);
          failed++;
        }
      } else {
        console.log(`   ⚠️ No photos found/processed`);
        failed++;
      }

    } catch (e) {
      console.error(`   ❌ Error:`, e);
      failed++;
    }

    // Rate limiting between restaurants
    if (restaurants.indexOf(restaurant) < restaurants.length - 1) {
      console.log(`   ⏳ Waiting ${CONFIG.delayBetweenRestaurantsMs / 1000}s before next...`);
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenRestaurantsMs));
    }
  }

  return { processed, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const specificCollectionId = args.find(arg => !arg.startsWith('--'));
  const forceMode = args.includes('--force');

  console.log('🖼️  Photo Processing Script');
  console.log('═══════════════════════════════════════════\n');

  if (forceMode) {
    console.log('💪 FORCE MODE ENABLED: Will re-process all restaurants\n');
  }

  let collectionsToProcess: { id: string; name_vi: string }[] = [];

  if (specificCollectionId) {
    // Process specific collection
    const { data: collection, error } = await supabase
      .from('collections')
      .select('id, name_vi')
      .eq('id', specificCollectionId)
      .single();

    if (error || !collection) {
      console.error('❌ Collection not found:', error?.message);
      process.exit(1);
    }

    collectionsToProcess = [collection];
  } else {
    // Process all collections
    collectionsToProcess = await getAllCollections();
  }

  console.log(`📚 Found ${collectionsToProcess.length} collection(s) to check\n`);

  let totalProcessed = 0;
  let totalFailed = 0;

  for (const collection of collectionsToProcess) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📂 Collection: ${collection.name_vi}`);
    console.log(`   Slug: ${createSlug(collection.name_vi)}`);

    // Get restaurants (force if requested)
    const unprocessed = await getUnprocessedRestaurants(collection.id, collection.name_vi, forceMode);

    if (unprocessed.length === 0) {
      console.log(`   ✅ All restaurants already have images`);
      continue;
    }

    console.log(`   🍽️  Found ${unprocessed.length} restaurants to process`);

    // Process the batch
    const { processed, failed } = await processBatch(unprocessed);
    totalProcessed += processed;
    totalFailed += failed;

    // Delay between collections
    if (collectionsToProcess.indexOf(collection) < collectionsToProcess.length - 1) {
      console.log(`\n⏳ Waiting ${CONFIG.delayBetweenCollectionsMs / 1000}s before next collection...`);
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenCollectionsMs));
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`✨ Done! Processed: ${totalProcessed}, Failed: ${totalFailed}`);
}

main().catch(console.error);

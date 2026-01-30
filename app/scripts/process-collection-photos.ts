
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getPlaceDetails } from '../lib/api/google-places';
import { processRestaurantPhotos, createSlug } from '../lib/photo-pipeline';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const args = process.argv.slice(2);
  const collectionId = args[0];

  if (!collectionId) {
    console.error('Usage: npx tsx scripts/process-collection-photos.ts <collection_id>');
    process.exit(1);
  }

  console.log(`🔍 Processing photos for collection: ${collectionId}`);

  // 1. Get collection name for slug
  const { data: collection, error: colError } = await supabase
    .from('collections')
    .select('name')
    .eq('id', collectionId)
    .single();

  if (colError || !collection) {
    console.error('❌ Collection not found:', colError?.message);
    process.exit(1);
  }

  const collectionSlug = createSlug(collection.name);
  console.log(`📂 Collection Slug: ${collectionSlug}`);

  // 2. Fetch restaurants in collection
  const { data: links, error: linkError } = await supabase
    .from('collection_restaurants')
    .select(`
      restaurant_id,
      restaurant:restaurants (
        id,
        name,
        google_place_id
      )
    `)
    .eq('collection_id', collectionId);

  if (linkError || !links) {
    console.error('❌ Error fetching restaurants:', linkError?.message);
    process.exit(1);
  }

  console.log(`🍽️  Found ${links.length} restaurants to process.`);

  // 3. Process each restaurant
  for (const link of links) {
    const r = link.restaurant as any;
    if (!r || !r.google_place_id) {
      console.warn(`⚠️  Skipping restaurant ${r?.name} (No Google Place ID)`);
      continue;
    }

    console.log(`\n📸 Processing: ${r.name} (${r.id})`);

    try {
      // Fetch fresh details from Google Places
      const details = await getPlaceDetails(r.google_place_id);

      if (!details) {
        console.error(`   ❌ Failed to get Google Place details for ${r.name}`);
        continue;
      }

      // Run Photo Pipeline
      // Default to 3 photos, 10 max selection, no skip AI
      const processedPhotos = await processRestaurantPhotos(details, collectionSlug, 3, 10, { skipAI: false });

      if (processedPhotos.length > 0) {
        const validPhotos = processedPhotos.map(p => p.webPath);

        // Update DB
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ images: validPhotos })
          .eq('id', r.id);

        if (updateError) {
          console.error(`   ❌ DB Update failed: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated with ${validPhotos.length} photos`);
        }
      } else {
        console.log(`   ⚠️  No suitable photos found/processed.`);
      }

      // Rate limiting / Pacing
      console.log('   ⏳ Waiting 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (e) {
      console.error(`   ❌ Error processing ${r.name}:`, e);
    }
  }

  console.log('\n✨ Done processing collection photos.');
}

main();

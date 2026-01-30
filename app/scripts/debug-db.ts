
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  console.log('🔍 Checking Database Content...\n');

  // 1. Check Collections
  const { data: collections, error: colError } = await supabase
    .from('collections')
    .select('id, name, source_url')
    .limit(5);

  if (colError) console.error('❌ Error fetching collections:', colError.message);
  else {
    console.log(`📦 Collections found: ${collections?.length}`);
    collections?.forEach(c => console.log(`   - [${c.id}] ${c.name}`));
  }

  // 2. Check Restaurants
  const { data: restaurants, error: resError } = await supabase
    .from('restaurants')
    .select('id, name')
    .limit(5);

  if (resError) console.error('❌ Error fetching restaurants:', resError.message);
  else console.log(`\n🍽️  Restaurants found (sample 5): ${restaurants?.length}`);

  // 3. Check Links for the first collection
  if (collections && collections.length > 0) {
    const colId = collections[0].id;
    console.log(`\n🔗 Checking links for collection: ${collections[0].name} (${colId})`);

    const { data: links, error: linkError } = await supabase
      .from('collection_restaurants')
      .select('*')
      .eq('collection_id', colId);

    if (linkError) console.error('❌ Error fetching links:', linkError.message);
    else {
      console.log(`   Found ${links?.length} links.`);
      if (links?.length === 0) {
        console.log('   ⚠️  This collection has NO restaurants linked!');
      } else {
        console.log('   ✅ Links exist. Sample:', links?.slice(0, 2));
      }
    }
  }
}

debug();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Wait, I might need SERVICE_ROLE_KEY to update if RLS is on?
// Assuming RLS is off or allows anon updates for now, or I'd need the service role key.
// But for MVP/local dev, it might be fine.
// The user environment only has ANON_KEY.
// If update fails, I'll need to ask user for SERVICE_ROLE_KEY or to run SQL manually.

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TAGS_MAP: Record<string, string[]> = {
  'Best Street Food in Da Nang': ['Street Food', 'Breakfast', 'Cheap Eats'],
  'Authentic Seafood Restaurants': ['Seafood', 'Dinner'],
  'Hidden Gems in Hải Châu': ['Local', 'Hidden Gem', 'Lunch'],
  'Best Mì Quảng in Town': ['Noodles', 'Breakfast', 'Lunch'],
  'Vegetarian & Vegan Spots': ['Vegetarian', 'Vegan', 'Healthy'],
  'Late Night Eats': ['Late Night', 'Street Food'],
};

async function seedTags() {
  console.log('Seeding tags...');

  // Fetch all collections
  const { data: collections, error } = await supabase.from('collections').select('*');

  if (error) {
    console.error('Error fetching collections:', error);
    return;
  }

  for (const collection of collections) {
    const tags = TAGS_MAP[collection.name] || ['General'];
    console.log(`Updating ${collection.name} with tags: ${tags.join(', ')}`);

    const { error: updateError } = await supabase
      .from('collections')
      .update({ tags })
      .eq('id', collection.id);

    if (updateError) {
      console.error(`Error updating collection ${collection.name}:`, updateError);
    }
  }

  console.log('Done seeding tags!');
}

seedTags();

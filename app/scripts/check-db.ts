
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  const { data, error } = await supabase
    .from('collections')
    .select('*, collection_restaurants(count), tags')
    .limit(1);

  if (error) {
    console.error('Error fetching collections:', error);
  } else {
    console.log('Collections with count:', JSON.stringify(data, null, 2));
  }
}

checkTables();

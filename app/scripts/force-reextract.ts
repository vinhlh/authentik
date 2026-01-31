
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔄 FORCE RE-EXTRACT: Initializing...');

  // 0. Load Environment Variables MANUALLY
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    console.log(`Loading env from: ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.warn(`⚠️  .env.local not found at ${envPath}`);
  }

  // Check critical vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase keys in environment!');
    process.exit(1);
  }

  // 1. Dynamic Import (Prevent hoisting issues)
  console.log('📦 Importing modules...');
  const { supabase } = await import('../lib/supabase');
  const { batchExtract } = await import('../lib/extraction-pipeline');

  console.log('🚀 Starting extraction for all collections...');

  // 2. Fetch all collections
  const { data: collections, error } = await supabase
    .from('collections')
    .select('id, name_vi, source_url, creator_name')
    .not('source_url', 'is', null);

  if (error || !collections) {
    console.error('❌ Failed to fetch collections:', error);
    process.exit(1);
  }

  console.log(`📋 Found ${collections.length} collections.`);

  // 3. Map to batch format
  const videos = collections.map(c => ({
    url: c.source_url!,
    creatorName: c.creator_name || 'Authentik Creator'
  }));

  // 4. Run Batch Extraction
  await batchExtract(videos, { dry: false });

  console.log('\n✅ Force Re-extract Complete!');
}

main().catch(console.error);

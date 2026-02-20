import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars. Need NEXT_PUBLIC_SUPABASE_URL and a key.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

type ParsedUpdate = {
  key: string;
  rank: number | null;
};

type CollectionListRow = {
  id: string;
  url_key: string | null;
  name_vi: string | null;
  name_en: string | null;
  display_rank: number | null;
  is_visible: boolean;
  created_at: string;
};

function parseUpdates(args: string[]): ParsedUpdate[] {
  return args.map((arg) => {
    const splitIndex = arg.lastIndexOf('=');
    if (splitIndex <= 0 || splitIndex === arg.length - 1) {
      throw new Error(`Invalid update "${arg}". Expected format: <id-or-url_key>=<rank|null>.`);
    }

    const key = arg.slice(0, splitIndex).trim();
    const rankRaw = arg.slice(splitIndex + 1).trim().toLowerCase();
    if (!key) {
      throw new Error(`Invalid key in "${arg}".`);
    }

    if (rankRaw === 'null') {
      return { key, rank: null };
    }

    const parsed = Number(rankRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`Invalid rank "${rankRaw}" in "${arg}". Rank must be a non-negative integer or null.`);
    }

    return { key, rank: parsed };
  });
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isMissingDisplayRankColumn(message: string): boolean {
  return message.includes('display_rank') && message.includes('does not exist');
}

async function applyUpdates(updates: ParsedUpdate[]) {
  for (const update of updates) {
    let query = supabase
      .from('collections')
      .update({ display_rank: update.rank })
      .select('id');
    query = looksLikeUuid(update.key)
      ? query.eq('id', update.key)
      : query.eq('url_key', update.key);

    const { data, error } = await query;

    if (error) {
      if (isMissingDisplayRankColumn(error.message)) {
        throw new Error('display_rank column is missing. Run database migrations before ranking collections.');
      }
      console.error(`Failed to update "${update.key}":`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      console.error(`No collection matched "${update.key}".`);
      continue;
    }

    console.log(`Updated "${update.key}" -> display_rank=${update.rank === null ? 'NULL' : update.rank}`);
  }
}

async function printCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('id, url_key, name_vi, name_en, display_rank, is_visible, created_at')
    .order('display_rank', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingDisplayRankColumn(error.message)) {
      throw new Error('display_rank column is missing. Run database migrations before ranking collections.');
    }
    throw new Error(`Failed to list collections: ${error.message}`);
  }

  const rows = ((data || []) as CollectionListRow[]).map((item) => ({
    display_rank: item.display_rank ?? null,
    id: item.id,
    url_key: item.url_key ?? '',
    name: item.name_en || item.name_vi || '(untitled)',
    visible: item.is_visible ? 'yes' : 'no',
    created_at: item.created_at,
  }));

  console.table(rows);
}

async function run() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await printCollections();
    console.log('\nUsage: npm run collections:rank -- <id-or-url_key>=<rank|null> [more updates]');
    return;
  }

  const updates = parseUpdates(args);
  await applyUpdates(updates);
  console.log('\nUpdated ordering:');
  await printCollections();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

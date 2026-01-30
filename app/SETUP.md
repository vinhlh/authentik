# Setup Instructions - Authentik Food Discovery

## Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Git

## Step 1: Fix NPM Cache Permissions

If you encounter permission errors, run:

```bash
sudo chown -R $(whoami) ~/.npm
```

## Step 2: Install Dependencies

```bash
cd /Users/v.le.2/Works/vinhlh/authentik/app
npm install
```

If you still encounter issues, try:

```bash
npm install --legacy-peer-deps
```

Required packages:
- `@supabase/supabase-js` - Database client
- `@trpc/server@next`, `@trpc/client@next`, `@trpc/react-query@next` - Type-safe API
- `@tanstack/react-query@latest` - Data fetching
- `zod` - Schema validation
- `mapbox-gl` - Maps
- `lucide-react` - Icons
- `class-variance-authority`, `clsx`, `tailwind-merge` - Styling utilities
- `@radix-ui/react-slot` - Component composition

## Step 3: Set Up Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Fill in the required values in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

## Step 4: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Project Settings → API to get your URL and anon key
4. Go to SQL Editor and run the migration:

```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

5. Update `.env.local` with your Supabase credentials

## Step 5: Set Up Mapbox (Optional for MVP)

1. Go to [mapbox.com](https://mapbox.com) and create an account
2. Get your access token from the Account page
3. Add it to `.env.local`

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Verify Installation

You should see:
- ✅ Home page with hero section
- ✅ Featured collections grid
- ✅ Local favorites section
- ✅ Navigation working (Collections, Map)
- ✅ All pages rendering with mock data

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors, make sure all dependencies are installed:

```bash
npm install
```

### Build Errors

Try cleaning the Next.js cache:

```bash
rm -rf .next
npm run dev
```

### Port Already in Use

If port 3000 is in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

## Next Steps

Once the app is running:

1. ✅ Verify all pages load correctly
2. ✅ Test navigation between pages
3. ✅ Check responsive design on mobile
4. 📝 Start adding real restaurant data
5. 🗺️ Integrate actual Mapbox map
6. 🚀 Deploy to Vercel

## Need Help?

Check the [README.md](file:///Users/v.le.2/Works/vinhlh/authentik/app/README.md) for more information.

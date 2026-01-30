# Authentik - Authentic Food Discovery

A curated web platform for discovering authentic local dining experiences in Da Nang, Vietnam.

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

First, fix npm cache permissions (if needed):
```bash
sudo chown -R $(whoami) ~/.npm
```

Then install dependencies:
```bash
npm install
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the required values:

```bash
cp .env.local.example .env.local
```

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and App Router
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Maps**: Mapbox GL JS
- **API**: tRPC for type-safe APIs
- **Deployment**: Vercel

## Project Structure

```
app/
├── app/                    # Next.js app directory
│   ├── (routes)/          # Page routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utilities
├── server/               # tRPC server
└── supabase/             # Database migrations
```

## Features

- 🍜 Curated restaurant collections
- 🗺️ Interactive map view
- 🌟 Local Favorite vs Tourist Spot badges
- 📱 Mobile-responsive design
- 🔍 Search and filtering

## License

MIT

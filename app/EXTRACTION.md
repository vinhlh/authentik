# Content Extraction Guide

## Overview

The Authentik platform includes powerful video parsing workers that can automatically extract restaurant information from YouTube and TikTok food review videos.

## How It Works

1. **Video Parsing**: Extracts metadata, transcripts, and on-screen text from videos
2. **AI Extraction**: Uses AI to identify restaurant mentions, dishes, and recommendations
3. **Verification**: Validates restaurants using Google Places API
4. **Classification**: Determines if restaurant is a "Local Favorite" or "Tourist Spot"
5. **Import**: Adds verified restaurants to your Supabase database
6. **Collection**: Creates a curated collection linked to the source video

---

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Google Places API (Required)
GOOGLE_PLACES_API_KEY=your_api_key_here

# YouTube Data API (Optional - for metadata)
YOUTUBE_API_KEY=your_youtube_api_key

# AI API (Choose one)
GEMINI_API_KEY=your_gemini_api_key  # Recommended: Free tier available
# OR
OPENAI_API_KEY=your_openai_api_key
```

### 2. Install Additional Dependencies

```bash
npm install tsx youtube-transcript @google/generative-ai
```

---

## Usage

### Extract from Single Video

```bash
npm run extract "https://youtube.com/watch?v=..." "Creator Name"
```

Example:
```bash
npm run extract "https://youtube.com/watch?v=dQw4w9WgXcQ" "Vinh Le"
```

### Batch Extract from Multiple Videos

1. Create a JSON file with your videos (see `videos.example.json`):

```json
[
  {
    "url": "https://youtube.com/watch?v=...",
    "creatorName": "Food Vlogger"
  },
  {
    "url": "https://tiktok.com/@user/video/123",
    "creatorName": "Local Foodie"
  }
]
```

2. Run batch extraction:

```bash
npm run extract:batch videos.json
```

---

## Supported Platforms

### ✅ YouTube
- Full metadata extraction
- Transcript parsing
- Creator attribution
- Video thumbnails

### ✅ TikTok
- Video metadata
- Description parsing
- Hashtag extraction
- On-screen text (OCR)

---

## Output

The extraction process will:

1. **Create a Collection** in your database with:
   - Video title as collection name
   - Creator attribution
   - Source URL link

2. **Import Restaurants** with:
   - Verified Google Places data
   - Address and coordinates
   - Classification (Local/Tourist)
   - Authenticity score
   - Price level
   - Cuisine types

3. **Link Restaurants to Collection** with:
   - Recommended dishes from video
   - Special notes
   - Creator recommendations

---

## Classification Algorithm

Restaurants are automatically classified as **Local Favorite** or **Tourist Spot** based on:

### Local Favorite Indicators
- ✅ High percentage of Vietnamese-language reviews (>40%)
- ✅ Lower price levels ($ or $$)
- ✅ Located in residential neighborhoods
- ✅ High rating with many reviews

### Tourist Spot Indicators
- ⚠️ Mostly English/foreign language reviews (>80%)
- ⚠️ Higher price levels ($$$ or $$$$)
- ⚠️ Near tourist attractions
- ⚠️ Listed as "tourist_attraction" type

### Authenticity Score
Each restaurant gets a score from 0-1:
- **0.8-1.0**: Highly authentic local spot
- **0.6-0.8**: Likely authentic
- **0.4-0.6**: Mixed/unclear
- **0.2-0.4**: Likely tourist-oriented
- **0.0-0.2**: Definitely tourist trap

---

## Example Workflow

### Step 1: Find Food Review Videos

Search YouTube/TikTok for:
- "Da Nang street food"
- "Where locals eat in Da Nang"
- "Authentic Vietnamese food Da Nang"
- "Hidden gems Da Nang"

### Step 2: Create Batch File

```json
[
  {
    "url": "https://youtube.com/watch?v=abc123",
    "creatorName": "Mark Wiens"
  },
  {
    "url": "https://youtube.com/watch?v=def456",
    "creatorName": "Best Ever Food Review Show"
  }
]
```

### Step 3: Run Extraction

```bash
npm run extract:batch my-videos.json
```

### Step 4: Review Results

Check your Supabase database:
- New collections created
- Restaurants imported
- Classifications assigned

### Step 5: View in App

```bash
npm run dev
```

Visit http://localhost:3000 to see your curated collections!

---

## Cost Estimates

### Google Places API
- **Text Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Photos**: Free

**Estimated cost per video**: $0.50 - $2.00 (depending on restaurant count)

### YouTube Data API
- **Free tier**: 10,000 quota units/day
- **Video details**: 1 unit per request
- **Practically free** for MVP usage

### AI Extraction (Gemini Flash)
- **Free tier**: 15 requests/minute, 1,500 requests/day
- **Practically free** for MVP usage

**Total estimated cost**: ~$5-10/month for 100-150 restaurants

---

## Troubleshooting

### "Could not fetch transcript"
- Video may not have captions/subtitles
- Try videos with auto-generated captions
- Manually add transcript if needed

### "Could not verify restaurant"
- Restaurant name may be incorrect
- Try adding address to improve matching
- Check Google Maps manually

### "Rate limit exceeded"
- Add delays between requests
- Use batch mode with built-in delays
- Upgrade API quotas if needed

### "Classification is null"
- Not enough reviews to determine
- Manually classify in database
- Add more review data

---

## Manual Override

You can manually edit restaurants in Supabase:

```sql
UPDATE restaurants
SET classification = 'LOCAL_FAVORITE',
    authenticity_score = 0.95
WHERE name = 'Quán Bún Chả Cá';
```

---

## Next Steps

1. ✅ Set up API keys
2. ✅ Find 10-15 good food review videos
3. ✅ Create batch file
4. ✅ Run extraction
5. ✅ Review and refine results
6. ✅ Launch your curated platform!

---

**Happy extracting!** 🍜

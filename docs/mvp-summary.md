# MVP Summary - Authentic Food Discovery (Da Nang)

## 🎯 Core Concept
**"Discover where Da Nang locals actually eat"** - A curated web platform that filters out fake reviews and tourist traps, surfacing authentic local dining experiences.

---

## ✅ Key Decisions Made

### 1. **Geographic Focus: Da Nang Only**
- Manageable scope (100-150 restaurants)
- Mix of local spots + tourist areas
- Growing expat/digital nomad community
- Expand to Saigon/Hanoi after validation

### 2. **Platform: Web-First**
- Faster iteration and testing
- Mobile app in Phase 2

### 3. **AI Strategy: Antigravity-Assisted**
- **$0 AI costs** - Use Antigravity (this assistant) for content extraction
- Manual workflow for MVP scale (~15-20 videos)
- Switch to automated (Gemini/Groq) when scaling beyond 500 videos

---

## 🏗️ MVP Features

### Core Functionality
1. **Curated Collections**
   - "Recommended by [Creator Name]" format
   - Extract from YouTube Da Nang food reviews
   - Your personal list + trusted locals

2. **Restaurant Cards**
   - Name, location, cuisine, price range
   - "Local Favorite" vs "Tourist Spot" badge
   - Key dishes mentioned
   - Link to Google Maps

3. **Simple Discovery**
   - Browse collections
   - Filter by neighborhood, cuisine, price
   - Search by restaurant/dish name
   - Map view with pins

---

## 🔧 Tech Stack

### Frontend
- **Next.js 14** (TypeScript, App Router)
- **Tailwind CSS + shadcn/ui**
- **Mapbox GL JS** (maps & heatmap)
- **Deployed on Vercel** (free tier)

### Backend
- **Next.js API Routes + tRPC** (type-safe API)
- **PostgreSQL** (Supabase - free tier)
- **Redis** (Upstash - free tier)

### AI/ML (MVP)
- **Antigravity** for manual content extraction ($0 cost)
- **Google Places API** for verification (~$5/month)

### Later (Phase 2)
- **Python + FastAPI** for automated extraction
- **Google Gemini 1.5 Flash** (free tier) or **Groq Llama 3.1** (free)

---

## 💰 MVP Cost: **$0/month** 🎉

| Service | Cost |
|---------|------|
| Vercel (hosting) | $0 |
| Supabase (database) | $0 |
| Upstash (Redis) | $0 |
| Google Places API | $0 (within free credit) |
| AI Extraction (Antigravity) | $0 |
| Mapbox (maps) | $0 |
| **Total** | **$0** |

---

## 🚀 Workflow: Antigravity-Assisted Extraction

### Step-by-Step Process

1. **Collect YouTube URLs**
   - Find 15-20 Da Nang food review videos
   - Focus on authentic local reviewers

2. **Extract with Antigravity**
   ```
   You: "Extract restaurants from this Da Nang food review:
         https://youtube.com/watch?v=..."

   Antigravity:
   - Quán Bún Chả Cá, 123 Trần Phú, dishes: bún chả cá
   - Nhà Hàng Bà Dưỡng, 456 Lê Duẩn, dishes: mì quảng
   [Provides structured JSON]

   You: "Looks good, save to database"
   ```

3. **Verify with Google Places API**
   - Script matches extracted names with Google Places
   - Enriches with photos, ratings, exact location
   - Caches results to avoid repeated API calls

4. **Import to Database**
   - Save to Supabase PostgreSQL
   - Link to collection (creator, source video)

5. **Repeat for 15-20 videos**
   - Target: 100-150 unique restaurants

---

## 📊 Success Metrics (Months 1-3)

- ✅ 100-150 curated restaurants (Da Nang)
- ✅ 10-15 collections
- ✅ 500+ app visits
- ✅ 5+ active curators
- ✅ 30%+ click-through to Google Maps

---

## 🎯 Next Steps

### Week 1: Setup
- [ ] Initialize Next.js project with TypeScript, Tailwind
- [ ] Set up Supabase project and database schema
- [ ] Design restaurant card UI component
- [ ] Integrate Mapbox for map view

### Week 2: Content Extraction
- [ ] Collect 15-20 Da Nang food review YouTube URLs
- [ ] Use Antigravity to extract restaurants from each video
- [ ] Build script to verify with Google Places API
- [ ] Import first 50 restaurants to database

### Week 3: Build MVP
- [ ] Create collection browse page
- [ ] Build restaurant detail page
- [ ] Implement search and filters
- [ ] Add map view with pins

### Week 4: Polish & Launch
- [ ] Add "Local Favorite" vs "Tourist Spot" badges
- [ ] Optimize for mobile responsive
- [ ] Deploy to Vercel
- [ ] Soft launch to Da Nang expat groups

---

## 🔮 Phase 2 Features (After Validation)

- User-generated collections
- Automated YouTube extraction (Python + Gemini)
- Authenticity scoring algorithm
- Heatmap visualization
- Expand to Saigon, Hanoi
- Mobile app (React Native)

---

## 💡 Why This Approach Works

1. **Zero upfront costs** - Validate idea without spending
2. **Fast to build** - Web-first, simple stack
3. **Manageable scope** - Da Nang only, 100-150 restaurants
4. **Authentic curation** - Manual quality control via Antigravity
5. **Scalable** - Easy to automate later with free AI APIs

**Ready to start building!** 🚀

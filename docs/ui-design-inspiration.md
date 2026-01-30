# UI/UX Design Inspiration & Guidelines

## 🎨 Design Philosophy

**Core Principle:** "Pinterest's Visual Discovery + Airbnb's Clean Minimalism"

### **Design Direction:**
- **Pinterest-style Masonry Grid** - Efficient, visual browsing with varied card heights
- **Airbnb's Clean Aesthetic** - Rounded corners, generous white space, minimal clutter
- **Photo-first** - Food is visual, images dominate
- **Warm & Inviting** - Vietnamese food culture colors
- **Trust-building** - Clear badges and creator attribution

### **Key Visual Elements:**
- ✅ **Masonry grid layout** (like Pinterest) - Dynamic, engaging browsing
- ✅ **Rounded corners** (12-16px border radius) - Soft, friendly feel
- ✅ **Generous padding** - Breathing room, not cramped
- ✅ **Subtle shadows** - Depth without being heavy
- ✅ **Clean typography** - Inter font, clear hierarchy
- ✅ **Warm color accents** - Orange (#D97706) for CTAs and highlights

Our design should feel:
- **Warm & Inviting** (Vietnamese food culture)
- **Clean & Modern** (Airbnb minimalism)
- **Visual & Engaging** (Pinterest browsing)
- **Trustworthy** (clear provenance of recommendations)

---

## 🌟 Top Apps to Study for Inspiration

### 1. **Airbnb Experiences** ⭐⭐⭐⭐⭐
**What to learn from them:**

**Visual Design:**
- ✅ **Rich imagery** - Large, beautiful photos dominate
- ✅ **Clear hierarchy** - Easy to scan and find what you need
- ✅ **Seamless flow** - Browse → Details → Book is effortless
- ✅ **Trust signals** - Host profiles, reviews, badges

**UI Patterns:**
- Hero images with overlaid text
- Card-based layouts for browsing
- Two-column layouts for details (text + visuals)
- Clear CTAs (Call-to-Actions)
- Calendar UI for availability

**Color Palette:**
- Warm, inviting colors
- Clean whites and subtle grays
- Accent colors for CTAs (usually pink/red)

**What we should adopt:**
- ✅ Large hero images for collections
- ✅ Creator profile cards (like host profiles)
- ✅ Clear visual hierarchy
- ✅ Trust badges ("Local Favorite" badge)

---

### 2. **Google Maps (Local Guides)** ⭐⭐⭐⭐

**What to learn from them:**

**Visual Design:**
- ✅ **Photo-heavy** - User-generated photos prominent
- ✅ **Badge system** - Local Guide badges build trust
- ✅ **Rich media** - Photos, videos, dish labels
- ✅ **Filtering** - Easy to filter by cuisine, price, dietary needs

**UI Patterns:**
- Restaurant cards with photo, name, rating, price
- Map view with pins
- Photo galleries
- Review snippets with user avatars
- "Explore" and "For You" tabs for personalization

**What we should adopt:**
- ✅ Badge system for curators (like Local Guide badges)
- ✅ Photo galleries for restaurants
- ✅ Map view with color-coded pins (local vs tourist)
- ✅ Filtering by cuisine, price, neighborhood

---

### 3. **Pinterest** ⭐⭐⭐⭐

**What to learn from them:**

**Visual Design:**
- ✅ **Masonry grid layout** - Efficient use of space
- ✅ **Image-first** - Photos are the primary content
- ✅ **Collections (Boards)** - Users save to curated lists
- ✅ **Infinite scroll** - Seamless browsing

**UI Patterns:**
- Card-based masonry grid
- Save to collection functionality
- Visual bookmarking
- Related content suggestions

**What we should adopt:**
- ✅ Masonry grid for restaurant browsing
- ✅ "Save to collection" feature (Phase 2)
- ✅ Visual-first approach

---

### 4. **Spotify (Playlists)** ⭐⭐⭐

**What to learn from them:**

**Visual Design:**
- ✅ **Curated playlists** - "Made for You", "Discover Weekly"
- ✅ **Creator attribution** - Clear who made the playlist
- ✅ **Cover art** - Visual identity for each playlist
- ✅ **Dark mode** - Modern, sleek aesthetic

**UI Patterns:**
- Horizontal scrolling carousels
- Playlist cards with cover art
- Creator profiles
- "Follow" functionality

**What we should adopt:**
- ✅ Collection cards with cover images
- ✅ "Recommended by [Creator]" attribution
- ✅ Horizontal scrolling for collections
- ✅ Follow curators (Phase 2)

---

### 5. **Instagram (Explore)** ⭐⭐⭐

**What to learn from them:**

**Visual Design:**
- ✅ **Grid layout** - Clean, organized
- ✅ **Stories** - Ephemeral content at top
- ✅ **Hashtags** - Discoverability
- ✅ **User profiles** - Strong creator identity

**UI Patterns:**
- Grid of photos
- Profile pages with bio and posts
- Engagement metrics (likes, comments)
- Search and explore

**What we should adopt:**
- ✅ Grid layout for restaurant photos
- ✅ Creator profile pages
- ✅ Search by tags (cuisine, neighborhood)

---

## 🎨 Recommended Design System

### **shadcn/ui + Tailwind CSS**

**Why this combination?**
- ✅ **Beautiful out-of-the-box** - Modern, clean components
- ✅ **Highly customizable** - Easy to match brand
- ✅ **Accessible** - WCAG compliant
- ✅ **Copy-paste components** - No npm bloat
- ✅ **Dark mode ready** - Built-in support

**Key Components to Use:**
- `Card` - Restaurant cards, collection cards
- `Badge` - "Local Favorite", "Tourist Spot" labels
- `Avatar` - Creator profiles
- `Button` - CTAs
- `Dialog` - Restaurant details modal
- `Tabs` - Switch between List/Map view
- `Input` - Search bar
- `Select` - Filters (cuisine, price)

---

## 🎨 Color Palette Recommendations

### **Option 1: Warm & Authentic (Vietnamese-inspired)**

```css
/* Primary Colors */
--primary: #D97706;        /* Warm orange (like bánh mì crust) */
--primary-dark: #B45309;   /* Darker orange */
--primary-light: #FCD34D;  /* Light yellow */

/* Accent Colors */
--accent: #DC2626;         /* Red (like chili) */
--accent-green: #059669;   /* Green (like herbs) */

/* Neutrals */
--background: #FAFAF9;     /* Off-white */
--card: #FFFFFF;           /* Pure white */
--text: #1C1917;           /* Almost black */
--text-muted: #78716C;     /* Gray */

/* Badges */
--local-badge: #059669;    /* Green for "Local Favorite" */
--tourist-badge: #3B82F6;  /* Blue for "Tourist Spot" */
```

### **Option 2: Modern & Clean (Airbnb-inspired)**

```css
/* Primary Colors */
--primary: #FF385C;        /* Airbnb pink */
--primary-dark: #E31C5F;   /* Darker pink */
--primary-light: #FF5A5F;  /* Light pink */

/* Neutrals */
--background: #FFFFFF;     /* Pure white */
--card: #F7F7F7;           /* Light gray */
--text: #222222;           /* Dark gray */
--text-muted: #717171;     /* Medium gray */

/* Badges */
--local-badge: #00A699;    /* Teal for "Local Favorite" */
--tourist-badge: #FC642D;  /* Orange for "Tourist Spot" */
```

**Recommendation:** Start with **Option 1 (Warm & Authentic)** - it's more unique and culturally relevant.

---

## 📐 Layout Patterns

### **Core Layout: Pinterest Masonry Grid + Airbnb Clean**

**Key Principles:**
- Masonry grid for dynamic, engaging browsing
- Rounded corners (12-16px) everywhere
- Generous white space (24-32px padding)
- Subtle shadows (0 2px 8px rgba(0,0,0,0.08))
- Clean, minimal header and navigation

---

### **1. Home Page - Masonry Grid**

```
┌─────────────────────────────────────────────────────────┐
│  Logo              🔍 Search Da Nang...      [Login]    │ ← Clean Header (sticky)
│                                                         │   White bg, subtle shadow
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🎯 Discover Authentic Da Nang Food                     │ ← Hero (optional)
│  Where locals actually eat                              │   Minimal, centered
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Featured Collections                    [View All →]   │
│  ┌────────┐ ┌────────┐ ┌────────┐                      │ ← Horizontal Scroll
│  │ Square │ │ Square │ │ Square │  →                   │   Rounded cards
│  │  Card  │ │  Card  │ │  Card  │                      │
│  └────────┘ └────────┘ └────────┘                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Local Favorites                         [Filters ▼]    │
│                                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐                         │ ← Masonry Grid
│  │      │  │ Tall │  │      │                         │   3 columns (desktop)
│  │Short │  │ Card │  │Short │                         │   2 columns (tablet)
│  │ Card │  │      │  │ Card │                         │   1 column (mobile)
│  └──────┘  │      │  └──────┘                         │
│            └──────┘                                    │   Cards have varying
│  ┌──────┐  ┌──────┐  ┌──────┐                         │   heights based on
│  │ Tall │  │      │  │ Tall │                         │   content
│  │ Card │  │Short │  │ Card │                         │
│  │      │  │ Card │  │      │                         │   Rounded corners
│  │      │  └──────┘  │      │                         │   Subtle shadows
│  └──────┘            └──────┘                         │   Generous spacing
│                                                         │
│  [Load More]                                            │
└─────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Use CSS Grid with `grid-template-rows: masonry` or library like `react-masonry-css`
- Gap between cards: 16-24px
- Card padding: 0 (image edge-to-edge), content padding: 16-20px
- Rounded corners: 12-16px
- Shadow: `0 2px 8px rgba(0,0,0,0.08)` on hover: `0 4px 16px rgba(0,0,0,0.12)`

---

### **2. Restaurant Card (Masonry Item)**

**Visual Design:**
```
┌────────────────────────┐
│                        │
│    Food Photo          │ ← Edge-to-edge image
│    (aspect varies)     │   Rounded top corners
│                        │
├────────────────────────┤
│  Quán Bún Chả Cá      │ ← Bold, 18-20px
│  🌟 Local Favorite    │ ← Green rounded badge
│  Vietnamese • $$       │ ← Gray, 14px
│  📍 Hải Châu          │ ← Gray, 14px
│                        │
└────────────────────────┘
```

**Specifications:**
- Border radius: 12-16px
- Image: Natural aspect ratio (not forced)
- Padding: 16-20px (content area only)
- Shadow: Subtle, increases on hover
- Background: Pure white (#FFFFFF)
- Transition: All 200ms ease

**Code Example:**
```jsx
<div className="rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
  <img
    src={photo}
    alt={name}
    className="w-full h-auto object-cover"
  />
  <div className="p-5">
    <h3 className="font-semibold text-lg mb-2">{name}</h3>
    <Badge className="bg-green-600 text-white rounded-full mb-2">
      🌟 Local Favorite
    </Badge>
    <p className="text-gray-600 text-sm">{cuisine} • {price}</p>
    <p className="text-gray-500 text-sm">📍 {neighborhood}</p>
  </div>
</div>
```

---

### **3. Collection Card (Square, for Horizontal Scroll)**

**Visual Design:**
```
┌──────────────────┐
│                  │
│  Cover Image     │ ← Square (1:1)
│  (gradient       │   Rounded corners
│   overlay)       │
│                  │
│  Collection Name │ ← White text overlay
│  by Creator      │   Bottom of image
└──────────────────┘
```

**Specifications:**
- Aspect ratio: 1:1 (square)
- Size: 280x280px (desktop), 240x240px (mobile)
- Border radius: 16px
- Gradient overlay: `linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))`
- Text: White, bold, positioned at bottom

---

### **4. Collection Detail Page**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│            Collection Cover Image                       │ ← Hero, 16:9 aspect
│            (rounded corners)                            │   Rounded 16px
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  👤 Avatar  Recommended by Vinh Le                      │ ← Creator Card
│             "My favorite local spots in Da Nang"        │   Clean, minimal
│             15 restaurants • Vietnamese                  │   Rounded
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Restaurants                                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📸 Photo  | Quán Bún Chả Cá                      │  │ ← List view
│  │           | 🌟 Local Favorite                    │  │   (not masonry)
│  │           | Vietnamese • $$ • Hải Châu           │  │   Easier to scan
│  │           | Bún chả cá, nem lụi                  │  │   Rounded cards
│  └──────────────────────────────────────────────────┘  │   Generous spacing
│                                                         │
│  [More cards...]                                        │
└─────────────────────────────────────────────────────────┘
```

**Note:** Collection detail uses **list view** (not masonry) for easier scanning of all restaurants.

---

### **5. Restaurant Detail Page**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back                                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ○ ○ ○ ○                                                │ ← Photo Carousel
│  ┌───────────────────────────────────────────────────┐  │   Dots indicator
│  │                                                   │  │   Swipeable
│  │         Main Photo (16:9)                         │  │   Rounded 16px
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Quán Bún Chả Cá                                        │ ← Content Card
│  🌟 Local Favorite  💰💰 Moderate                       │   White bg
│                                                         │   Rounded
│  📍 123 Trần Phú, Hải Châu, Da Nang                    │   Generous padding
│  🕐 7:00 AM - 9:00 PM                                   │
│  🍜 Vietnamese • Seafood                                │
│                                                         │
│  ───────────────────────────────────────────────────    │
│                                                         │
│  🌟 Recommended Dishes                                  │
│  • Bún chả cá (Fish cake noodle soup)                   │
│  • Nem lụi (Grilled pork skewers)                       │
│                                                         │
│  ───────────────────────────────────────────────────    │
│                                                         │
│  📺 Featured in                                         │
│  • "Da Nang Street Food" by Food Vlog                   │
│  • "Local Favorites" by Vinh Le                         │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  [Open in Google Maps]          [❤️ Save]              │ ← CTAs
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- All sections in rounded white cards
- Generous spacing between sections (24-32px)
- Clean, scannable layout
- CTAs are prominent, rounded buttons

---

## 🎯 Key UI Components

### **1. Restaurant Card**

```jsx
<Card>
  <img src={photo} alt={name} className="aspect-video object-cover" />
  <CardContent>
    <h3>{name}</h3>
    <Badge variant={isLocal ? "local" : "tourist"}>
      {isLocal ? "🌟 Local Favorite" : "🏖️ Tourist Spot"}
    </Badge>
    <p className="text-muted">{cuisine} • {priceLevel}</p>
    <p className="text-sm">{neighborhood}</p>
  </CardContent>
</Card>
```

**Design Notes:**
- Photo should be 16:9 aspect ratio
- Badge should be prominent (green for local, blue for tourist)
- Include cuisine type and price level
- Show neighborhood for context

---

### **2. Collection Card**

```jsx
<Card className="cursor-pointer hover:shadow-lg transition">
  <img src={coverImage} alt={name} className="aspect-square object-cover" />
  <CardContent>
    <h3>{name}</h3>
    <div className="flex items-center gap-2">
      <Avatar src={creator.photo} />
      <span className="text-sm">by {creator.name}</span>
    </div>
    <p className="text-muted">{restaurantCount} restaurants</p>
  </CardContent>
</Card>
```

**Design Notes:**
- Square cover image (1:1 aspect ratio)
- Creator attribution with avatar
- Restaurant count for context
- Hover effect for interactivity

---

### **3. Creator Profile Card**

```jsx
<Card>
  <div className="flex items-center gap-4">
    <Avatar src={photo} size="lg" />
    <div>
      <h3>{name}</h3>
      <Badge>✓ Verified Local</Badge>
      <p className="text-muted">{bio}</p>
    </div>
  </div>
</Card>
```

**Design Notes:**
- Large avatar for personality
- Verification badge for trust
- Short bio (1-2 sentences)

---

### **4. Badge System**

```jsx
// Local Favorite Badge
<Badge className="bg-green-600 text-white">
  🌟 Local Favorite
</Badge>

// Tourist Spot Badge
<Badge className="bg-blue-600 text-white">
  🏖️ Tourist Spot
</Badge>

// Verified Curator Badge
<Badge className="bg-purple-600 text-white">
  ✓ Verified Local
</Badge>
```

**Design Notes:**
- Use emojis for visual interest
- Color-coded (green = local, blue = tourist, purple = verified)
- Clear, concise labels

---

## 📱 Responsive Design

### **Mobile-First Approach**

**Breakpoints:**
```css
/* Mobile: < 640px (default) */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */
```

**Mobile Optimizations:**
- Stack cards vertically (1 column)
- Larger tap targets (min 44px)
- Bottom navigation bar
- Swipeable photo galleries
- Sticky search bar

**Desktop Optimizations:**
- Grid layout (3-4 columns)
- Sidebar navigation
- Hover effects
- Larger images

---

## 🎨 Typography

**Font Recommendations:**

```css
/* Primary Font (Headings) */
font-family: 'Inter', sans-serif;
/* Clean, modern, highly readable */

/* Secondary Font (Body) */
font-family: 'Inter', sans-serif;
/* Use same font for consistency */

/* Vietnamese Support */
/* Inter has excellent Vietnamese character support */
```

**Type Scale:**
```css
--text-xs: 0.75rem;    /* 12px - Metadata */
--text-sm: 0.875rem;   /* 14px - Body small */
--text-base: 1rem;     /* 16px - Body */
--text-lg: 1.125rem;   /* 18px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Card titles */
--text-2xl: 1.5rem;    /* 24px - Page titles */
--text-3xl: 1.875rem;  /* 30px - Hero */
```

---

## ✨ Micro-interactions

**Add delight with subtle animations:**

1. **Card Hover** - Slight lift + shadow
2. **Button Press** - Scale down slightly
3. **Badge Appear** - Fade in + slide
4. **Photo Gallery** - Smooth swipe
5. **Map Pins** - Bounce on load
6. **Save Button** - Heart animation

**Implementation:**
```jsx
// Using Framer Motion
<motion.div
  whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
  transition={{ duration: 0.2 }}
>
  <RestaurantCard />
</motion.div>
```

---

## 🎯 Design Resources

### **Where to Find Inspiration:**

1. **Dribbble** - Search "food app", "restaurant discovery"
2. **Behance** - Search "travel app", "local recommendations"
3. **Mobbin** - Browse real app screenshots (Airbnb, Google Maps)
4. **Land-book** - Web design inspiration
5. **Awwwards** - Award-winning web designs

### **Component Libraries:**

1. **shadcn/ui** - https://ui.shadcn.com/
2. **Tailwind UI** - https://tailwindui.com/ (paid, but great)
3. **Headless UI** - https://headlessui.com/ (free)

### **Icon Sets:**

1. **Lucide Icons** - https://lucide.dev/ (recommended)
2. **Heroicons** - https://heroicons.com/
3. **Phosphor Icons** - https://phosphoricons.com/

---

## 🚀 Next Steps

1. **Create Mood Board** - Collect screenshots from Airbnb, Google Maps, Pinterest
2. **Design System Setup** - Install shadcn/ui, configure colors
3. **Component Library** - Build Restaurant Card, Collection Card, Badge
4. **Prototype** - Create Figma mockups (or code directly)
5. **User Testing** - Show to 5-10 Da Nang expats for feedback

---

## 💡 Key Takeaways

**What makes great food discovery UI:**
1. ✅ **Photo-first** - Food is visual, show it prominently
2. ✅ **Trust signals** - Badges, creator profiles, verification
3. ✅ **Clear hierarchy** - Easy to scan and find what you need
4. ✅ **Seamless flow** - Browse → Details → Action (Google Maps)
5. ✅ **Filtering** - Easy to narrow down by cuisine, price, location
6. ✅ **Collections** - Curated lists are more trustworthy than generic search
7. ✅ **Mobile-optimized** - Most users will be on phones

**Our unique design elements:**
- 🌟 **"Local Favorite" vs "Tourist Spot" badges** (no one else has this!)
- 👤 **Creator attribution** (like Spotify playlists)
- 📺 **Video source links** (transparency)
- 🗺️ **Color-coded map pins** (visual local vs tourist)

Ready to start designing! 🎨

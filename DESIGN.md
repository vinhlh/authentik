# Design System - Authentic Food Discovery

## 1. Design Philosophy

**Core Principle:** Pinterest's Visual Discovery + Airbnb's Clean Minimalism

Combining Pinterest's engaging masonry grid layout with Airbnb's clean, rounded, minimal aesthetic to create a warm, trustworthy, and visually appealing food discovery experience.

---

## 2. Color Palette

### Primary Colors
```
Orange (Primary):    #D97706  /* Warm, inviting - like bánh mì crust */
Orange Dark:         #B45309  /* Darker accent */
Orange Light:        #FCD34D  /* Light yellow highlight */
```

### Accent Colors
```
Red (Accent):        #DC2626  /* Like chili - for CTAs */
Green (Local):       #059669  /* For "Local Favorite" badges */
Blue (Tourist):      #3B82F6  /* For "Tourist Spot" badges */
```

### Neutrals
```
Background:          #FAFAF9  /* Off-white, warm */
Card Background:     #FFFFFF  /* Pure white */
Text Primary:        #1C1917  /* Almost black */
Text Secondary:      #78716C  /* Gray for metadata */
Border:              #E7E5E4  /* Subtle borders */
```

---

## 3. Typography

**Font Family:** Inter (sans-serif)
- Clean, modern, highly readable
- Excellent Vietnamese character support

**Type Scale:**
```
Hero:         30px / 1.875rem (font-bold)
Page Title:   24px / 1.5rem (font-bold)
Card Title:   20px / 1.25rem (font-semibold)
Subheading:   18px / 1.125rem (font-medium)
Body:         16px / 1rem (font-normal)
Small:        14px / 0.875rem (font-normal)
Tiny:         12px / 0.75rem (font-normal)
```

---

## 4. Spacing & Layout

**Border Radius:**
- Cards: 16px
- Buttons: 12px
- Badges: 20px (fully rounded)
- Images: 12px (top corners only for cards)

**Padding:**
- Card content: 20px
- Section spacing: 32px
- Grid gap: 20px

**Shadows:**
```
Default:  0 2px 8px rgba(0,0,0,0.08)
Hover:    0 4px 16px rgba(0,0,0,0.12)
Elevated: 0 8px 24px rgba(0,0,0,0.16)
```

---

## 5. Components

### Restaurant Card (Masonry Item)
- White background (#FFFFFF)
- 16px border radius
- Edge-to-edge image at top (natural aspect ratio)
- 20px padding for content area
- Subtle shadow, increases on hover
- Transition: all 200ms ease

**Structure:**
```
┌────────────────────────┐
│    Food Photo          │ ← Natural aspect
├────────────────────────┤
│  Restaurant Name       │ ← Bold, 20px
│  🌟 Local Favorite    │ ← Green badge
│  Vietnamese • $$       │ ← Gray, 14px
│  📍 Hải Châu          │ ← Gray, 14px
└────────────────────────┘
```

### Badge
- Rounded pill shape (border-radius: 20px)
- Padding: 6px 12px
- Font size: 14px
- Font weight: 500 (medium)

**Variants:**
- Local Favorite: Green (#059669) bg, white text
- Tourist Spot: Blue (#3B82F6) bg, white text

### Button (CTA)
- Border radius: 12px
- Padding: 12px 24px
- Font size: 16px
- Font weight: 600 (semibold)
- Transition: all 200ms

**Variants:**
- Primary: Orange (#D97706) bg, white text
- Secondary: White bg, orange border, orange text

---

## 6. Design System Notes for Stitch Generation

**CRITICAL: Include this block in every Stitch prompt**

```
DESIGN SYSTEM:

Visual Style: Pinterest masonry grid + Airbnb clean minimalism

Colors:
- Primary Orange: #D97706
- Green (Local badge): #059669
- Blue (Tourist badge): #3B82F6
- Background: #FAFAF9
- Card: #FFFFFF (white)
- Text: #1C1917 (dark gray)
- Text Secondary: #78716C (gray)

Typography:
- Font: Inter, sans-serif
- Sizes: Hero 30px, Title 24px, Card Title 20px, Body 16px, Small 14px

Layout:
- Border radius: 16px for cards, 12px for buttons, 20px for badges
- Padding: 20px inside cards, 32px between sections
- Shadows: subtle (0 2px 8px rgba(0,0,0,0.08)), hover (0 4px 16px rgba(0,0,0,0.12))
- Grid gap: 20px

Components:
- Restaurant cards: White bg, rounded corners, edge-to-edge images, subtle shadows
- Badges: Rounded pills, green for "Local Favorite", blue for "Tourist Spot"
- Buttons: Rounded, orange primary, white secondary
- Masonry grid: 3 columns desktop, 2 tablet, 1 mobile, varying card heights

Style: Clean, minimal, warm, photo-first, generous white space, rounded corners everywhere
```

---

## 7. Responsive Breakpoints

```
Mobile:  < 640px  (1 column masonry)
Tablet:  640-1024px (2 columns masonry)
Desktop: > 1024px (3 columns masonry)
```

---

## 8. Interaction Patterns

**Hover States:**
- Cards: Lift slightly (translateY(-4px)) + increase shadow
- Buttons: Darken background by 10%
- Links: Underline appears

**Transitions:**
- All: 200ms ease
- Smooth, subtle, not jarring

**Loading States:**
- Skeleton screens with subtle shimmer
- Maintain layout to prevent shift

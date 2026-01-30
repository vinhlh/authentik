# Content Discovery Strategy: Finding Authentic Food Gems

To build a truly "Authentik" platform, we need a consistent pipeline of high-quality source material. We cannot rely on random searching. We need a targeted strategy to find "Quality Collections" (like videos from Best Ever Food Review Show, Mark Wiens, or trusted local vloggers).

## 1. The "Quality Signals" Framework

How do we define a "quality" source video?
*   **Narrative Dept**: Does the creator explain *why* it's good (history, ingredients, owner's story)?
*   **Local Validation**: Check comments. Do locals say "Yes, this place is legible" or "Tourist trap"?
*   **Specificity**: Avoid "Top 10 Food in Da Nang". Look for "The Only Banh Mi You Need" or "Hidden Alleyway Seafood".

## 2. Automated Discovery Channels

### A. YouTube API Scrapers
Build a worker to monitor specific queries and channels.

*   **Target Channels**:
    *   *Best Ever Food Review Show* (Sonny Side lives in Vietnam, high trust)
    *   *Mark Wiens* (Global trust)
    *   *The Food Ranger*
    *   *Max McFarlin* (Often covers very local/cheap spots in Vietnam)
    *   *Local Vietnamese Vloggers* (e.g., Khoai Lang Thang, Ninh Titou - requires Vietnamese NLP)

*   **Search Queries (English & Vietnamese)**:
    *   `"Da Nang street food hidden gem"`
    *   `"Da Nang food tour local"`
    *   `"Quán ăn ngon Đà Nẵng"` (Delicious restaurants Da Nang)
    *   `"Bánh mì ngon nhất Đà Nẵng"` (Best Banh Mi Da Nang)

### B. TikTok/Reels Hashtag Monitoring
*   **Hashtags**: `#danangfood`, `#reviewdanang`, `#ansapdanang`, `#dicungthy`
*   **Filter**: Sort by "Most Liked" in the last 30 days to catch trending spots.

### C. Community Sensing (Reddit/Facebook)
*   Monitor r/Vietnam and r/DaNang for threads like "Best food in Da Nang?".
*   Extract generic recommendations and cross-reference with Google Maps ratings.

## 3. The "Authentik" Vetting Workflow

We can build a specialized "Discovery" tool in admin:

1.  **Input**: A search query or channel ID.
2.  **Process**:
    *   Fetch latest 20 videos.
    *   **LLM Analysis**: Pass video title/thumbnail/description to Gemini.
    *   **Prompt**: "Does this video appear to focus on authentic, specific local restaurants? Rate 1-10."
3.  **Output**: A feed of "High Potential" videos for you to approve and run the extraction on.

## 4. Implementation Plan (Next Steps)

1.  **Create a `discover` worker**:
    *   `npm run discover --query="Da Nang hidden gems"`
    *   Uses YouTube Search API.
    *   Filters results using Gemini (cheap/fast) to identify "collection-worthy" videos.
    *   Saves candidates to a database table `content_candidates`.

2.  **Dashboard**:
    *   Simple admin view to see `content_candidates`.
    *   One-click "Extract Collection" button.

## 5. Specific Sources to Start With
*   *Hoi An Food Tour* by Best Ever Food Review Show
*   *Da Nang Seafood* by Max McFarlin
*   *Central Vietnam Food* by Mark Wiens

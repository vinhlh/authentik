# API Setup Guide for Authentik

This application relies on three external services to power its content extraction and verification features. Follow this guide to obtain the necessary API keys and configure your `.env.local` file.

---

## 1. Google Places API (Required for Verification)
**Purpose**: Verifies that extracted restaurants actually exist, gets their precise location, ratings, and price levels.

*   **Cost**: Paid service (free monthly credit usually covers development). Requires a billing account.
*   **Platform**: Google Cloud Console.

### Steps:
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project** (e.g., "Authentik-Dev").
3.  **Enable Billing**: You must link a billing account to the project (you get $200 free credit usually).
4.  **Enable APIs**:
    *   Go to **APIs & Services** > **Library**.
    *   Search for "Places API (New)" or "Places API".
    *   Click **Enable**.
5.  **Create Credentials**:
    *   Go to **APIs & Services** > **Credentials**.
    *   Click **+ Create Credentials** > **API Key**.
    *   Copy the key.
6.  **Paste into `.env.local`**:
    ```env
    GOOGLE_PLACES_API_KEY=your_key_here
    ```

---

## 2. YouTube Data API (Required for Content Discovery)
**Purpose**: Fetches video titles, descriptions, channel names, and publication dates.

*   **Cost**: Free (generous daily quota).
*   **Platform**: Google Cloud Console (same as above).

### Steps:
1.  In the same [Google Cloud Project](https://console.cloud.google.com/) as above:
2.  **Enable API**:
    *   Go to **APIs & Services** > **Library**.
    *   Search for "YouTube Data API v3".
    *   Click **Enable**.
3.  **Create Credentials**:
    *   Go to **APIs & Services** > **Credentials**.
    *   You can reuse the same API Key from step 1, OR create a specific one for YouTube.
    *   *Recommendation*: If using the same key, ensure it has "API Restrictions" allowing both **Places API** and **YouTube Data API v3**.
4.  **Paste into `.env.local`**:
    ```env
    YOUTUBE_API_KEY=your_key_here
    ```

---

## 3. Gemini AI API (Required for Extraction)
**Purpose**: Reads the video transcript and intelligently extracts restaurant names, dishes, and sentiment (e.g., "The banh mi here is too dry").

*   **Cost**: Free tier available (Gemini 1.5 Flash).
*   **Platform**: Google AI Studio.

### Steps:
1.  Go to [Google AI Studio](https://aistudio.google.com/).
2.  Sign in with your Google Account.
3.  Click **Get API key** (usually top left or "Create API Key" button).
4.  Select your Google Cloud project (from step 1) or create a new one.
5.  Copy the key.
6.  **Paste into `.env.local`**:
    ```env
    GEMINI_API_KEY=your_key_here
    ```

---

## Verification
Once you have added all three keys to your `.env.local` file, restart your application or run the extraction tool to verify they work:

```bash
npm run extract "https://youtu.be/ODbxTWI4FAQ" "Best Ever Food Review Show"
```

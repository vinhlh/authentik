# API Setup Guide

This guide explains how to obtain the necessary API keys for the Authentik extraction pipeline.

## 1. Google Gemini API Key (Free)
**Used for:** AI extraction of restaurant data from transcripts.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Select your Google Cloud project (or create a new one).
4. Copy the key and add it to `.env.local` as `GEMINI_API_KEY`.

## 2. YouTube Data API v3 (Free Quota)
**Used for:** Fetching video metadata (title, description, channel info).

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials** > **API Key**.
3. (Optional but recommended) Click **Edit API Key** to restrict it.
   - Under "API restrictions", select **YouTube Data API v3**.
   - If you don't see it, you need to [enable the API first](https://console.cloud.google.com/apis/library/youtube.googleapis.com).
4. Copy the key and add it to `.env.local` as `YOUTUBE_API_KEY`.

## 3. Google Places API (Free Credit)
**Used for:** Verifying restaurant details, getting addresses, and geocoding.

1. Go to [Google Cloud Console > Places API](https://console.cloud.google.com/google/maps-apis/api-list).
2. Ensure **Places API (New)** and **Places API** are enabled.
3. Go to [Credentials](https://console.cloud.google.com/google/maps-apis/credentials).
4. Create an API Key (or use an existing one).
5. Copy the key and add it to `.env.local` as `GOOGLE_PLACES_API_KEY`.

> [!NOTE]
> You must have a billing account linked to your Google Cloud project to use the Maps/Places API, even for the free tier ($200 monthly credit).

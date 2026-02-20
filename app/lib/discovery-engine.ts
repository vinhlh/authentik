
import { z } from 'zod'

// Schema for a content candidate
export interface ContentCandidate {
  id: string
  url: string
  title: string
  channelName: string
  thumbnailUrl: string
  publishedAt: string
  score?: number // 1-10 relevance score
  reason?: string // Why it was selected
  status: 'pending' | 'rejected' | 'approved'
}

/**
 * Search YouTube for videos matching authentic food queries
 * This is a mock implementation until real API keys are provided
 */
export async function searchCandidates(query: string): Promise<ContentCandidate[]> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey || apiKey.includes('placeholder')) {
    console.warn('⚠️ YOUTUBE_API_KEY not set. Returning mock discovery results.')
    return getMockCandidates(query)
  }

  // Real implementation would go here:
  // 1. Fetch from YouTube Search API
  // 2. Filter by duration (long enough for a review?)
  // 3. (Optional) Pass to LLM for relevance scoring

  return []
}

function getMockCandidates(query: string): ContentCandidate[] {
  return [
    {
      id: "vid1",
      url: "https://youtube.com/watch?v=mock1",
      title: `Best Hidden Gems in ${query} 2026`,
      channelName: "Authentic Foodie",
      thumbnailUrl: "https://via.placeholder.com/640x360",
      publishedAt: new Date().toISOString(),
      score: 9,
      reason: "High relevance to 'hidden gems' and detailed description.",
      status: 'pending'
    },
    {
      id: "vid2",
      url: "https://youtube.com/watch?v=mock2",
      title: "Street Food Tour: Singapore and Ho Chi Minh City",
      channelName: "Travel & Taste",
      thumbnailUrl: "https://via.placeholder.com/640x360",
      publishedAt: new Date().toISOString(),
      score: 8,
      reason: "Focus on street food fits criteria.",
      status: 'pending'
    }
  ]
}

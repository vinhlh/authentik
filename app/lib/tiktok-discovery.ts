
import { exec } from 'child_process'
import util from 'util'
import type { ContentCandidate } from './discovery-engine'

const execAsync = util.promisify(exec)

export interface TikTokDiscoveryOptions {
  limit?: number
  keywords?: string[] // e.g. ['#danang', 'Đà Nẵng']
}

/**
 * Discover videos from a TikTok channel using yt-dlp metadata dump
 */
export async function discoverTikTokChannel(
  channelUrl: string,
  options: TikTokDiscoveryOptions = {}
): Promise<ContentCandidate[]> {
  const limit = options.limit || 30
  const keywords = options.keywords || ['danang', 'đà nẵng', 'da nang']

  console.log(`🔍 Scanning TikTok channel: ${channelUrl}`)
  console.log(`   Limit: ${limit} videos`)
  console.log(`   Keywords: ${keywords.join(', ')}`)

  try {
    // metadata-only fetch, no download
    // --flat-playlist: do not extract video info for each playlist item (faster, but less details - wait, we need details for description)
    // Actually for TikTok, --flat-playlist might not give descriptions.
    // We used --dump-json in the R&D step and it gave everything.
    // Let's use --dump-json --playlist-end {limit}

    // Use spawn instead of exec to stream output
    const { spawn } = await import('child_process')
    const { createInterface } = await import('readline')

    console.log('   (Streaming metadata from yt-dlp...)')

    const child = spawn('yt-dlp', ['--dump-json', '--playlist-end', limit.toString(), channelUrl])
    const stream = createInterface({ input: child.stdout })

    const videos: any[] = []

    for await (const line of stream) {
      try {
        const video = JSON.parse(line as string)
        videos.push(video)
        process.stdout.write(`\r   Scanning: found ${videos.length} videos...`) // Update same line
      } catch (e) {
        // ignore incomplete lines
      }
    }
    console.log('') // New line after scanning

    console.log(`   Found ${videos.length} videos. Filtering...`)

    const candidates: ContentCandidate[] = videos
      .map((video: any) => {
        const description = (video.description || '').toLowerCase()
        const title = (video.title || '').toLowerCase()
        const tags = (video.tags || []).map((t: string) => t.toLowerCase())

        // Combined text for search
        const searchableText = `${title} ${description} ${tags.join(' ')}`

        // Check if any keyword matches
        const matchesKeyword = keywords.some(k => searchableText.includes(k.toLowerCase()))

        // Basic food check (optional, but good)
        const foodKeywords = ['food', 'ăn', 'ngon', 'review', 'bún', 'phở', 'coffee', 'cafe']
        const matchesFood = foodKeywords.some(k => searchableText.includes(k))

        if (!matchesKeyword) return null

        return {
          id: video.id,
          url: video.webpage_url || video.url,
          title: video.description ? video.description.slice(0, 100) + '...' : 'TikTok Video',
          channelName: video.uploader || 'Unknown',
          thumbnailUrl: video.thumbnail,
          publishedAt: new Date(video.timestamp * 1000).toISOString(),
          score: matchesFood ? 9 : 5, // Higher score if it also has food keywords
          reason: `Matched keywords: [${keywords.filter(k => searchableText.includes(k)).join(', ')}]`,
          status: 'pending'
        } as ContentCandidate
      })
      .filter((c: ContentCandidate | null): c is ContentCandidate => c !== null)

    return candidates

  } catch (error) {
    console.error('Error discovering TikTok videos:', error)
    return []
  }
}

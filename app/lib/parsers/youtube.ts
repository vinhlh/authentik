/**
 * YouTube Video Parser
 * Extracts restaurant information from YouTube food review videos
 */

import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import os from 'os'
import util from 'util'
import { exec } from 'child_process'
import { detectMarketCityFromText, type MarketCity } from '../market-cities'

const execAsync = util.promisify(exec)


// YouTube transcript API would be used here
// For now, we'll define the structure

export const RestaurantMentionSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  dishes: z.array(z.string()).optional(),
  priceRange: z.string().optional(),
  notes: z.string().optional(),
  timestamp: z.number().optional(), // Video timestamp in seconds
})

export type RestaurantMention = z.infer<typeof RestaurantMentionSchema>

export interface YouTubeVideoMetadata {
  videoId: string
  title: string
  description: string
  channelName: string
  channelId: string
  publishedAt: string
  duration: number
  viewCount: number
  likeCount: number
}

type TranscriptCacheEntry = { value: string | null; expiresAt: number }
const transcriptCache = new Map<string, TranscriptCacheEntry>()
const TRANSCRIPT_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const TRANSCRIPT_NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000

const YTDLP_BOT_BLOCK_TTL_MS = 30 * 60 * 1000
const ytdlpBotBlockCache = new Map<string, number>()

function isYtDlpBotBlocked(videoId: string): boolean {
  const until = ytdlpBotBlockCache.get(videoId)
  if (!until) return false
  if (Date.now() > until) {
    ytdlpBotBlockCache.delete(videoId)
    return false
  }
  return true
}

function markYtDlpBotBlocked(videoId: string) {
  ytdlpBotBlockCache.set(videoId, Date.now() + YTDLP_BOT_BLOCK_TTL_MS)
}

function isYtDlpBotCheckMessage(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes("sign in to confirm") ||
    m.includes("you're not a bot") ||
    m.includes("you’re not a bot") ||
    m.includes("captcha") ||
    m.includes("cookies-from-browser") ||
    m.includes("--cookies")
  )
}

function isYtDlpMissingBrowserCookiesMessage(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('could not find') &&
    m.includes('cookies') &&
    m.includes('database')
  )
}

function isYtDlpFormatsMissingMessage(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('only images are available') ||
    m.includes('requested format is not available') ||
    m.includes('some formats may be missing') ||
    m.includes('n challenge solving failed') ||
    m.includes('found 0 sig function possibilities')
  )
}

function getYtDlpAuthOptions(): Record<string, unknown> {
  // Optional: allow authenticated yt-dlp runs to avoid bot-check blocks.
  // Supported values: chrome, firefox, safari, edge, etc (yt-dlp --cookies-from-browser).
  const cookiesFromBrowser = process.env.YT_DLP_COOKIES_FROM_BROWSER?.trim()
  const cookies = process.env.YT_DLP_COOKIES?.trim()

  const opts: Record<string, unknown> = {}
  if (cookiesFromBrowser) opts.cookiesFromBrowser = cookiesFromBrowser
  if (cookies) opts.cookies = cookies
  return opts
}

function getYtDlpAuthCandidates(): Array<Record<string, unknown>> {
  const configured = getYtDlpAuthOptions()
  if (Object.keys(configured).length > 0) return [configured]

  // Only used as a retry after a bot-check error; see rawTranscriptFetch/transcribeAudio.
  const disabled = process.env.YT_DLP_DISABLE_BROWSER_COOKIES?.trim()
  if (disabled === '1' || disabled?.toLowerCase() === 'true') return [{}]

  const browsers = ['chrome', 'edge', 'firefox', 'safari']
  return [{}].concat(browsers.map(b => ({ cookiesFromBrowser: b })))
}

function describeYtDlpAuth(auth: Record<string, unknown>): string {
  if (auth.cookies) return 'cookies file'
  if (auth.cookiesFromBrowser) return `cookies-from-browser=${auth.cookiesFromBrowser}`
  return 'no auth'
}

function shouldIgnoreYtDlpBotBlock(): boolean {
  // If the user configured cookies, don't short-circuit based on a previous unauth'd bot block.
  const configured = getYtDlpAuthOptions()
  return Object.keys(configured).length > 0
}

async function findFirstExistingFile(paths: string[]): Promise<string | null> {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p
    } catch { }
  }
  return null
}

async function convertAudioToM4a(inputPath: string, outputPath: string): Promise<string> {
  const ffmpegModule = await import('fluent-ffmpeg')
  const ffmpeg = (ffmpegModule as any).default ?? ffmpegModule

  const ffmpegStaticModule = await import('ffmpeg-static')
  const ffmpegPath = (ffmpegStaticModule as any).default ?? ffmpegStaticModule
  if (typeof ffmpegPath === 'string') {
    ffmpeg.setFfmpegPath(ffmpegPath)
  }

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('aac')
      .outputOptions(['-movflags', 'faststart'])
      .format('ipod') // m4a container
      .save(outputPath)
      .on('end', () => resolve())
      .on('error', (err: any) => reject(err))
  })

  return outputPath
}

async function downloadAudioViaYtdlCore(videoId: string, outputBasePathNoExt: string): Promise<string | null> {
  try {
    const ytdlModule = await import('@distube/ytdl-core')
    const ytdl = (ytdlModule as any).default ?? ytdlModule

    const { pipeline } = await import('stream/promises')
    const url = `https://www.youtube.com/watch?v=${videoId}`

    // Prefer MP4/M4A-like containers to minimize re-encoding.
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        },
      },
    })

    const audioOnly = ytdl.filterFormats(info.formats, 'audioonly')
    if (!audioOnly?.length) return null

    const sorted = [...audioOnly].sort((a: any, b: any) => (b.audioBitrate || 0) - (a.audioBitrate || 0))
    const preferred =
      sorted.find((f: any) => f.container === 'mp4') ??
      sorted.find((f: any) => f.container === 'm4a') ??
      sorted[0]

    if (!preferred) return null

    const ext = preferred.container || 'webm'
    const outPath = `${outputBasePathNoExt}.${ext}`
    const stream = ytdl.downloadFromInfo(info, { format: preferred })

    await pipeline(stream, fs.createWriteStream(outPath))
    return outPath
  } catch (e) {
    console.warn('   ⚠️ ytdl-core audio download failed:', (e as any)?.message || e)
    return null
  }
}

function getCachedTranscript(videoId: string): string | null | undefined {
  const entry = transcriptCache.get(videoId)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    transcriptCache.delete(videoId)
    return undefined
  }
  return entry.value
}

function setCachedTranscript(videoId: string, value: string | null) {
  const ttl = value ? TRANSCRIPT_CACHE_TTL_MS : TRANSCRIPT_NEGATIVE_CACHE_TTL_MS
  transcriptCache.set(videoId, { value, expiresAt: Date.now() + ttl })
  // Simple bounded cache: delete oldest insertion when too large.
  if (transcriptCache.size > 250) {
    const firstKey = transcriptCache.keys().next().value as string | undefined
    if (firstKey) transcriptCache.delete(firstKey)
  }
}

function getTranscriptServiceBaseUrl(): string {
  return (process.env.TRANSCRIPT_SERVICE_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
}

function isTranscriptServiceDisabled(): boolean {
  const raw = process.env.TRANSCRIPT_SERVICE_DISABLED?.trim().toLowerCase()
  return raw === '1' || raw === 'true'
}

interface TranscriptServiceSegment {
  start?: number
  end?: number
  text?: string
}

interface TranscriptServiceResponse {
  ok?: boolean
  error?: string
  details?: string
  transcript?: string
  segments?: TranscriptServiceSegment[]
  [key: string]: unknown
}

function toTranscriptTextFromServicePayload(payload: unknown): { text: string | null; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { text: normalizeTranscriptPayload(payload) }
  }

  const typed = payload as TranscriptServiceResponse
  const combinedError = [typed.error, typed.details].filter(Boolean).join(': ')

  if (typeof typed.transcript === 'string' && typed.transcript.trim()) {
    return { text: typed.transcript, error: combinedError || undefined }
  }

  if (Array.isArray(typed.segments)) {
    const fromSegments = typed.segments
      .map(seg => (typeof seg?.text === 'string' ? seg.text : ''))
      .filter(Boolean)
      .join('\n')
      .trim()
    if (fromSegments) {
      return { text: fromSegments, error: combinedError || undefined }
    }
  }

  const fallback = normalizeTranscriptPayload(payload)
  const impliedError =
    combinedError ||
    (typed.ok === false ? 'Transcript service returned ok=false' : undefined)
  return { text: fallback, error: impliedError }
}

function normalizeTranscriptPayload(payload: unknown): string | null {
  if (!payload) return null

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    return trimmed || null
  }

  if (Array.isArray(payload)) {
    const text = payload
      .map(item => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && typeof (item as any).text === 'string') return (item as any).text
        return ''
      })
      .filter(Boolean)
      .join('\n')
      .trim()
    return text || null
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    return (
      normalizeTranscriptPayload(obj.transcript) ||
      normalizeTranscriptPayload(obj.text) ||
      normalizeTranscriptPayload(obj.content) ||
      normalizeTranscriptPayload(obj.data) ||
      normalizeTranscriptPayload(obj.result) ||
      normalizeTranscriptPayload(obj.segments) ||
      null
    )
  }

  return null
}

async function getTranscriptFromService(videoId: string): Promise<string | null> {
  if (isTranscriptServiceDisabled()) return null

  const baseUrl = getTranscriptServiceBaseUrl()
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const requestUrl = `${baseUrl}/transcript?url=${encodeURIComponent(videoUrl)}`
  const timeoutMs = Number(process.env.TRANSCRIPT_SERVICE_TIMEOUT_MS || 30000) || 30000

  try {
    const response = await withTimeout(fetch(requestUrl), timeoutMs, 'transcript-service')
    const contentType = response.headers.get('content-type') || ''

    let payload: unknown
    if (contentType.includes('application/json')) {
      payload = await response.json()
    } else {
      const raw = await response.text()
      const maybeJson = raw.trim()
      if (!maybeJson) return null

      if (maybeJson.startsWith('{') || maybeJson.startsWith('[')) {
        try {
          payload = JSON.parse(maybeJson)
        } catch {
          payload = maybeJson
        }
      } else {
        payload = maybeJson
      }
    }

    const { text, error } = toTranscriptTextFromServicePayload(payload)

    if (!response.ok) {
      if (error) {
        console.warn(`   ⚠️ Transcript service ${response.status}: ${error}`)
      } else {
        console.warn(`   ⚠️ Transcript service ${response.status}. Falling back...`)
      }
      return null
    }

    if (!text) {
      if (error) {
        console.warn(`   ⚠️ Transcript service returned empty transcript: ${error}`)
      }
      return null
    }

    return normalizeTranscriptText(text)
  } catch (error: any) {
    console.warn(`   ⚠️ Transcript service unavailable: ${error?.message || String(error)}`)
    return null
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  }) as Promise<T>
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateContentWithRetry(
  model: any,
  prompt: any,
  opts?: { maxAttempts?: number; baseDelayMs?: number }
) {
  const maxAttempts = opts?.maxAttempts ?? 3
  const baseDelayMs = opts?.baseDelayMs ?? 1200

  let attempt = 0
  while (true) {
    attempt++
    try {
      return await model.generateContent(prompt)
    } catch (e: any) {
      const status = e?.status
      if (attempt >= maxAttempts || status !== 429) throw e
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250)
      console.warn(`⚠️ Gemini 429 (rate limit). Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})...`)
      await sleep(delay)
    }
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    // watch?v= / youtu.be / embed / shorts / live
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
    // Legacy patterns
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

function decodeHtmlEntities(input: string): string {
  // youtube-transcript returns XML-escaped text; decode common entities + numeric forms.
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

function shouldDropCaptionLine(line: string): boolean {
  const s = line.trim()
  if (!s) return true

  // Drop common short stage directions.
  const bracketed = s.match(/^[\[(](.+)[\])]$/)
  if (bracketed) {
    const inner = bracketed[1].trim().toLowerCase()
    if (inner.length <= 40) {
      const dropTokens = [
        'music',
        'applause',
        'laughter',
        'nhac',
        'am nhac',
        'tieng nhac',
        'tieng vo tay',
        'tieng cuoi',
        'cuoi',
      ]
      if (dropTokens.some(t => inner.includes(t))) return true
    }
  }

  return false
}

export function normalizeTranscriptText(input: string): string {
  const decoded = decodeHtmlEntities(input)
    .replace(/\r\n/g, '\n')
    .replace(/\u200B/g, '')
    .trim()

  if (!decoded) return ''

  const parts = decoded
    .split('\n')
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => !shouldDropCaptionLine(p))

  // Deduplicate consecutive identical segments.
  const deduped: string[] = []
  for (const part of parts) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== part) {
      deduped.push(part)
    }
  }

  return deduped.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Fetch metadata via oEmbed (No API Key required)
 * Fallback when Data API fails
 */
async function getOEmbedMetadata(videoId: string): Promise<YouTubeVideoMetadata | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)

    if (!response.ok) {
      console.warn(`oEmbed failed: ${response.status}`)
      return null
    }

    const data = await response.json()

    return {
      videoId,
      title: data.title,
      description: '', // oEmbed doesn't provide description
      channelName: data.author_name,
      channelId: '', // Not provided directly
      publishedAt: new Date().toISOString(), // Unknown
      duration: 0, // Unknown
      viewCount: 0,
      likeCount: 0,
    }
  } catch (error) {
    console.error('oEmbed error:', error)
    return null
  }
}

/**
 * Get video metadata from YouTube Data API
 */
export async function getVideoMetadata(
  videoId: string
): Promise<YouTubeVideoMetadata | null> {
  const apiKey = process.env.YOUTUBE_API_KEY

  // Try API First
  if (apiKey) {
    console.log(`🔑 Using YouTube API Key: ${apiKey.substring(0, 4)}...`)
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${apiKey}`
      )

      // If quota exceeded (403), fallback to oEmbed?
      if (!response.ok) {
        console.warn(`⚠️ YouTube API Error: ${response.status}. Trying fallback...`)
      } else {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const video = data.items[0]
          const snippet = video.snippet
          const statistics = video.statistics
          const contentDetails = video.contentDetails

          // Parse ISO 8601 duration
          const durationMatch = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
          const hours = parseInt(durationMatch?.[1] || '0')
          const minutes = parseInt(durationMatch?.[2] || '0')
          const seconds = parseInt(durationMatch?.[3] || '0')
          const duration = hours * 3600 + minutes * 60 + seconds

          return {
            videoId,
            title: snippet.title,
            description: snippet.description,
            channelName: snippet.channelTitle,
            channelId: snippet.channelId,
            publishedAt: snippet.publishedAt,
            duration,
            viewCount: parseInt(statistics.viewCount || '0'),
            likeCount: parseInt(statistics.likeCount || '0'),
          }
        } else {
          console.warn(`⚠️ YouTube API returned 0 items. Trying fallback...`)
        }
      }
    } catch (error) {
      console.error('YouTube API Exception:', error)
    }
  } else {
    console.warn('⚠️ YOUTUBE_API_KEY missing. Trying fallback...')
  }

  // Fallback to oEmbed
  console.log('🔄 Attempting oEmbed fallback...')
  const oEmbedData = await getOEmbedMetadata(videoId)

  if (oEmbedData) {
    console.log('✅ Recovered metadata via oEmbed')
    return oEmbedData
  }

  // If both failed, determine the likely cause
  if (apiKey) {
    throw new Error(`Video ${videoId} not found (API returned 0 items + oEmbed failed). Likely Private or Deleted.`)
  } else {
    throw new Error(`Could not fetch metadata (Missing API Key + oEmbed failed). Check YOUTUBE_API_KEY.`)
  }
}

/**
 * Get video transcript using youtube-transcript library
 * Note: This requires the youtube-transcript package
 */
export async function getVideoTranscript(videoId: string): Promise<string | null> {
  const cached = getCachedTranscript(videoId)
  if (cached !== undefined) return cached

  const serviceTranscript = await getTranscriptFromService(videoId)
  if (serviceTranscript) {
    console.log(`   ✅ Transcript via external service (${serviceTranscript.length} chars)`)
    setCachedTranscript(videoId, serviceTranscript)
    return serviceTranscript
  }

  const yt = await import('youtube-transcript')
  const YoutubeTranscript = yt.YoutubeTranscript

  try {
    if (!YoutubeTranscript) {
      console.warn('   ⚠️ youtube-transcript export not found; falling back to yt-dlp')
      const fallback = await rawTranscriptFetch(videoId)
      setCachedTranscript(videoId, fallback)
      return fallback
    }

    const {
      YoutubeTranscriptTooManyRequestError,
      YoutubeTranscriptVideoUnavailableError,
      YoutubeTranscriptDisabledError,
      YoutubeTranscriptNotAvailableError,
      YoutubeTranscriptNotAvailableLanguageError,
    } = yt

    const preferredLangs = ['vi', 'vi-VN', 'en', 'en-US'] as const

    const tryFetch = async (lang?: string) => {
      const label = lang ? `youtube-transcript(${lang})` : 'youtube-transcript(default)'
      const items = await withTimeout(
        YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : undefined),
        15_000,
        label
      )
      if (!items?.length) return null
      return normalizeTranscriptText(items.map(t => t.text).join('\n'))
    }

    for (const lang of preferredLangs) {
      try {
        const text = await tryFetch(lang)
        if (text) {
          console.log(`   ✅ Transcript via youtube-transcript (${lang}) (${text.length} chars)`)
          setCachedTranscript(videoId, text)
          return text
        }
      } catch (e: any) {
        if (YoutubeTranscriptTooManyRequestError && e instanceof YoutubeTranscriptTooManyRequestError) {
          console.warn(`   ⚠️ youtube-transcript rate-limited (captcha). Falling back to yt-dlp.`)
          break
        }
        if (YoutubeTranscriptVideoUnavailableError && e instanceof YoutubeTranscriptVideoUnavailableError) {
          console.warn(`   ⚠️ Video unavailable (${videoId})`)
          setCachedTranscript(videoId, null)
          return null
        }
        if (YoutubeTranscriptNotAvailableLanguageError && e instanceof YoutubeTranscriptNotAvailableLanguageError) {
          continue
        }
        if (
          (YoutubeTranscriptDisabledError && e instanceof YoutubeTranscriptDisabledError) ||
          (YoutubeTranscriptNotAvailableError && e instanceof YoutubeTranscriptNotAvailableError)
        ) {
          // The scraper couldn't find captions in the watch HTML. yt-dlp often works when the HTML changes.
          break
        }
        // Unknown error: try next language and then fall back.
      }
    }

    // Default fetch as a last attempt (some videos only expose one language).
    try {
      const text = await tryFetch()
      if (text) {
        console.log(`   ✅ Transcript via youtube-transcript (default) (${text.length} chars)`)
        setCachedTranscript(videoId, text)
        return text
      }
    } catch (e: any) {
      if (yt.YoutubeTranscriptTooManyRequestError && e instanceof yt.YoutubeTranscriptTooManyRequestError) {
        console.warn(`   ⚠️ youtube-transcript rate-limited (captcha).`)
      } else {
        console.warn(`   ⚠️ youtube-transcript default failed: ${e?.message || String(e)}`)
      }
    }

    console.log(`   🔄 Attempting yt-dlp transcript fallback...`)
    const fallback = await rawTranscriptFetch(videoId)
    setCachedTranscript(videoId, fallback)
    return fallback
  } catch (error) {
    console.error('Error fetching transcript:', error)
    setCachedTranscript(videoId, null)
    return null
  }
}

/**
 * Low-level raw fetch for transcripts when the library fails
 * Uses yt-dlp via youtube-dl-exec to extract auto-generated or manual subtitles
 */
async function rawTranscriptFetch(videoId: string): Promise<string | null> {
  const tempDir = os.tmpdir()
  const youtubedl = (await import('youtube-dl-exec')).default

  try {
    if (!shouldIgnoreYtDlpBotBlock() && isYtDlpBotBlocked(videoId)) {
      console.warn(`   ⚠️ Skipping yt-dlp (recent "not a bot" block for ${videoId}).`)
      return null
    }

    console.log(`   📡 Attempting transcript fetch via yt-dlp...`)

    // We use the library to handle the binary execution
    // Flags mapping:
    // --skip-download -> skipDownload: true
    // --write-subs -> writeSubs: true
    // --write-auto-subs -> writeAutoSubs: true
    // --sub-langs -> subLangs: ...

    // Note: youtube-dl-exec returns a promise that resolves to the output,
    // but for file writing flags it might just write files.

    const outputTemplate = `${tempDir}/yt-${videoId}-${Date.now()}`

    // Force YOUTUBE_DL_DIR to point to the local node_modules bin
    // This fixes the /ROOT/ path issue on some serverless environments
    const localBinDir = path.resolve(process.cwd(), 'node_modules/youtube-dl-exec/bin');
    if (fs.existsSync(localBinDir)) {
      process.env.YOUTUBE_DL_DIR = localBinDir;
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`
    const baseOptions: Record<string, unknown> = {
      skipDownload: true,
      writeSub: true,
      writeAutoSub: true,
      subLang: 'vi,vi-VN,en.*',
      output: outputTemplate,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: ['referer:youtube.com'],
    }

    const candidates = getYtDlpAuthCandidates()
    let sawBotCheck = false

    for (const auth of candidates) {
      try {
        if (sawBotCheck && Object.keys(auth).length > 0) {
          console.log(`   🔐 Retrying yt-dlp with ${describeYtDlpAuth(auth)}...`)
        }
        await youtubedl(url, { ...(baseOptions as any), ...(auth as any) } as any, { cwd: process.cwd() } as any)
        sawBotCheck = false
        break
      } catch (e: any) {
        const message = e?.stderr || e?.message || String(e)
        if (isYtDlpBotCheckMessage(message)) {
          sawBotCheck = true
          continue
        }
        if (isYtDlpMissingBrowserCookiesMessage(message)) {
          // Browser isn't installed / has no cookies DB on this machine; try next candidate.
          continue
        }
        throw e
      }
    }

    if (sawBotCheck) {
      markYtDlpBotBlocked(videoId)
      console.warn(
        `⚠️ yt-dlp blocked by YouTube ("not a bot" / cookies required). Set YT_DLP_COOKIES_FROM_BROWSER=chrome (or YT_DLP_COOKIES=/path/to/cookies.txt) to enable authenticated transcript/audio.`
      )
      return null
    }

    // yt-dlp names the file with the language suffix
    // We search for files starting with the base name we provided (but youtube-dl-exec might append params)
    // Actually output template handles it.

    // Check for generated VTT files
    const baseName = path.basename(outputTemplate)
    const files = fs.readdirSync(tempDir).filter(f => f.startsWith(baseName) && f.endsWith('.vtt'))

    if (files.length === 0) {
      console.warn(`   ⚠️ No VTT files found after yt-dlp execution`)
      return null
    }

    // Sort to pick 'vi' first if multiple exist
    files.sort((a, b) => {
      if (a.includes('.vi.')) return -1
      if (b.includes('.vi.')) return 1
      return 0
    })

    const vttPath = path.join(tempDir, files[0])
    const content = fs.readFileSync(vttPath, 'utf8')

    // Clean up all generated VTT files
    files.forEach(f => {
      try { fs.unlinkSync(path.join(tempDir, f)) } catch { }
    })

    // Simple VTT parsing: extract text lines
    // Standard VTT format has timestamps followed by text
    const lines = content.split('\n')
      .filter(line => !line.includes('-->') && line.trim() !== '' && !line.startsWith('WEBVTT') && !line.startsWith('Kind:') && !line.startsWith('Language:'))
      .map(line => line.replace(/<[^>]*>/g, '').trim()) // Remove VTT tags like <c.color>
      .filter(line => line.length > 0)

    // Deduplicate consecutive identical lines (common in auto-subs)
    const uniqueLines: string[] = []
    for (let i = 0; i < lines.length; i++) {
      if (i === 0 || lines[i] !== lines[i - 1]) {
        uniqueLines.push(lines[i])
      }
    }

    const transcript = normalizeTranscriptText(uniqueLines.join('\n'))
    if (transcript.length > 0) {
      console.log(`   ✅ yt-dlp Fetch Success! (${transcript.length} chars)`)
      return transcript
    }

    return null
  } catch (e: any) {
    const message = e?.stderr || e?.message || String(e)
    if (isYtDlpBotCheckMessage(message)) {
      markYtDlpBotBlocked(videoId)
      console.warn(
        `⚠️ yt-dlp blocked by YouTube ("not a bot" / cookies required). Set YT_DLP_COOKIES_FROM_BROWSER=chrome (or YT_DLP_COOKIES=/path/to/cookies.txt) to enable authenticated transcript/audio.`
      )
    } else {
      console.warn(`⚠️ yt-dlp transcript fetch failed:`, e?.message || e)
    }
    return null
  }
}


/**
 * Transcribe audio from YouTube video using Gemini
 * Fallback when transcript is not available
 */
export async function transcribeAudio(videoId: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  if (!shouldIgnoreYtDlpBotBlock() && isYtDlpBotBlocked(videoId)) {
    console.warn(`⚠️ Skipping audio transcription (yt-dlp is blocked for ${videoId}).`)
    return null
  }

  console.log(`🎙️  Transcribing audio for ${videoId}...`)

  const tempDir = os.tmpdir()
  const timestamp = Date.now()
  const outputTemplate = path.join(tempDir, `yt-${videoId}-${timestamp}.%(ext)s`)
  const finalAudioFile = path.join(tempDir, `yt-${videoId}-${timestamp}.m4a`)

  const youtubedl = (await import('youtube-dl-exec')).default

  let downloadedPath: string | null = null

  try {
    // 1. Download Audio
    console.log(`   📡 Attempting download...`)

    const url = `https://www.youtube.com/watch?v=${videoId}`
    const baseOptions: Record<string, unknown> = {
      extractAudio: true,
      audioFormat: 'm4a',
      output: outputTemplate,
      noCheckCertificates: true,
      noWarnings: true,
    }

    const candidates = getYtDlpAuthCandidates()
    let sawBotCheck = false

    let lastError: unknown | null = null
    for (const auth of candidates) {
      try {
        if (sawBotCheck && Object.keys(auth).length > 0) {
          console.log(`   🔐 Retrying yt-dlp with ${describeYtDlpAuth(auth)}...`)
        }
        await youtubedl(url, { ...(baseOptions as any), ...(auth as any) } as any)
        sawBotCheck = false
        lastError = null
        break
      } catch (e: any) {
        lastError = e
        const message = e?.stderr || e?.message || String(e)
        if (isYtDlpBotCheckMessage(message)) {
          sawBotCheck = true
          continue
        }
        if (isYtDlpMissingBrowserCookiesMessage(message)) {
          continue
        }
        // If yt-dlp can't decipher formats, fall back to a different downloader.
        if (isYtDlpFormatsMissingMessage(message)) {
          break
        }
        throw e
      }
    }

    if (sawBotCheck && !shouldIgnoreYtDlpBotBlock()) {
      markYtDlpBotBlocked(videoId)
      console.warn(
        `⚠️ yt-dlp blocked by YouTube ("not a bot" / cookies required). Set YT_DLP_COOKIES_FROM_BROWSER=chrome (or YT_DLP_COOKIES=/path/to/cookies.txt) to enable authenticated transcript/audio.`
      )
      return null
    }

    // yt-dlp may output a different extension or fail to convert; find what it actually produced.
    const basePrefix = `yt-${videoId}-${timestamp}.`
    const candidatesOnDisk = fs.readdirSync(tempDir)
      .filter(f => f.startsWith(basePrefix) && !f.endsWith('.part'))
      .map(f => path.join(tempDir, f))

    downloadedPath = await findFirstExistingFile([finalAudioFile, ...candidatesOnDisk])

    if (!downloadedPath) {
      // If yt-dlp couldn't produce an audio file, try ytdl-core (works for some videos where yt-dlp fails).
      const ytdlBase = path.join(tempDir, `yt-${videoId}-${timestamp}-ytdl`)
      downloadedPath = await downloadAudioViaYtdlCore(videoId, ytdlBase)
    }

    if (!downloadedPath) {
      if (lastError) throw lastError
      return null
    }

    // Ensure m4a for Gemini upload and consistent downstream handling.
    let uploadPath = downloadedPath
    if (!uploadPath.endsWith('.m4a')) {
      uploadPath = await convertAudioToM4a(uploadPath, finalAudioFile)
    }

    // 2. Upload to Gemini
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const { GEMINI_CONFIG } = await import('../ai/config')

    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.modelName,
      generationConfig: GEMINI_CONFIG.generationConfig
    })

    const fileBuffer = fs.readFileSync(uploadPath)
    const base64Audio = fileBuffer.toString('base64')

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/mp4",
          data: base64Audio
        }
      },
      { text: "Generate a full transcript of this audio. Ignore music or silence. Focus on spoken words." }
    ])

    const text = result.response.text()
    console.log(`   ✅ Transcribed ${text.length} chars from audio`)
    return text

  } catch (error) {
    console.error('   ❌ Transcription failed:', error)
    const message = (error as any)?.stderr || (error as any)?.message || String(error)
    if (isYtDlpBotCheckMessage(message)) markYtDlpBotBlocked(videoId)
    return null
  } finally {
    // Cleanup
    if (fs.existsSync(finalAudioFile)) {
      try { fs.unlinkSync(finalAudioFile) } catch { }
    }
    if (downloadedPath && downloadedPath !== finalAudioFile && fs.existsSync(downloadedPath)) {
      try { fs.unlinkSync(downloadedPath) } catch { }
    }
  }
}

/**
 * Extract restaurant mentions from transcript using AI
 * This would use Gemini Flash (free) or GPT for extraction
 */
export async function extractRestaurantsFromTranscript(
  transcript: string,
  videoMetadata: YouTubeVideoMetadata,
  cityContext: MarketCity = detectMarketCityFromText(videoMetadata.title, videoMetadata.description, videoMetadata.channelName)
): Promise<RestaurantMention[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set, skipping AI extraction')
    return []
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)

    const { GEMINI_CONFIG } = await import('../ai/config');

    // Use standardized config
    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.modelName,
      generationConfig: GEMINI_CONFIG.generationConfig
    });

    const prompt = `
    You are an expert food critic and data extractor.
    Analyze the following YouTube video transcript and metadata to extract restaurant information.

    Market focus: Vietnam and Singapore.
    Target city: ${cityContext.name}, ${cityContext.country}.

    CRITICAL RULES:
    1. STRICT FACTUAL EXTRACTION: ONLY extract information EXPLICITLY mentioned in the transcript or title/description.
    2. NO SPECULATION: DO NOT hallucinate, assume, or guess details not present in the text.
    3. NO META-TALK: DO NOT include reasoning like "Assuming the video at X:XX depicts..." or "Without access to the video...". The 'notes' field should contain ONLY details about the restaurant/food.
    4. FILTER NON-REVIEWS: DO NOT extract a restaurant if the reviewer visited it but could not eat there (e.g., it was closed, sold out, too crowded) and therefore provided no opinion on the food.
    5. ABSENT DATA: If specific praise/criticism is missing but they DID eat there, leave the 'notes' field empty or use a brief factual statement.
    6. PRECISION: Be extremely precise with restaurant names.
    7. AUTHENTIC LOCAL ONLY: Extract authentic local cuisine for the target city. For Vietnam cities, prioritize Vietnamese dishes. For Singapore, prioritize local hawker/Singaporean dishes. Exclude unrelated imported cuisines.

    Extract a JSON array of restaurants mentioned. Each object should have:
    - name: The name of the restaurant or food stall. Be precise.
    - address: The address if mentioned (or "${cityContext.name}" if inferred but not specific).
    - dishes: Array of dishes explicitly recommended or eaten there.
    - priceRange: Estimation based ONLY on context ("$" = cheap street food, "$$" = casual, "$$$" = upscale).
    - notes: Detailed summary of the reviewer's actual experience found in the text. Include atmosphere, specific praise/criticism of food, and why they recommend it.
    - timestamp: Approximate timestamp in seconds where it appears (estimate based on text position if possible, otherwise 0).

    Return ONLY the JSON array. If no restaurants are clearly identified, return empty array [].

    Video Title: ${videoMetadata.title}
    Channel: ${videoMetadata.channelName}
    Video Description: ${videoMetadata.description}
    Transcript:
    ${transcript.substring(0, 50000)}
    `

    const result = await generateContentWithRetry(model, prompt, { maxAttempts: 4 })
    const response = await result.response
    const text = response.text()

    try {
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        console.error('AI returned non-array format', data)
        return []
      }

      // Validate and clean up data
      const validRestaurants = data
        .map(item => {
          // Basic cleanup
          return {
            ...item,
            name: item.name?.trim(),
            dishes: Array.isArray(item.dishes) ? item.dishes : [],
            priceRange: item.priceRange || '$',
            timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0
          }
        })
        .filter(item => item.name && item.name.length > 2)

      return validRestaurants as RestaurantMention[]

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('Raw response:', text)
      return []
    }

  } catch (error) {
    console.error('Error during AI extraction:', error)
    return []
  }
}



/**
 * Extract restaurants from video description using regex (no AI needed)
 * Parses timestamp patterns like "0:54 Mỳ Quảng Nhung" or "2:15 Bún cá 109"
 */
export function extractRestaurantsFromDescriptionRegex(
  metadata: YouTubeVideoMetadata,
  cityContext: MarketCity = detectMarketCityFromText(metadata.title, metadata.description, metadata.channelName)
): RestaurantMention[] {
  if (!metadata.description || metadata.description.length < 30) {
    return []
  }

  const restaurants: RestaurantMention[] = []

  // Match patterns like "0:00 Intro", "0:54 Mỳ Quảng Nhung", "2:15 Bún cá 109"
  // Timestamp format: MM:SS or H:MM:SS
  const timestampPattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(.+)$/gm

  // Terms to skip (intro, outro, BTS, etc.)
  const skipTerms = ['intro', 'outro', 'bts', 'tổng hợp', 'thông tin', 'liên hệ', 'end', 'credits']

  let match
  while ((match = timestampPattern.exec(metadata.description)) !== null) {
    const hours = match[3] ? parseInt(match[1]) : 0
    const minutes = match[3] ? parseInt(match[2]) : parseInt(match[1])
    const seconds = match[3] ? parseInt(match[3]) : parseInt(match[2])
    const name = match[4].trim()

    // Skip non-restaurant entries
    const nameLower = name.toLowerCase()
    if (skipTerms.some(term => nameLower.includes(term))) {
      continue
    }

    // Infer dish from name (common Vietnamese patterns)
    const dishes: string[] = []
    const dishPatterns = [
      { pattern: /mỳ quảng/i, dish: 'Mỳ Quảng' },
      { pattern: /bún cá/i, dish: 'Bún Cá' },
      { pattern: /bún bò/i, dish: 'Bún Bò' },
      { pattern: /cơm gà/i, dish: 'Cơm Gà' },
      { pattern: /hải sản/i, dish: 'Hải Sản' },
      { pattern: /phở/i, dish: 'Phở' },
      { pattern: /bánh mì/i, dish: 'Bánh Mì' },
      { pattern: /bánh xèo/i, dish: 'Bánh Xèo' },
      { pattern: /bánh canh/i, dish: 'Bánh Canh' },
      { pattern: /coffee|cà phê/i, dish: 'Coffee' },
    ]

    for (const { pattern, dish } of dishPatterns) {
      if (pattern.test(name)) {
        dishes.push(dish)
        break
      }
    }

    const timestamp = hours * 3600 + minutes * 60 + seconds

    restaurants.push({
      name,
      address: cityContext.name,
      dishes,
      priceRange: '$',
      notes: `Featured at ${match[1]}:${match[2]}${match[3] ? ':' + match[3] : ''} in the video`,
      timestamp,
    })
  }

  return restaurants
}

/**
 * Extract restaurants from video description using AI
 * Fallback when transcript is not available
 */
export async function extractRestaurantsFromDescription(
  metadata: YouTubeVideoMetadata,
  cityContext: MarketCity = detectMarketCityFromText(metadata.title, metadata.description, metadata.channelName)
): Promise<RestaurantMention[]> {
  // Check if description has meaningful content
  if (!metadata.description || metadata.description.length < 50) {
    console.warn('⚠️ Video description too short for extraction')
    return []
  }

  // First try regex-based extraction (always works, no API needed)
  const regexResults = extractRestaurantsFromDescriptionRegex(metadata, cityContext)

  if (regexResults.length > 0) {
    console.log(`✅ Extracted ${regexResults.length} restaurants from description using regex`)
    return regexResults
  }

  // If regex didn't work, try AI extraction
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set and regex extraction found nothing')
    return []
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: "application/json" }
    })

    const prompt = `
    You are an expert at extracting restaurant information from YouTube video descriptions.

    CRITICAL RULES:
    1. NO ASSUMPTIONS: DO NOT guess what happens in the video. ONLY use the provided text.
    2. NO META-TALK: DO NOT use phrases like "safest bet", "likely", or "assuming".
    3. EXCLUDE CLOSED PLACES: If the description mentions a place was closed or they couldn't eat there, do not include it.
    4. FACTUAL ONLY: If the description doesn't explicitly describe the taste or experience, leave the 'notes' field empty or factual.
    5. AUTHENTIC LOCAL ONLY: Extract authentic local cuisine for the target city. For Vietnam cities, prioritize Vietnamese dishes. For Singapore, prioritize local hawker/Singaporean dishes. Exclude unrelated imported cuisines.

    Analyze the following YouTube video title and description to extract ALL restaurants/food places mentioned.
    This is a food review video in Vietnam or Singapore, so names may be in Vietnamese or English.

    Look for:
    - Restaurant names in timestamp listings (e.g., "0:54 Mỳ Quảng Nhung")
    - Any "quán" (restaurant/shop) names mentioned
    - Coffee shops, street food stalls, or any food establishments

    Extract a JSON array where each object has:
    - name: The exact name of the restaurant/food stall (e.g., "Mỳ Quảng Nhung", "Bún cá 109")
    - address: "${cityContext.name}" (target city fallback if exact address is not mentioned)
    - dishes: Infer the main dish from the name if possible (e.g., "Mỳ Quảng" for "Mỳ Quảng Nhung").
    - priceRange: "$" for street food (default assumption for these types of videos)
    - notes: Brief factual note about what type of food they serve.
    - timestamp: Convert timestamp to seconds if available (e.g., "2:15" = 135)

    Return ONLY the JSON array. If no restaurants are identified, return [].

    Video Title: ${metadata.title}
    Target city: ${cityContext.name}, ${cityContext.country}
    Video Description:
    ${metadata.description}
    `

    const result = await generateContentWithRetry(model, prompt, { maxAttempts: 4 })
    const response = await result.response
    const text = response.text()

    try {
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        console.error('AI returned non-array format', data)
        return []
      }

      // Validate and clean up data
      const validRestaurants = data
        .map(item => ({
          ...item,
          name: item.name?.trim(),
          dishes: Array.isArray(item.dishes) ? item.dishes : (item.dishes ? [item.dishes] : []),
          priceRange: item.priceRange || '$',
          timestamp: typeof item.timestamp === 'number' ? item.timestamp : 0
        }))
        .filter(item => item.name && item.name.length > 2)

      return validRestaurants as RestaurantMention[]

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('Raw response:', text)
      return []
    }

  } catch (error) {
    console.error('Error during AI extraction from description:', error)
    return []
  }
}

/**
 * Parse YouTube video and extract restaurant data
 * Main entry point for YouTube video processing
 */
export async function parseYouTubeVideo(url: string): Promise<{
  metadata: YouTubeVideoMetadata | null
  restaurants: RestaurantMention[]
}> {
  const videoId = extractVideoId(url)

  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Get video metadata
  let metadata = await getVideoMetadata(videoId)

  if (!metadata) {
    throw new Error('❌ Could not fetch video metadata. Check YOUTUBE_API_KEY.')
  }

  const inferredCity = detectMarketCityFromText(
    metadata.title,
    metadata.description,
    metadata.channelName,
    url
  )
  console.log(`📍 Inferred city context: ${inferredCity.name}, ${inferredCity.country}`)

  // Get transcript
  console.log(`fetching transcript for video: ${videoId}`)
  let transcript = await getVideoTranscript(videoId)

  if (!transcript) {
    // If no text transcript, try audio transcription
    transcript = await transcribeAudio(videoId)
  }

  let restaurants: RestaurantMention[]

  if (transcript) {
    // Extract restaurants from transcript
    console.log('Extracting restaurants from transcript...')
    restaurants = await extractRestaurantsFromTranscript(transcript, metadata, inferredCity)
    if (restaurants.length === 0) {
      console.log('⚠️ No restaurants extracted from transcript. Trying description fallback...')
      restaurants = await extractRestaurantsFromDescription(metadata, inferredCity)
    }
  } else {
    // Fallback: try to extract from video description
    console.log('⚠️ Transcript not available. Fallback to Description...')
    restaurants = await extractRestaurantsFromDescription(metadata, inferredCity)
  }

  return { metadata, restaurants }
}

/**
 * Validate extracted restaurant data
 */
export function validateRestaurantMention(data: unknown): RestaurantMention | null {
  try {
    return RestaurantMentionSchema.parse(data)
  } catch (error) {
    console.error('Invalid restaurant mention:', error)
    return null
  }
}

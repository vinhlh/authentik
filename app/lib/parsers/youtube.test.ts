import { extractVideoId, normalizeTranscriptText } from './youtube'
import { describe, it, expect } from 'vitest'

describe('extractVideoId', () => {
  it('extracts ID from standard youtube URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtu.be short URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ'
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from embed URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from shorts URL', () => {
    const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share'
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from live URL', () => {
    const url = 'https://www.youtube.com/live/dQw4w9WgXcQ?feature=share'
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ')
  })

  it('returns null for invalid URL', () => {
    const url = 'https://google.com'
    expect(extractVideoId(url)).toBe(null)
  })
})

describe('normalizeTranscriptText', () => {
  it('decodes HTML entities and drops common stage directions', () => {
    const raw = [
      'Hello &amp; welcome',
      '[Music]',
      'Hello &amp; welcome',
      'It&#39;s great &lt;3',
    ].join('\n')
    expect(normalizeTranscriptText(raw)).toBe("Hello & welcome It's great <3")
  })
})

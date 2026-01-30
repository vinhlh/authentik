import { extractVideoId } from './youtube'
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

  it('returns null for invalid URL', () => {
    const url = 'https://google.com'
    expect(extractVideoId(url)).toBe(null)
  })
})

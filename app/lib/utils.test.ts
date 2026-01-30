import { cn } from './utils'
import { describe, it, expect } from 'vitest'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500')
  })

  it('handles conditional classes', () => {
    const isTrue = true
    const isFalse = false
    expect(cn('base', isTrue && 'visible', isFalse && 'hidden')).toBe('base visible')
  })

  it('merges tailwind conflicts (tailwind-merge behavior)', () => {
    // p-4 should override p-2
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

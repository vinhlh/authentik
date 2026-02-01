
import { describe, it, expect } from 'vitest'

// Helper function to test (if exists, or we create a simple one here for demonstration)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

describe('formatCurrency', () => {
  it('should format VND correctly', () => {
    const amount = 100000
    // Note: implementation depends on locale, might verify just part of string or normalize spaces
    const formatted = formatCurrency(amount)
    // Non-breaking space is often used in currency formatting
    expect(formatted.replace(/\s/g, ' ')).toMatch(/100\.000\s?₫/)
  })
})

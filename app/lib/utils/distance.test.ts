
import { describe, it, expect } from 'vitest'
import { calculateDistance } from './distance'

describe('calculateDistance', () => {
  it('should calculate distance correctly between two points', () => {
    // Da Nang (approx)
    const lat1 = 16.0544
    const lon1 = 108.2022
    // Hoi An (approx)
    const lat2 = 15.8801
    const lon2 = 108.3380

    const distance = calculateDistance(lat1, lon1, lat2, lon2)

    // Approx 25-30km
    expect(parseFloat(distance)).toBeGreaterThan(20)
    expect(parseFloat(distance)).toBeLessThan(35)
    expect(distance).toContain('km')
  })

  it('should return 0m for same location', () => {
    const lat = 16.0544
    const lon = 108.2022
    const distance = calculateDistance(lat, lon, lat, lon)
    expect(distance).toBe('0m')
  })

  it('should handle small distances correctly', () => {
    const lat1 = 16.0544
    const lon1 = 108.2022
    const lat2 = 16.0545
    const lon2 = 108.2023

    const distance = calculateDistance(lat1, lon1, lat2, lon2)
    // Should be small but non-zero
    expect(parseFloat(distance)).toBeGreaterThan(0)
  })
})

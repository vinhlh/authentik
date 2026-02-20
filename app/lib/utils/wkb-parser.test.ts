import { describe, expect, it } from 'vitest'
import { parseWkbPoint } from './wkb-parser'

describe('parseWkbPoint', () => {
  it('parses EWKB point hex with SRID', () => {
    const result = parseWkbPoint('0101000020E610000014D044D8F00C5B4004E78C28ED0D3040')

    expect(result).not.toBeNull()
    expect(result?.lat).toBeCloseTo(16.0544, 6)
    expect(result?.lng).toBeCloseTo(108.2022, 6)
  })

  it('parses WKB point hex without SRID', () => {
    const result = parseWkbPoint('010100000014D044D8F00C5B4004E78C28ED0D3040')

    expect(result).not.toBeNull()
    expect(result?.lat).toBeCloseTo(16.0544, 6)
    expect(result?.lng).toBeCloseTo(108.2022, 6)
  })

  it('parses GeoJSON-style point objects', () => {
    const result = parseWkbPoint({
      type: 'Point',
      coordinates: [108.2022, 16.0544]
    })

    expect(result).toEqual({
      lat: 16.0544,
      lng: 108.2022
    })
  })

  it('returns null for unsupported input', () => {
    expect(parseWkbPoint('invalid')).toBeNull()
    expect(parseWkbPoint({})).toBeNull()
  })
})

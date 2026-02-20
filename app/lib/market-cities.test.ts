import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MARKET_CITY,
  detectMarketCityFromText,
  detectMarketCityFromTextOrNull,
  getMarketCityById,
  replaceCollectionCityTags,
} from './market-cities'

describe('detectMarketCityFromTextOrNull', () => {
  it('detects city when punctuation separates words', () => {
    const city = detectMarketCityFromTextOrNull('Street food in Da-Nang this week')
    expect(city?.id).toBe('da-nang')
  })

  it('does not match partial tokens', () => {
    const city = detectMarketCityFromTextOrNull('best shcmarket snacks')
    expect(city).toBeNull()
  })

  it('returns null when city is unsupported', () => {
    const city = detectMarketCityFromTextOrNull('Ha Long seafood tour')
    expect(city).toBeNull()
  })
})

describe('detectMarketCityFromText', () => {
  it('detects Nha Trang from text', () => {
    const city = detectMarketCityFromText('Ăn gì ở Nha Trang cuối tuần?')
    expect(city.id).toBe('nha-trang')
  })

  it('detects Da Lat from accented Vietnamese text', () => {
    const city = detectMarketCityFromText('Ăn gì ở Đà Lạt cuối tuần?')
    expect(city.id).toBe('da-lat')
  })

  it('detects Ha Noi from accented Vietnamese text', () => {
    const city = detectMarketCityFromText('Ăn gì ở Hà Nội cuối tuần?')
    expect(city.id).toBe('ha-noi')
  })

  it('detects Ho Chi Minh City from Saigon alias', () => {
    const city = detectMarketCityFromText('Saigon street food tour')
    expect(city.id).toBe('ho-chi-minh')
  })

  it('falls back to default market city', () => {
    const city = detectMarketCityFromText('no known city token')
    expect(city.id).toBe(DEFAULT_MARKET_CITY.id)
  })
})

describe('getMarketCityById', () => {
  it('returns Nha Trang for known id', () => {
    const city = getMarketCityById('nha-trang')
    expect(city.id).toBe('nha-trang')
  })

  it('returns Da Lat for known id', () => {
    const city = getMarketCityById('da-lat')
    expect(city.id).toBe('da-lat')
  })

  it('returns default city for unknown id', () => {
    const city = getMarketCityById('unknown-id')
    expect(city.id).toBe(DEFAULT_MARKET_CITY.id)
  })
})

describe('replaceCollectionCityTags', () => {
  it('replaces old city tags with target city tags while keeping non-city tags', () => {
    const tags = replaceCollectionCityTags(['Đà Nẵng', 'Da Nang', 'Street Food'], 'ha-noi')
    expect(tags).toEqual(['Street Food', 'Hà Nội', 'Ha Noi'])
  })

  it('adds canonical city tags when existing tags are empty', () => {
    const tags = replaceCollectionCityTags(null, 'singapore')
    expect(tags).toEqual(['Singapore'])
  })
})

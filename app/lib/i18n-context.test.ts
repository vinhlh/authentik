import { describe, expect, it } from 'vitest'
import { resolveI18nText } from './i18n-context'

describe('resolveI18nText', () => {
  it('uses english value when available in english mode', () => {
    const value = resolveI18nText(
      { name_en: 'Saigon Breakfasts', name_vi: 'Ăn Sáng Sài Gòn' },
      'name',
      'en'
    )

    expect(value).toBe('Saigon Breakfasts')
  })

  it('falls back to vietnamese when english value is missing', () => {
    const value = resolveI18nText(
      { name_en: null, name_vi: 'Quán Ăn Tiếp Khách' },
      'name',
      'en'
    )

    expect(value).toBe('Quán Ăn Tiếp Khách')
  })

  it('treats empty strings as missing values', () => {
    const value = resolveI18nText(
      { name_en: '   ', name_vi: 'Quán Cũ', name: 'Legacy Name' },
      'name',
      'en'
    )

    expect(value).toBe('Quán Cũ')
  })

  it('falls back to english in vietnamese mode when vietnamese is missing', () => {
    const value = resolveI18nText(
      { name_vi: null, name_en: 'Nha Trang Seafood Tour' },
      'name',
      'vi'
    )

    expect(value).toBe('Nha Trang Seafood Tour')
  })
})

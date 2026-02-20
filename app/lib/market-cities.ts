export type MarketRegion = 'vietnam' | 'singapore'

export type MarketCityId =
  | 'da-nang'
  | 'da-lat'
  | 'nha-trang'
  | 'ha-noi'
  | 'ho-chi-minh'
  | 'hue'
  | 'singapore'

export interface MarketCity {
  id: MarketCityId
  name: string
  country: string
  shortLabel: string
  region: MarketRegion
  latitude: number
  longitude: number
  aliases: string[]
}

export const MARKET_CITIES: MarketCity[] = [
  {
    id: 'da-nang',
    name: 'Da Nang',
    country: 'Vietnam',
    shortLabel: 'DN',
    region: 'vietnam',
    latitude: 16.0544,
    longitude: 108.2022,
    aliases: ['da nang', 'đà nẵng', 'danang'],
  },
  {
    id: 'da-lat',
    name: 'Da Lat',
    country: 'Vietnam',
    shortLabel: 'DL',
    region: 'vietnam',
    latitude: 11.9404,
    longitude: 108.4583,
    aliases: ['da lat', 'đà lạt', 'dalat'],
  },
  {
    id: 'nha-trang',
    name: 'Nha Trang',
    country: 'Vietnam',
    shortLabel: 'NT',
    region: 'vietnam',
    latitude: 12.2388,
    longitude: 109.1967,
    aliases: ['nha trang', 'nhatrang'],
  },
  {
    id: 'ha-noi',
    name: 'Ha Noi',
    country: 'Vietnam',
    shortLabel: 'HN',
    region: 'vietnam',
    latitude: 21.0278,
    longitude: 105.8342,
    aliases: ['ha noi', 'hanoi', 'hà nội'],
  },
  {
    id: 'ho-chi-minh',
    name: 'Ho Chi Minh City',
    country: 'Vietnam',
    shortLabel: 'HCM',
    region: 'vietnam',
    latitude: 10.8231,
    longitude: 106.6297,
    aliases: [
      'ho chi minh',
      'ho chi minh city',
      'hồ chí minh',
      'hcm',
      'hcmc',
      'saigon',
      'sài gòn',
    ],
  },
  {
    id: 'hue',
    name: 'Hue',
    country: 'Vietnam',
    shortLabel: 'Hue',
    region: 'vietnam',
    latitude: 16.4637,
    longitude: 107.5909,
    aliases: ['hue', 'huế'],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    shortLabel: 'SG',
    region: 'singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    aliases: ['singapore', 'sg'],
  },
]

const CITY_BY_ID = new Map<MarketCityId, MarketCity>(
  MARKET_CITIES.map(city => [city.id, city])
)

export const DEFAULT_MARKET_CITY: MarketCity = CITY_BY_ID.get('da-nang')!

const COLLECTION_CITY_TAGS_BY_ID: Record<MarketCityId, string[]> = {
  'da-nang': ['Đà Nẵng', 'Da Nang'],
  'da-lat': ['Đà Lạt', 'Da Lat', 'Dalat'],
  'nha-trang': ['Nha Trang'],
  'ha-noi': ['Hà Nội', 'Ha Noi'],
  'ho-chi-minh': ['Hồ Chí Minh', 'Ho Chi Minh City', 'Saigon'],
  hue: ['Huế', 'Hue'],
  singapore: ['Singapore'],
}
const ALL_COLLECTION_CITY_TAGS = new Set(
  MARKET_CITIES.flatMap(city => COLLECTION_CITY_TAGS_BY_ID[city.id] || [])
)

function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getMarketCityById(id?: string | null): MarketCity {
  if (!id) return DEFAULT_MARKET_CITY
  return CITY_BY_ID.get(id as MarketCityId) || DEFAULT_MARKET_CITY
}

export function getCollectionCityTags(city: MarketCity | MarketCityId): string[] {
  const cityId = typeof city === 'string' ? city : city.id
  return [...(COLLECTION_CITY_TAGS_BY_ID[cityId] || [])]
}

/**
 * Replace city tags with the selected city's canonical tag set while keeping non-city tags.
 */
export function replaceCollectionCityTags(
  existingTags: string[] | null | undefined,
  city: MarketCity | MarketCityId
): string[] {
  const merged = new Set<string>()

  for (const tag of existingTags || []) {
    const normalized = tag.trim()
    if (!normalized) continue
    if (!ALL_COLLECTION_CITY_TAGS.has(normalized)) {
      merged.add(normalized)
    }
  }

  for (const tag of getCollectionCityTags(city)) {
    const normalized = tag.trim()
    if (normalized) merged.add(normalized)
  }

  return Array.from(merged)
}

export function detectMarketCityFromText(...texts: Array<string | null | undefined>): MarketCity {
  const combined = normalizeText(
    texts
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  )

  if (!combined) return DEFAULT_MARKET_CITY

  for (const city of MARKET_CITIES) {
    if (city.aliases.some(alias => combined.includes(normalizeText(alias)))) {
      return city
    }
  }

  return DEFAULT_MARKET_CITY
}

export function getCityLocationBias(city: MarketCity): { lat: number; lng: number } {
  return {
    lat: city.latitude,
    lng: city.longitude,
  }
}

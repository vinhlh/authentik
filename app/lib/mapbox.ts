/**
 * Mapbox configuration and utilities
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

if (!MAPBOX_TOKEN) {
  console.warn('Missing Mapbox token - map features will not work')
}

/**
 * Market city center coordinates
 */
export const CITY_CENTERS = {
  daNang: { longitude: 108.2022, latitude: 16.0544, zoom: 13 },
  daLat: { longitude: 108.4583, latitude: 11.9404, zoom: 13 },
  nhaTrang: { longitude: 109.1967, latitude: 12.2388, zoom: 13 },
  haNoi: { longitude: 105.8342, latitude: 21.0278, zoom: 13 },
  hoChiMinh: { longitude: 106.6297, latitude: 10.8231, zoom: 13 },
  hue: { longitude: 107.5909, latitude: 16.4637, zoom: 13 },
  singapore: { longitude: 103.8198, latitude: 1.3521, zoom: 12 },
} as const

export const DA_NANG_CENTER = CITY_CENTERS.daNang

/**
 * Map style URLs
 */
export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
}

/**
 * Pin colors for different restaurant classifications
 */
export const PIN_COLORS = {
  LOCAL_FAVORITE: '#059669', // Green
  TOURIST_SPOT: '#3B82F6',   // Blue
  DEFAULT: '#D97706'         // Orange
}

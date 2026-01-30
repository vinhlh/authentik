/**
 * Mapbox configuration and utilities
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

if (!MAPBOX_TOKEN) {
  console.warn('Missing Mapbox token - map features will not work')
}

/**
 * Da Nang city center coordinates
 */
export const DA_NANG_CENTER = {
  longitude: 108.2022,
  latitude: 16.0544,
  zoom: 13
}

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

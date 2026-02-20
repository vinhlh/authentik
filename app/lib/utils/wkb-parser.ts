type GeoPointLike = {
  type?: string
  coordinates?: number[]
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
  x?: number
  y?: number
}

/**
 * Parse restaurant point data into {lat, lng}.
 * Supports:
 * - GeoJSON-like points: { type: 'Point', coordinates: [lng, lat] }
 * - WKB/EWKB hex strings from PostGIS
 * - WKT "POINT(lng lat)" strings
 */
export function parseWkbPoint(input: string | GeoPointLike | null | undefined): { lat: number; lng: number } | null {
  if (!input) {
    return null
  }

  if (typeof input === 'object') {
    return parseObjectPoint(input)
  }

  const normalizedInput = input.trim().replace(/^0x/i, '')
  if (!normalizedInput) {
    return null
  }

  const wktMatch = normalizedInput.match(/^POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i)
  if (wktMatch) {
    const lng = Number(wktMatch[1])
    const lat = Number(wktMatch[2])
    return normalizeCoordinate(lat, lng)
  }

  try {
    // EWKB POINT with SRID: 01 01000020 [SRID] [X][Y] => coords start at hex index 18
    // WKB POINT without SRID: 01 01000000 [X][Y] => coords start at hex index 10
    const upper = normalizedInput.toUpperCase()
    let coordsStart = -1

    if (upper.startsWith('0101000020')) {
      coordsStart = 18
    } else if (upper.startsWith('0101000000')) {
      coordsStart = 10
    } else if (normalizedInput.length >= 50) {
      coordsStart = 18
    } else if (normalizedInput.length >= 42) {
      coordsStart = 10
    } else {
      return null
    }

    const xHex = normalizedInput.substring(coordsStart, coordsStart + 16)
    const yHex = normalizedInput.substring(coordsStart + 16, coordsStart + 32)

    const lng = hexToDouble(xHex)
    const lat = hexToDouble(yHex)
    return normalizeCoordinate(lat, lng)
  } catch (e) {
    console.error('Failed to parse WKB:', e)
    return null
  }
}

function parseObjectPoint(point: GeoPointLike): { lat: number; lng: number } | null {
  if (Array.isArray(point.coordinates) && point.coordinates.length >= 2) {
    const [lng, lat] = point.coordinates
    return normalizeCoordinate(Number(lat), Number(lng))
  }

  if (point.lat !== undefined && point.lng !== undefined) {
    return normalizeCoordinate(Number(point.lat), Number(point.lng))
  }

  if (point.latitude !== undefined && point.longitude !== undefined) {
    return normalizeCoordinate(Number(point.latitude), Number(point.longitude))
  }

  if (point.y !== undefined && point.x !== undefined) {
    return normalizeCoordinate(Number(point.y), Number(point.x))
  }

  return null
}

function normalizeCoordinate(lat: number, lng: number): { lat: number; lng: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null
  }
  return { lat, lng }
}

/**
 * Convert a 16-char hex string (little-endian) to a double-precision float
 */
function hexToDouble(hex: string): number {
  if (hex.length !== 16 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return Number.NaN
  }

  // Reverse byte order (little endian to big endian)
  const bytes: string[] = []
  for (let i = 0; i < 16; i += 2) {
    bytes.unshift(hex.substring(i, i + 2))
  }
  const bigEndianHex = bytes.join('')

  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)

  // Write bytes
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, parseInt(bigEndianHex.substring(i * 2, i * 2 + 2), 16))
  }

  return view.getFloat64(0)
}

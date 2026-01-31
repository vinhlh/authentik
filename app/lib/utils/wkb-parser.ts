/**
 * Parse PostGIS WKB (Well-Known Binary) hex string to extract lat/lng coordinates.
 * WKB format for POINT:
 * - Bytes 0: Byte order (01 = little endian)
 * - Bytes 1-4: Geometry type (01000020 = Point with SRID)
 * - Bytes 5-8: SRID
 * - Bytes 9-16: X coordinate (longitude) as double
 * - Bytes 17-24: Y coordinate (latitude) as double
 */
export function parseWkbPoint(wkbHex: string): { lat: number; lng: number } | null {
  if (!wkbHex || wkbHex.length < 50) {
    return null;
  }

  try {
    // WKB with SRID starts at byte 18 (after header) for coordinates
    // Format: 01 (byte order) + 01000020 (geom type with SRID) + E6100000 (SRID 4326) = 18 hex chars
    // Then 16 hex chars for X (lng), 16 hex chars for Y (lat)

    const coordsStart = 18; // After the header (01 01000020 E6100000)
    const xHex = wkbHex.substring(coordsStart, coordsStart + 16);
    const yHex = wkbHex.substring(coordsStart + 16, coordsStart + 32);

    const lng = hexToDouble(xHex);
    const lat = hexToDouble(yHex);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return { lat, lng };
  } catch (e) {
    console.error('Failed to parse WKB:', e);
    return null;
  }
}

/**
 * Convert a 16-char hex string (little-endian) to a double-precision float
 */
function hexToDouble(hex: string): number {
  // Reverse byte order (little endian to big endian)
  const bytes = [];
  for (let i = 0; i < 16; i += 2) {
    bytes.unshift(hex.substring(i, i + 2));
  }
  const bigEndianHex = bytes.join('');

  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  // Write bytes
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, parseInt(bigEndianHex.substring(i * 2, i * 2 + 2), 16));
  }

  return view.getFloat64(0);
}

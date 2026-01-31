/**
 * YouTube Thumbnail Utility
 * Provides URLs for YouTube video thumbnails at various resolutions
 */

export interface YouTubeThumbnails {
  default: string;      // 120x90
  medium: string;       // 320x180
  high: string;         // 480x360
  standard: string;     // 640x480
  maxres: string;       // 1280x720
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get all thumbnail URLs for a YouTube video
 */
export function getYouTubeThumbnails(videoIdOrUrl: string): YouTubeThumbnails | null {
  // Check if it's a URL or video ID
  const videoId = videoIdOrUrl.includes('youtube') || videoIdOrUrl.includes('youtu.be')
    ? extractVideoId(videoIdOrUrl)
    : videoIdOrUrl;

  if (!videoId) {
    return null;
  }

  return {
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

/**
 * Get the best available thumbnail URL
 * Tries maxres first, falls back to lower resolutions
 */
export async function getBestThumbnailUrl(videoIdOrUrl: string): Promise<string | null> {
  const thumbnails = getYouTubeThumbnails(videoIdOrUrl);
  if (!thumbnails) return null;

  // Try resolutions from highest to lowest
  const resolutions = ['maxres', 'standard', 'high', 'medium', 'default'] as const;

  for (const res of resolutions) {
    const url = thumbnails[res];
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
    } catch {
      continue;
    }
  }

  // Fallback to high quality (usually always available)
  return thumbnails.high;
}

/**
 * Download YouTube thumbnail to local file
 */
export async function downloadThumbnail(
  videoIdOrUrl: string,
  destPath: string,
  resolution: keyof YouTubeThumbnails = 'maxres'
): Promise<boolean> {
  const thumbnails = getYouTubeThumbnails(videoIdOrUrl);
  if (!thumbnails) return false;

  const url = thumbnails[resolution];

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try fallback to standard if maxres not available
      if (resolution === 'maxres') {
        return downloadThumbnail(videoIdOrUrl, destPath, 'standard');
      }
      return false;
    }

    const { writeFile } = await import('fs/promises');
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(destPath, buffer);
    return true;
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    return false;
  }
}

/**
 * Get srcSet for responsive images
 * Returns a srcSet string for use in img tags
 */
export function getThumbnailSrcSet(videoIdOrUrl: string): string | null {
  const thumbnails = getYouTubeThumbnails(videoIdOrUrl);
  if (!thumbnails) return null;

  return [
    `${thumbnails.medium} 320w`,
    `${thumbnails.high} 480w`,
    `${thumbnails.standard} 640w`,
    `${thumbnails.maxres} 1280w`,
  ].join(', ');
}

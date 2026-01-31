import youtubedl from 'youtube-dl-exec'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
// @ts-ignore
import ffmpegPath from 'ffmpeg-static'

/**
 * Download audio from YouTube video to a temporary file
 * Returns the path to the downloaded file
 */
export async function downloadYouTubeAudio(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`

  // Use a unique temp file path (without extension, yt-dlp adds it)
  const tempDir = os.tmpdir()
  const baseName = `yt_${videoId}_${uuidv4()}`
  const outputPath = path.join(tempDir, baseName)
  const expectedFile = `${outputPath}.mp3`

  console.log(`   ⬇️ Downloading audio for ${videoId} using yt-dlp...`)

  try {
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: `${outputPath}.%(ext)s`,
      ffmpegLocation: ffmpegPath as string,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    })

    // Check if file exists
    if (!fs.existsSync(expectedFile)) {
      throw new Error(`File not found at ${expectedFile} after download`)
    }

    console.log(`   ✅ Audio downloaded: ${expectedFile}`)
    return expectedFile

  } catch (error) {
    console.error('   ❌ yt-dlp download failed:', error)
    throw error
  }
}

/**
 * Delete a file (cleanup)
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  } catch (error) {
    console.warn(`Failed to delete temp file ${filePath}`, error)
  }
}


import { readdir, stat } from 'fs/promises'
import path from 'path'
import { processLocalPhotos } from '../lib/photo-pipeline'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  const imagesDir = path.join(process.cwd(), 'images')

  try {
    const collections = await readdir(imagesDir)

    console.log(`🔍 Scanning ${collections.length} collections for processing...`)

    for (const collection of collections) {
      const collectionPath = path.join(imagesDir, collection)
      const stats = await stat(collectionPath)

      if (!stats.isDirectory()) continue

      // Find files in collection
      const files = await readdir(collectionPath)

      // Group by place ID (first part of filename)
      // Filename format: {shortId}-candidate-{index}.jpg
      const placeIds = new Set<string>()
      for (const file of files) {
        const match = file.match(/^([a-zA-Z0-9]+)-candidate-/)
        if (match) {
          placeIds.add(match[1])
        }
      }

      if (placeIds.size > 0) {
        console.log(`\n📂 Processing collection: ${collection}`)

        for (const shortId of placeIds) {
          console.log(`   📍 Processing place: ${shortId}`)
          await processLocalPhotos(collectionPath, shortId)
        }
      }
    }

    console.log('\n✅ All photos processing check complete.')

  } catch (error) {
    console.error('Error in photo processor:', error)
    process.exit(1)
  }
}

main()

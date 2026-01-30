#!/usr/bin/env node

/**
 * Content Extraction Worker
 * CLI tool for extracting restaurant data from videos
 */

import './setup-env'
import { extractFromVideo, batchExtract } from '../lib/extraction-pipeline'

const rawArgs = process.argv.slice(2)

// Parse flags
const isDryRun = rawArgs.includes('--dry') || rawArgs.includes('-d')
const args = rawArgs.filter(arg => arg !== '--dry' && arg !== '-d')

async function main() {
  console.log('🍜 Authentik Content Extraction Worker\n')

  if (args.length === 0) {
    printUsage()
    process.exit(1)
  }

  const firstArg = args[0]

  if (firstArg === 'batch') {
    await handleBatch(args[1])
  } else if (firstArg === 'help' || firstArg === '--help' || firstArg === '-h') {
    printUsage()
  } else if (firstArg === 'extract') {
    // Explicit syntax: npm run extract extract <url>
    await handleExtract(args[1], args[2])
  } else {
    // Implicit syntax: npm run extract <url>
    // Check if it looks like a URL? Or just default to extract
    if (firstArg.startsWith('http')) {
      await handleExtract(args[0], args[1])
    } else {
      console.error(`Unknown command or invalid URL: ${firstArg}`)
      printUsage()
      process.exit(1)
    }
  }
}

async function handleExtract(url: string, creator: string | undefined) {
  const creatorName = creator || 'Unknown Creator'

  if (!url) {
    console.error('❌ Error: Video URL is required')
    console.log('\nUsage: npm run extract <video-url> [creator-name] [--dry]')
    process.exit(1)
  }

  try {
    const result = await extractFromVideo(url, creatorName, { dry: isDryRun })

    if (result.dry) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes were made')
      console.log(`\nCollection would be: ${result.collection.name}`)
      console.log(`Restaurants would be imported: ${result.stats.imported}/${result.stats.totalMentions}`)
      console.log('\nRun without --dry to import these restaurants.')
    } else {
      console.log('\n✅ Extraction complete!')
      console.log(`\nCollection ID: ${result.collection.id}`)
      console.log(`Collection Name: ${result.collection.name}`)
      console.log(`\nRestaurants imported: ${result.stats.imported}/${result.stats.totalMentions}`)
    }
  } catch (error) {
    console.error('\n❌ Extraction failed:', error)
    process.exit(1)
  }
}

async function handleBatch(pathArg: string | undefined) {
  const filePath = pathArg

  if (!filePath) {
    console.error('❌ Error: Batch file path is required')
    console.log('\nUsage: npm run extract batch <file-path> [--dry]')
    console.log('\nFile format (JSON):')
    console.log('[')
    console.log('  { "url": "https://youtube.com/...", "creatorName": "Food Vlogger" },')
    console.log('  { "url": "https://tiktok.com/...", "creatorName": "Local Foodie" }')
    console.log(']')
    process.exit(1)
  }

  try {
    const fs = await import('fs/promises')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const videos = JSON.parse(fileContent)

    if (!Array.isArray(videos)) {
      throw new Error('Batch file must contain an array of videos')
    }

    console.log(`📋 Processing ${videos.length} videos...${isDryRun ? ' (DRY RUN)' : ''}\n`)

    const results = await batchExtract(videos, { dry: isDryRun })

    console.log('\n' + '='.repeat(60))
    console.log(`${isDryRun ? '🔍 DRY RUN' : '✅'} Batch extraction ${isDryRun ? 'preview' : 'complete'}!`)
    console.log('='.repeat(60))
    console.log(`\nTotal videos processed: ${results.length}`)
    console.log(`Total restaurants ${isDryRun ? 'would be imported' : 'imported'}: ${results.reduce((sum, r) => sum + r.stats.imported, 0)}`)
    console.log(`Total restaurants verified: ${results.reduce((sum, r) => sum + r.stats.verified, 0)}`)
    console.log(`Total mentions: ${results.reduce((sum, r) => sum + r.stats.totalMentions, 0)}`)

    if (isDryRun) {
      console.log('\nRun without --dry to import these restaurants.')
    }
  } catch (error) {
    console.error('\n❌ Batch extraction failed:', error)
    process.exit(1)
  }
}

function printUsage() {
  console.log('Usage:')
  console.log('  npm run extract -- <video-url> [creator-name] [--dry]')
  console.log('  npm run extract -- batch <batch-file.json> [--dry]')
  console.log('  npm run extract -- help')
  console.log('')
  console.log('Options:')
  console.log('  --dry, -d    Preview mode')
  console.log('')
  console.log('Examples:')
  console.log('  npm run extract -- "https://youtube.com/..." "Vinh Le"')
  console.log('  npm run extract -- batch videos.json')
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

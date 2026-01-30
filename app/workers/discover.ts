#!/usr/bin/env node

/**
 * Content Discovery Worker
 * CLI tool for finding new content candidates
 */

import './setup-env'
import { searchCandidates } from '../lib/discovery-engine'

const args = process.argv.slice(2)

async function main() {
  console.log('🔍 Authentik Content Discovery Worker\n')

  const query = args[0] || 'Da Nang street food'

  console.log(`Searching for: "${query}"...`)


  try {
    let candidates: any[] = []

    if (query.includes('tiktok.com')) {
      // It's a TikTok channel URL
      const { discoverTikTokChannel } = await import('../lib/tiktok-discovery')
      candidates = await discoverTikTokChannel(query)
    } else {
      // Standard YouTube search
      candidates = await searchCandidates(query)
    }

    console.log(`\nFound ${candidates.length} candidates:\n`)

    candidates.forEach((c, i) => {
      console.log(`${i + 1}. [${c.score}/10] ${c.title}`)
      console.log(`   By: ${c.channelName}`)
      console.log(`   url: ${c.url}`)
      console.log(`   Why: ${c.reason || 'N/A'}`)
      console.log('')
    })

    console.log('To extract a collection from one of these, run:')
    if (candidates.length > 0) {
      console.log(`npm run extract "${candidates[0].url}" "${candidates[0].channelName}"`)
    }

  } catch (error) {
    console.error('Discovery failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)

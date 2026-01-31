import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn(`⚠️ Could not load .env.local from ${envPath}`)
  // Try loading .env as fallback
  const fallbackPath = path.resolve(process.cwd(), '.env')
  const fallbackResult = dotenv.config({ path: fallbackPath })
  if (!fallbackResult.error) {
    console.log(`✅ Loaded environment from .env`)
  }
} else {
  console.log(`✅ Loaded environment from .env.local`)
}

// Debug logs
const key = process.env.YOUTUBE_API_KEY
if (key) {
  console.log(`🔑 YOUTUBE_API_KEY loaded: ${key.substring(0, 5)}... (len: ${key.length})`)
} else {
  console.error(`❌ YOUTUBE_API_KEY is MISSING in process.env`)
  console.log('Env keys available:', Object.keys(process.env).filter(k => k.endsWith('_KEY') || k.startsWith('NEXT_')))
}

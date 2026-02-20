
import fs from 'fs';
import path from 'path';
import { parseYouTubeVideo } from './app/lib/parsers/youtube';

async function main() {
  // Manual Env Loading
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log(`Loading .env.local from ${envPath}`);
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      });
    } else {
      console.warn('.env.local not found');
    }
  } catch (e) {
    console.error('Failed to load env:', e);
  }

  // Check critical keys
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY missing. Audio transcription will be skipped.');
    // Mock it to force execution of the path if that's what we want to test?
    // No, if I mock it, the API call will fail later.
    // But I want to test yt-dlp.
    // I will mock it just to reach the yt-dlp call in transcribeAudio if needed.
    process.env.GEMINI_API_KEY = 'mock_key_for_testing_yt_dlp';
  }

  const videoId = 'sbwZ61KrY2E';
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`Testing extraction for: ${url}`);
  try {
    const result = await parseYouTubeVideo(url);
    console.log('Success!', result.restaurants.length, 'restaurants found.');
    console.log('Metadata:', result.metadata?.title);
  } catch (error) {
    console.error('Failed:', error);
  }
}

main();

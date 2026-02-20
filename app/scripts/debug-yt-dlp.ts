
import { getVideoTranscript } from '../lib/parsers/youtube';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const videoId = 'wTtJbB9EKoc';
  console.log(`Testing transcript fetch for ${videoId}...`);
  try {
    const result = await getVideoTranscript(videoId);
    if (result) {
      console.log('✅ Success! Transcript length:', result.length);
      console.log('Snippet:', result.substring(0, 100));
    } else {
      console.log('❌ Failed: No transcript returned');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

run();

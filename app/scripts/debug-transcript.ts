import { YoutubeTranscript } from 'youtube-transcript';

async function debug() {
  const videoId = 'wTtJbB9EKoc';
  console.log(`Checking transcripts for ${videoId}...`);

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`✅ Default Success! Length: ${transcript.length}`);
  } catch (e: any) {
    console.log(`❌ Default Failed: ${e.message}`);
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi' });
    console.log(`✅ 'vi' Success! Length: ${transcript.length}`);
  } catch (e: any) {
    console.log(`❌ 'vi' Failed: ${e.message}`);
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi-VN' });
    console.log(`✅ 'vi-VN' Success! Length: ${transcript.length}`);
  } catch (e: any) {
    console.log(`❌ 'vi-VN' Failed: ${e.message}`);
  }
}

debug();

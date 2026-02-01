const { YoutubeTranscript } = require('youtube-transcript');

async function debug() {
  const videoId = 'wTtJbB9EKoc';
  console.log(`Checking transcripts for ${videoId}...`);

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`✅ Default Success! Length: ${transcript.length}`);
    console.log(`   Sample: ${transcript[0].text}`);
  } catch (e) {
    console.log(`❌ Default Failed: ${e.message}`);
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi' });
    console.log(`✅ 'vi' Success! Length: ${transcript.length}`);
  } catch (e) {
    console.log(`❌ 'vi' Failed: ${e.message}`);
  }
}

debug();

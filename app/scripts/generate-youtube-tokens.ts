import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

async function generateTokens() {
  console.log('🛡️  Generating YouTube Trusted Session Tokens via Docker...');
  console.log('   This may take a minute if the image needs to be downloaded...');

  try {
    // Run the yt-session-generator via Docker
    const { stdout, stderr } = await execAsync('docker run --pull always ghcr.io/imputnet/yt-session-generator');

    // Look for po_token and visitor_data in the output
    // The output typically looks like: po_token: XXX visitor_data: YYY
    const output = stdout + stderr;

    const poTokenMatch = output.match(/po_token:\s*([^\s]+)/);
    const visitorDataMatch = output.match(/visitor_data:\s*([^\s]+)/);

    if (poTokenMatch && visitorDataMatch) {
      const poToken = poTokenMatch[1];
      const visitorData = visitorDataMatch[1];

      console.log('\n✅ Success! Tokens generated:\n');
      console.log(`PO_TOKEN: ${poToken}`);
      console.log(`VISITOR_DATA: ${visitorData}`);

      console.log('\nTo use these in the app, add them to your .env.local:');
      console.log(`YOUTUBE_PO_TOKEN="${poToken}"`);
      console.log(`YOUTUBE_VISITOR_DATA="${visitorData}"`);
    } else {
      console.error('\n❌ Could not find tokens in output.');
      console.log('Raw Output:', output);
    }
  } catch (error: any) {
    console.error('\n❌ Error running generator:', error.message);
    if (error.message.includes('docker')) {
      console.log('\nTip: Ensure Docker Desktop is running on your machine.');
    }
  }
}

generateTokens();

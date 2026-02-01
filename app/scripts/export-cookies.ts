import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = util.promisify(exec);

async function exportCookies() {
  const browser = process.argv[2] || 'chrome';
  const outputFile = path.join(process.cwd(), 'youtube-cookies.txt');

  console.log(`🍪 Exporting cookies from ${browser}...`);

  try {
    // We run a dummy yt-dlp command to force it to export cookies to a file
    const cmd = `yt-dlp --cookies-from-browser ${browser} --cookies "${outputFile}" --skip-download "https://www.youtube.com/watch?v=aqz-KE-bpKQ"`;

    console.log(`   Running: ${cmd}`);
    await execAsync(cmd);

    if (fs.existsSync(outputFile)) {
      console.log(`✅ Success! Cookies exported to: ${outputFile}`);
      console.log(`\nTo use these in the app, ensure your .env.local has:`);
      console.log(`YOUTUBE_COOKIES_FILE=youtube-cookies.txt`);
    } else {
      console.error(`❌ Export failed: Output file not created.`);
    }
  } catch (error: any) {
    console.error(`❌ Error exporting cookies:`, error.message);
    if (error.message.includes('Could not find browser')) {
      console.log(`\nTip: Try specifying your browser, e.g.: npm run export-cookies safari`);
    }
  }
}

exportCookies();

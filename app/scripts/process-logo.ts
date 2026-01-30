import sharp from 'sharp';
import path from 'path';

const INPUT_PATH = '/Users/v.le.2/.gemini/antigravity/brain/2968218d-5ed5-4d1f-ad7a-1779cf7d2aa8/authentik_logo_clean_white_bg_1769785310627.png';
const OUTPUT_PATH = '/Users/v.le.2/Works/vinhlh/authentik/app/public/logo.png';

async function processLogo() {
  try {
    console.log('Processing logo...');

    const image = sharp(INPUT_PATH);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Tolerance for "white"
    const threshold = 240;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If pixel is close to white, make it transparent
      if (r > threshold && g > threshold && b > threshold) {
        data[i + 3] = 0; // Alpha = 0
      }
    }

    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
      .trim({ threshold: 10 }) // Still trim extra empty space
      .toFile(OUTPUT_PATH);

    console.log(`Logo processed with transparency and saved to ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error processing logo:', error);
  }
}

processLogo();

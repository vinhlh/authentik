
import sharp from 'sharp';
import path from 'path';

const INPUT_PATH = path.resolve(__dirname, '../public/logo.png');
const OUTPUT_PATH = path.resolve(__dirname, '../app/icon.png'); // Next.js App Router uses app/icon.png

async function generateFavicon() {
  try {
    console.log(`Generating favicon from ${INPUT_PATH}...`);

    await sharp(INPUT_PATH)
      .resize(512, 512, { // 512x512 is good for high-res icon.png
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(OUTPUT_PATH);

    console.log(`✅ Favicon generated at ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon();

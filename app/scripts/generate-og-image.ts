
import sharp from 'sharp';
import path from 'path';

const LOGO_PATH = path.resolve(__dirname, '../public/logo.png');
const OUTPUT_PATH = path.resolve(__dirname, '../public/og-image.jpg');

async function generateOGImage() {
  try {
    console.log(`Generating OG Image from ${LOGO_PATH}...`);

    // Create a 1200x630 canvas (standard OG size)
    const width = 1200;
    const height = 630;
    const logoSize = 400;

    // Resize logo to fit nicely in center
    const logo = await sharp(LOGO_PATH)
      .resize(logoSize, logoSize, { fit: 'contain' })
      .toBuffer();

    // Composite logo onto white background
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 250, g: 250, b: 249, alpha: 1 } // #fafaf9 (bg-stone-50)
      }
    })
      .composite([
        { input: logo, gravity: 'center' }
      ])
      .jpeg({ quality: 90 })
      .toFile(OUTPUT_PATH);

    console.log(`✅ OG Image generated at ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('Error generating OG image:', error);
  }
}

generateOGImage();

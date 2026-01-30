
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ No GEMINI_API_KEY found in .env.local');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log('Fetching available models...');
    // listModels is on the genAI instance directly not usually exposed in node sdk simply?
    // Actually the SDK might not expose listModels on the main class easily in all versions.
    // Let's try the standard fetch way if SDK doesn't or check SDK docs.
    // Wait, typical usage:
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // But error said "Call ListModels".

    // Using simple fetch to be sure.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
      console.log('\nAvailable Models:');
      data.models.forEach((m: any) => {
        if (m.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`- ${m.name} (${m.displayName})`);
        }
      });
    } else {
      console.error('Failed to list models:', data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();

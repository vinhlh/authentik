
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY;

/**
 * Upload a file to Gemini for processing
 * Waits until file is ACTIVE
 */
export async function uploadToGemini(filePath: string, mimeType: string) {
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const fileManager = new GoogleAIFileManager(apiKey);

  console.log(`   📤 Uploading to Gemini (${mimeType})...`);

  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: "YouTube Audio Extraction",
  });

  let file = uploadResult.file;
  console.log(`   ⏳ File uploaded: ${file.name}. State: ${file.state}`);

  // Wait for file to be active
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Video processing failed.");
  }

  console.log(`\n   ✅ File is ready: ${file.uri}`);
  return file;
}

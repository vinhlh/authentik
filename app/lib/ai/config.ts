
/**
 * Centralized Gemini AI Configuration
 */

export const GEMINI_CONFIG = {
  // Use gemini-2.0-flash as it is available and supports multimodal
  // Can be overridden by GEMINI_MODEL_NAME env var
  modelName: process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash',

  // Standard generation config
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 8192,
    responseMimeType: "application/json"
  },

  // Image Generation Model
  imageModelName: 'gemini-2.0-flash-exp-image-generation'
}

export function getGeminiModelConfig() {
  return {
    model: GEMINI_CONFIG.modelName,
    generationConfig: GEMINI_CONFIG.generationConfig
  }
}

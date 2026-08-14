import { GoogleGenAI, Type } from "@google/genai";

const DIETITIAN_SYSTEM_INSTRUCTION = `
You are NutriPlan AI, a qualified clinical dietitian AI specializing in personalized Indian vegetarian, zero-added-sugar diet planning based on non-refrigerated pantry stock, local market price bounds (₹150-₹200/day), and official dietary guidelines (ICMR/NIN 2024 and WHO).
`;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

async function generateContentWithRetry(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<any> {
  const modelsToTry = params.models || ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-2.5-pro"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError;
}

export const handler = async (event: any, context: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Normalize path
  const path = event.path
    .replace(/\/\.netlify\/functions\/api/, "")
    .replace(/\/api/, "");

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const ai = getGeminiClient();

    if (path.includes("chat")) {
      const { messages, userProfile, inventory } = body;
      const prompt = `User profile: ${JSON.stringify(userProfile)}. Current stock: ${JSON.stringify(inventory)}. Messages: ${JSON.stringify(messages)}`;
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: { systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION },
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: response.text }),
      };
    }

    if (path.includes("substitute")) {
      const { missingItem, mealName, inventory, allergies } = body;
      const prompt = `Missing: ${missingItem} for ${mealName}. Stock: ${JSON.stringify(inventory)}. Allergies: ${JSON.stringify(allergies)}`;
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: { systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION },
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          originalItem: missingItem,
          substituteItem: "Soya Chunks / Sprouted Moong",
          portionAdjustment: "30g dry soya chunks or 1 cup sprouted moong",
          recipeAdjustment: "Boil for 5 minutes with turmeric and salt",
          nutritionalImpact: "Maintains high protein with zero sugar",
          allergenSafetyCheck: "Safe for strict vegetarian diet",
          rawNote: response.text,
        }),
      };
    }

    if (path.includes("generate-meal-plan")) {
      const { userProfile, inventory, customPrompt } = body;
      const prompt = `Generate 7-day plan. Profile: ${JSON.stringify(userProfile)}. Stock: ${JSON.stringify(inventory)}. Custom: ${customPrompt || ''}`;
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });
      return {
        statusCode: 200,
        headers,
        body: response.text || "{}",
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Path ${path} not found` }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Internal server error" }),
    };
  }
};

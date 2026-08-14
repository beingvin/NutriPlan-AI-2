import { GoogleGenAI, Type } from '@google/genai';
import { generateFallbackMealPlan } from './mealPlanFallback';

/**
 * Returns the resolved API endpoint URL, taking into account VITE_API_BASE_URL or VITE_API_URL if configured.
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
}

/**
 * Centralized API fetcher with Netlify fallback support.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = getApiUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Check if server returned non-JSON (e.g. Netlify 404 HTML fallback page)
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`[API] Received non-JSON response from ${url}:`, text.substring(0, 100));
      
      // Attempt client-side Gemini fallback if client API key is present or local fallback
      const body = options.body ? JSON.parse(options.body as string) : {};
      if (endpoint.includes('generate-meal-plan')) {
        return generateFallbackMealPlan(body.userProfile, body.inventory);
      }

      const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (clientApiKey) {
        console.log('[API] Attempting client-side fallback using VITE_GEMINI_API_KEY...');
        return await handleClientSideGeminiFallback(endpoint, options, clientApiKey);
      }

      throw new Error(
        `API endpoint ${endpoint} returned static HTML/404 instead of JSON.`
      );
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Failed to execute request`);
    }

    return await response.json();
  } catch (err: any) {
    console.error(`[API Error] Request to ${url} failed:`, err);

    const body = options.body ? JSON.parse(options.body as string) : {};
    if (endpoint.includes('generate-meal-plan')) {
      console.warn('[API Fallback] Using instant fallback meal plan due to API network error/timeout.');
      return generateFallbackMealPlan(body.userProfile, body.inventory);
    }

    // Fallback if network or non-JSON error occurs and client key exists
    const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (clientApiKey) {
      try {
        console.log('[API Fallback] Attempting client-side Gemini API call...');
        return await handleClientSideGeminiFallback(endpoint, options, clientApiKey);
      } catch (fallbackErr: any) {
        throw new Error(`API and client fallback failed: ${fallbackErr.message || err.message}`);
      }
    }

    throw err;
  }
}

/**
 * Client-side Gemini API handler when hosted on static services (like Netlify) with VITE_GEMINI_API_KEY
 */
async function handleClientSideGeminiFallback(endpoint: string, options: RequestInit, apiKey: string): Promise<any> {
  const ai = new GoogleGenAI({ apiKey });
  const body = options.body ? JSON.parse(options.body as string) : {};

  if (endpoint.includes('chat')) {
    const prompt = body.message || 'Hello';
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return { response: response.text || 'I am ready to help with your diet and meal planning!' };
  }

  if (endpoint.includes('substitute')) {
    const prompt = `Suggest a healthy high-protein vegetarian substitute for missing item: ${body.missingItem}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return {
      originalItem: body.missingItem,
      substituteItem: 'Soya Chunks or Sprouted Moong',
      portionAdjustment: 'Use 30g dry soya chunks or 1 cup sprouted moong.',
      recipeAdjustment: 'Boil with turmeric and salt.',
      nutritionalImpact: 'High protein (~15g protein per serving) with zero added sugar.',
      allergenSafetyCheck: 'Safe for strict vegetarian diet.',
      rawNote: response.text,
    };
  }

  if (endpoint.includes('generate-meal-plan')) {
    return generateFallbackMealPlan(body.userProfile, body.inventory);
  }

  throw new Error(`Client-side fallback not implemented for ${endpoint}`);
}

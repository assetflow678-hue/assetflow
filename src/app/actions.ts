'use server';

import { suggestAssetStatus } from '@/ai/flows/suggest-asset-status';
import type { SuggestAssetStatusInput } from '@/ai/flows/suggest-asset-status';

export async function getSuggestedStatus(input: SuggestAssetStatusInput) {
  // In a real app, you would add authentication and authorization checks here.
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is not set.");
    return { success: false, error: 'AI service is not configured on the server.' };
  }
  
  try {
    const result = await suggestAssetStatus(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI suggestion error:", error);
    return { success: false, error: 'Failed to get a suggestion from the AI service.' };
  }
}

'use server';

/**
 * @fileOverview A flow to suggest the next asset status using generative AI.
 *
 * - suggestAssetStatus - A function that suggests the next asset status.
 * - SuggestAssetStatusInput - The input type for the suggestAssetStatus function.
 * - SuggestAssetStatusOutput - The return type for the suggestAssetStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAssetStatusInputSchema = z.object({
  assetId: z.string().describe('The unique identifier of the asset.'),
  currentStatus: z.string().describe('The current status of the asset.'),
  statusHistory: z.array(z.string()).describe('The history of status updates for the asset.'),
  userInput: z.string().optional().describe('Optional user input describing the asset condition.'),
});

export type SuggestAssetStatusInput = z.infer<typeof SuggestAssetStatusInputSchema>;

const SuggestAssetStatusOutputSchema = z.object({
  suggestedStatus: z.string().describe('The AI suggested next status for the asset.'),
});

export type SuggestAssetStatusOutput = z.infer<typeof SuggestAssetStatusOutputSchema>;

export async function suggestAssetStatus(input: SuggestAssetStatusInput): Promise<SuggestAssetStatusOutput> {
  return suggestAssetStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAssetStatusPrompt',
  input: {schema: SuggestAssetStatusInputSchema},
  output: {schema: SuggestAssetStatusOutputSchema},
  prompt: `You are an AI assistant helping users determine the next status of an asset.

  The asset has the following ID: {{assetId}}
  The current status is: {{currentStatus}}
  The status history is:
  {{#each statusHistory}}
  - {{this}}
  {{/each}}

  {{#if userInput}}
  The user has provided the following information:
  {{userInput}}
  {{/if}}

  Based on this information, suggest the next status for the asset. The status should be one of the following: in use, broken, repairing, disposed.
  Return ONLY the suggested status.
  `,
});

const suggestAssetStatusFlow = ai.defineFlow(
  {
    name: 'suggestAssetStatusFlow',
    inputSchema: SuggestAssetStatusInputSchema,
    outputSchema: SuggestAssetStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

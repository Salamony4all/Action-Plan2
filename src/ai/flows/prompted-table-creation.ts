'use server';

/**
 * @fileOverview A flow that creates a table based on a user's prompt.
 *
 * - createTable - A function that handles the table creation process.
 * - CreateTableInput - The input type for the createTable function.
 * - CreateTableOutput - The return type for the createTable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateTableInputSchema = z.object({
  prompt: z.string().describe('A description of the table to create.'),
});
export type CreateTableInput = z.infer<typeof CreateTableInputSchema>;

const CreateTableOutputSchema = z.object({
  tableData: z.string().describe('A string representation of the table data, including headers and rows.'),
});
export type CreateTableOutput = z.infer<typeof CreateTableOutputSchema>;

export async function createTable(input: CreateTableInput): Promise<CreateTableOutput> {
  return createTableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createTablePrompt',
  input: {schema: CreateTableInputSchema},
  output: {schema: CreateTableOutputSchema},
  prompt: `You are an expert table generator. Based on the user's prompt, create a table with appropriate headers and data.\n\nPrompt: {{{prompt}}}\n\nTable Data:`,
});

const createTableFlow = ai.defineFlow(
  {
    name: 'createTableFlow',
    inputSchema: CreateTableInputSchema,
    outputSchema: CreateTableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

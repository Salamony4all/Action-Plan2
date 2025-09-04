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
  prompt: z.string().describe('A description of the table to create, or raw data to be converted into a table.'),
});
export type CreateTableInput = z.infer<typeof CreateTableInputSchema>;

const CreateTableOutputSchema = z.object({
  tableData: z.string().describe('A JSON string representation of the table data, as an array of objects. The keys of the objects are the headers.'),
});
export type CreateTableOutput = z.infer<typeof CreateTableOutputSchema>;

export async function createTable(input: CreateTableInput): Promise<CreateTableOutput> {
  return createTableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createTablePrompt',
  input: {schema: CreateTableInputSchema},
  output: {schema: CreateTableOutputSchema},
  prompt: `You are an expert table generator. Based on the user's prompt, which could be a description or raw, messy data (like from a PDF or Excel copy-paste), create a table.

It is critical that you return the data as a JSON array of objects. Each object in the array represents a row, and the keys of the object are the column headers.

Do not include any explanatory text in your response, only the JSON data.

Prompt: {{{prompt}}}
`,
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

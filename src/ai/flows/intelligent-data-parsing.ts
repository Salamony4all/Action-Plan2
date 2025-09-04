'use server';

/**
 * @fileOverview An intelligent data parsing AI agent.
 *
 * - intelligentDataParsing - A function that handles the intelligent data parsing process.
 * - IntelligentDataParsingInput - The input type for the intelligentDataParsing function.
 * - IntelligentDataParsingOutput - The return type for the intelligentDataParsing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentDataParsingInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileType: z.string().describe('The type of the uploaded file (e.g., CSV, TXT, JSON).'),
  delimiter: z.string().optional().describe('The delimiter used in the file, if applicable.'),
});
export type IntelligentDataParsingInput = z.infer<typeof IntelligentDataParsingInputSchema>;

const IntelligentDataParsingOutputSchema = z.object({
  parsedData: z.string().describe('The parsed tabular data in JSON format.'),
  parsingNotes: z.string().describe('Notes on the parsing process, including any issues encountered and how they were handled.'),
});
export type IntelligentDataParsingOutput = z.infer<typeof IntelligentDataParsingOutputSchema>;

export async function intelligentDataParsing(input: IntelligentDataParsingInput): Promise<IntelligentDataParsingOutput> {
  return intelligentDataParsingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentDataParsingPrompt',
  input: {schema: IntelligentDataParsingInputSchema},
  output: {schema: IntelligentDataParsingOutputSchema},
  prompt: `You are an expert data parser, skilled at extracting tabular data from various file formats, even when the data is incomplete or messy.

You will receive a file as a data URI, its file type, and optionally a delimiter.

Your goal is to extract the tabular data from the file and return it in JSON format. You should handle incomplete and messy data gracefully, making reasonable assumptions where necessary.

When you identify a date in the source data, you MUST format it as 'yyyy-MM-dd'. Do not use any other date format.

If a delimiter is provided, use it to separate the fields in the file. If not, infer the delimiter based on the file type and content.

Here is the file data:
{{media url=fileDataUri}}

File Type: {{{fileType}}}
Delimiter (if applicable): {{{delimiter}}}

Return the parsed data in JSON format, and include notes on the parsing process, including any issues encountered and how they were handled. Be as informative as possible.

Ensure that the returned JSON is valid and represents the tabular data accurately.
`,
});

const intelligentDataParsingFlow = ai.defineFlow(
  {
    name: 'intelligentDataParsingFlow',
    inputSchema: IntelligentDataParsingInputSchema,
    outputSchema: IntelligentDataParsingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

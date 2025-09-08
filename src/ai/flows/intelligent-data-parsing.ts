
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
  parsedData: z.string().describe('The parsed tabular data in JSON format. The response must be a valid JSON string without any markdown formatting.'),
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
  prompt: `You are an expert data parser, skilled at extracting tabular data from various file formats, maintaining the exact structure of the source file.

You will receive a file as a data URI, its file type, and optionally a delimiter.

Your goal is to extract the tabular data from the file and return it in JSON format. You must process the entire document, including all pages, to ensure all data is extracted.

Maintain the exact consistency and structure of the source file. Do NOT alter, add, or remove any rows or columns. The headers in the JSON output must match the headers in the source file exactly.

Some rows in the source file may represent a "zone" or a section heading. These rows typically have a value in only one or two columns and are otherwise empty. You must recognize and preserve these rows as separate objects in the JSON array. For such a row, create a JSON object where the key is 'zone' and the value is the text of the heading. For example, if you see a row that says 'ZONE 1 CIVIL WORKS', the output should be an object like \`{ "zone": "ZONE 1 CIVIL WORKS" }\`.

All other rows should be treated as regular data rows and converted to JSON objects where keys are the column headers and values are the cell contents.

Here is the file data:
{{media url=fileDataUri}}

File Type: {{{fileType}}}
Delimiter (if applicable): {{{delimiter}}}

Return the parsed data as a valid JSON string. Do NOT wrap the JSON in markdown code blocks or any other formatting. Your response for the 'parsedData' field must be only the JSON content. Include notes on the parsing process in the 'parsingNotes' field.

Ensure that the returned JSON is a valid JSON array of objects representing the tabular data accurately, preserving the original structure, headers, and any zone/heading rows.
IMPORTANT: The 'parsedData' field must contain ONLY a valid JSON string. It must not contain any markdown, code blocks (like \`\`\`json), or any other text outside of the JSON itself.
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

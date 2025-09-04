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

Your goal is to extract the tabular data from the file and return it in JSON format. You should handle incomplete and messy data gracefully, making reasonable assumptions where necessary. The headers in the source file may not exactly match the target headers, but you should use your intelligence to map them correctly.

The target table has the following headers: "Item", "Zone", "Location", "Activity", "Engineering Status", "Engineering", "Procurement", "Procurement Date", "Execution_clearence", "Execution_start", "Execution_finish".

Map the data from the source file to these target headers. For example, a column named "Task Name" in the source should be mapped to the "Activity" header in the output. A column named "Start Date" should be mapped to "Execution_start".

When you identify a date in the source data, you must parse it and format it as 'yyyy-MM-dd'. Use the exact dates from the source file. You should be able to handle various date formats, including but not limited to 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd-MMM-yy', 'Month dd, yyyy', etc. Always convert any recognized date into the 'yyyy-MM-dd' format in the final JSON output.

If a delimiter is provided, use it to separate the fields in the file. If not, infer the delimiter based on the file type and content.

Here is the file data:
{{media url=fileDataUri}}

File Type: {{{fileType}}}
Delimiter (if applicable): {{{delimiter}}}

Return the parsed data in JSON format, and include notes on the parsing process, including any issues encountered and how they were handled. Be as informative as possible.

Ensure that the returned JSON is a valid JSON array of objects representing the tabular data accurately, and that dates are consistently formatted as 'yyyy-MM-dd'. Each object in the array should conform to the target headers.
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

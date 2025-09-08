
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { intelligentDataParsing, type IntelligentDataParsingOutput } from "@/ai/flows/intelligent-data-parsing";

import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { FileUploadCard } from "@/components/file-upload-card";
import { ExportDataCard } from "@/components/export-data-card";
import { DataTable } from "@/components/data-table";
import { Loader2, FileWarning } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";

export type ParsedData = Record<string, any>[];

const defaultData: ParsedData = [
  {
    "SN": "1",
    "Location": "Example Location",
    "Activity": "Example Activity",
    "Engineering Status": "Pending",
    "Engineering": format(new Date(), "yyyy-MM-dd"),
    "Procurement": "In Progress",
    "Procurement Date": format(new Date(), "yyyy-MM-dd"),
    "Execution_clearence": "2024-08-15",
    "Execution_start": "2024-08-20",
    "Execution_finish": "2024-08-30"
  }
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setParsedData(defaultData);
    setError(null);
    setIsLoading(false);
  };

  const cleanAndParseJson = (input: string | object): any => {
    if (typeof input === 'object') {
      return input;
    }
    if (typeof input !== 'string') {
      throw new Error("Invalid input type for JSON parsing.");
    }
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/im;
    const match = input.match(jsonRegex);
    if (!match) {
      throw new Error("No valid JSON found in the response.");
    }
    const cleanJsonString = match[1] || match[2];
    if (!cleanJsonString) {
      throw new Error("Could not extract JSON from the response.");
    }
    try {
      return JSON.parse(cleanJsonString);
    } catch (e) {
      console.error("Final JSON parsing attempt failed:", e);
      throw new Error("Failed to parse the extracted JSON data.");
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        try {
          const fileDataUri = reader.result as string;
          const result: IntelligentDataParsingOutput = await intelligentDataParsing({
            fileDataUri,
            fileType: selectedFile.type || 'unknown',
          });
          
          if (result && result.parsedData) {
            try {
              const parsedJson = cleanAndParseJson(result.parsedData);
              if (Array.isArray(parsedJson)) {
                setParsedData(parsedJson);
              } else {
                setError("Parsed data is not in a valid table format (array of objects).");
                setParsedData(defaultData);
              }
              toast({
                title: "Success",
                description: "Data parsed successfully.",
                variant: "default",
              });
            } catch (e) {
              console.error("JSON Parsing Error:", e, "Raw Data:", result.parsedData);
              const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during parsing.";
              setError(`Failed to parse the data from AI. ${errorMessage}`);
              setParsedData(defaultData);
            }
          } else {
            setError("The AI could not parse any data from the file.");
            setParsedData(defaultData);
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during parsing.";
          setError(errorMessage);
          setParsedData(defaultData);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsLoading(false);
        setParsedData(defaultData);
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred preparing the file.";
      setError(errorMessage);
      setIsLoading(false);
      setParsedData(defaultData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid gap-8">
          <div className="grid md:grid-cols-2 gap-8">
            <FileUploadCard 
              selectedFile={file} 
              onFileSelect={handleFileSelect} 
              onFileRemove={resetState} 
            />
            <ExportDataCard data={parsedData} defaultData={defaultData} />
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center gap-3 text-lg font-medium text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Parsing your data...</span>
            </div>
          )}

          {error && !isLoading && (
             <Alert variant='destructive'>
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Parsing Issue</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Extracted Data</CardTitle>
              <CardDescription>Click any cell to edit its content. Add or remove rows as needed.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <DataTable 
                data={parsedData} 
                setData={setParsedData} 
                defaultData={defaultData}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

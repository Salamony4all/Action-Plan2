"use client";

import { useState } from "react";
import { Loader2, FileWarning, CheckCircle, File as FileIcon } from "lucide-react";
import { intelligentDataParsing, type IntelligentDataParsingOutput } from "@/ai/flows/intelligent-data-parsing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Logo } from "@/components/icons";
import { FileUploader } from "@/components/file-uploader";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type ParsedData = Record<string, any>[] | Record<string, any>;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parsingNotes, setParsingNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setParsingNotes(null);
    setError(null);
    setIsLoading(false);
  };

  const handleFileSelect = async (selectedFile: File) => {
    resetState();
    setFile(selectedFile);
    setIsLoading(true);

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
          
          if (result.parsedData) {
            try {
              const parsedJson = JSON.parse(result.parsedData);
              setParsedData(parsedJson);
              setParsingNotes(result.parsingNotes);
              toast({
                title: "Success",
                description: "Data parsed successfully.",
                variant: "default",
              });
            } catch (e) {
              setError("Failed to parse the data from AI. The format might be incorrect.");
              setParsingNotes(result.parsingNotes);
            }
          } else {
            setError("The AI could not parse any data from the file.");
            setParsingNotes(result.parsingNotes);
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during parsing.";
          setError(errorMessage);
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
      };
    } catch (e) {
      // This outer catch is for synchronous errors before reader starts
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred preparing the file.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const renderParsedData = (data: ParsedData) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => (
        <div key={index}>
          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="grid grid-cols-3 gap-2 py-2">
              <span className="font-semibold capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
              <span className="col-span-2 text-foreground">{String(value)}</span>
            </div>
          ))}
          {index < data.length - 1 && <Separator />}
        </div>
      ));
    }
    return Object.entries(data).map(([key, value]) => (
       <div key={key} className="grid grid-cols-3 gap-2 py-2">
        <span className="font-semibold capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
        <span className="col-span-2 text-foreground">{String(value)}</span>
      </div>
    ));
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center gap-3">
          <Logo className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight font-headline">TabularView</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto grid gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileIcon className="w-5 h-5" /> Upload File
                </CardTitle>
                <CardDescription>Upload a file (e.g., CSV, TXT, JSON, PDF, XLS) to automatically extract data.</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader onFileSelect={handleFileSelect} onFileRemove={resetState} selectedFile={file} acceptedFileTypes=".csv,.txt,.json,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
              </CardContent>
            </Card>

          {isLoading && !parsedData && (
            <div className="flex items-center justify-center gap-3 text-lg font-medium text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Parsing your data...</span>
            </div>
          )}

          {(parsingNotes || error) && !isLoading && (
             <Alert variant={error ? 'destructive' : 'default'}>
              {error ? <FileWarning className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertTitle>{error ? 'Parsing Issue' : 'Parsing Notes'}</AlertTitle>
              <AlertDescription className="prose prose-sm max-w-none">
                <p>{error || parsingNotes}</p>
                {error && parsingNotes && <p className="mt-2"><strong>Additional Notes:</strong> {parsingNotes}</p>}
              </AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Extracted Data</CardTitle>
                <CardDescription>Below is the data extracted from your file.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {renderParsedData(parsedData)}
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <p>Built with Next.js and Genkit. Styled with Tailwind CSS and ShadCN/UI.</p>
      </footer>
    </div>
  );
}

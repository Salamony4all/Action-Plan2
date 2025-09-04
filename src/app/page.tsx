"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, FileWarning, CheckCircle } from "lucide-react";
import { intelligentDataParsing, type IntelligentDataParsingOutput } from "@/ai/flows/intelligent-data-parsing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/icons";
import { FileUploader } from "@/components/file-uploader";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/hooks/use-toast";

type TableRowData = Record<string, any>;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tableData, setTableData] = useState<TableRowData[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsingNotes, setParsingNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (tableData && tableData.length > 0) {
      setHeaders(Object.keys(tableData[0]));
    } else {
      setHeaders([]);
    }
  }, [tableData]);

  const resetState = () => {
    setFile(null);
    setTableData(null);
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
              if (Array.isArray(parsedJson) && parsedJson.length > 0) {
                setTableData(parsedJson);
                setParsingNotes(result.parsingNotes);
                toast({
                  title: "Success",
                  description: "Data parsed successfully.",
                  variant: "default",
                });
              } else {
                setError("Parsed data is not in a valid array format or is empty.");
                setParsingNotes(result.parsingNotes);
              }
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

  const handleDownload = (format: 'csv' | 'json') => {
    if (!tableData) return;

    let content = "";
    let mimeType = "";
    let fileExtension = "";

    if (format === 'json') {
      content = JSON.stringify(tableData, null, 2);
      mimeType = "application/json";
      fileExtension = "json";
    } else { // csv
      const csvHeaders = headers.join(',');
      const csvRows = tableData.map(row =>
        headers.map(header => {
          const value = String(row[header] ?? '');
          return `"${value.replace(/"/g, '""')}"`;
        }).join(',')
      ).join('\n');
      content = `${csvHeaders}\n${csvRows}`;
      mimeType = "text/csv";
      fileExtension = "csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited_data.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Started",
      description: `Your file is downloading as ${fileExtension.toUpperCase()}.`,
    });
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
              <CardTitle className="text-xl">1. Upload File</CardTitle>
              <CardDescription>Upload a file (CSV, TXT, JSON, etc.) to extract and recognize its data.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onFileSelect={handleFileSelect} onFileRemove={resetState} selectedFile={file} />
            </CardContent>
          </Card>

          {isLoading && (
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

          {tableData && !isLoading && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">2. Preview and Edit Data</CardTitle>
                <CardDescription>Your extracted data is below. You can edit cells directly. Clean up any mistakes before downloading.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={tableData} headers={headers} onDataChange={setTableData} isLoading={isLoading} />
              </CardContent>
              <CardFooter className="justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button><Download className="mr-2 h-4 w-4" /> Download Data</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleDownload('csv')}>Download as CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('json')}>Download as JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
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

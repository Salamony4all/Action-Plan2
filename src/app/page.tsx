"use client";

import { useState } from "react";
import { Loader2, FileWarning, Calendar as CalendarIcon, FileText, Check, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { intelligentDataParsing, type IntelligentDataParsingOutput } from "@/ai/flows/intelligent-data-parsing";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Logo } from "@/components/icons";
import { FileUploader } from "@/components/file-uploader";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";


type ParsedData = Record<string, any>[] | Record<string, any>;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, header: string} | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setIsLoading(false);
    setEditingCell(null);
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
              toast({
                title: "Success",
                description: "Data parsed successfully.",
                variant: "default",
              });
            } catch (e) {
              setError("Failed to parse the data from AI. The format might be incorrect.");
            }
          } else {
            setError("The AI could not parse any data from the file.");
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

  const handleDateChange = (rowIndex: number, header: string, date: Date | undefined) => {
    if (Array.isArray(parsedData) && date) {
      const newData = [...parsedData];
      newData[rowIndex][header] = format(date, "yyyy-MM-dd");
      setParsedData(newData);
    }
  };
  
  const handleCellChange = (rowIndex: number, header: string, value: any) => {
    if (Array.isArray(parsedData)) {
      const newData = [...parsedData];
      newData[rowIndex][header] = value;
      setParsedData(newData);
    }
  };

  const isDateString = (s: any): s is string => {
    if (typeof s !== 'string' || s.trim() === '' || s.toLowerCase() === 'n/a') return false;
    // Attempt to parse the string as a date
    const d = new Date(s);
    // Check if the parsed date is valid and not NaN
    return d instanceof Date && !isNaN(d.getTime());
  };

  const renderCellContent = (rowIndex: number, header: string, cellValue: any) => {
    if (editingCell?.rowIndex === rowIndex && editingCell?.header === header) {
      return (
        <Input
          type="text"
          defaultValue={String(cellValue)}
          onBlur={(e) => {
            handleCellChange(rowIndex, header, e.target.value);
            setEditingCell(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellChange(rowIndex, header, e.currentTarget.value);
              setEditingCell(null);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          autoFocus
          className="h-8"
        />
      );
    }
    
    if (isDateString(cellValue)) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full min-w-[150px] justify-start text-left font-normal",
                !cellValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(new Date(cellValue), "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(cellValue)}
              onSelect={(date) => {
                handleDateChange(rowIndex, header, date)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div onClick={() => setEditingCell({rowIndex, header})} className="min-h-[2.5rem] flex items-center">
        {String(cellValue)}
      </div>
    );
  };


  const addRow = () => {
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      const headers = Object.keys(parsedData[0]);
      const newRow = headers.reduce((acc, header) => {
        acc[header] = '';
        return acc;
      }, {} as Record<string, any>);
      setParsedData([...parsedData, newRow]);
    }
  };

  const removeRow = (rowIndex: number) => {
    if (Array.isArray(parsedData)) {
      const newData = parsedData.filter((_, index) => index !== rowIndex);
      setParsedData(newData);
    }
  };

  const renderParsedData = (data: ParsedData) => {
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      return (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="capitalize">{header.replace(/_/g, ' ')}</TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header}>
                    {renderCellContent(index, header, item[header])}
                  </TableCell>
                ))}
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Button onClick={addRow}><Plus className="mr-2"/> Add Row</Button>
        </div>
        </>
      );
    }
    if (!Array.isArray(data) && data) {
        return (
            <div className="space-y-2">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 items-start">
                        <span className="font-semibold capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <span className="col-span-2 text-foreground">{String(value)}</span>
                    </div>
                ))}
            </div>
        );
    }

    return <p>No data to display.</p>;
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
                  <FileText className="w-5 h-5" /> Upload File
                </CardTitle>
                <CardDescription>Upload a file to automatically extract data.</CardDescription>
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

          {error && !isLoading && (
             <Alert variant='destructive'>
              <FileWarning className="h-4 w-4" />
              <AlertTitle>Parsing Issue</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
              </AlertDescription>
            </Alert>
          )}

          {parsedData && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Extracted Data</CardTitle>
                <CardDescription>Click any cell to edit its content. Dates will have a calendar picker.</CardDescription>
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

    
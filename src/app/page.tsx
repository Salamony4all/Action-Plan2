"use client";

import { useState, useEffect } from "react";
import { Loader2, FileWarning, Calendar as CalendarIcon, FileText, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type ParsedData = Record<string, any>[];

const defaultHeaders = [
  'Item',
  'Location',
  'Activity',
  'Engineering Status',
  'Engineering',
  'Procurement',
  'Procurement Date',
  'Execution_clearence',
  'Execution_start',
  'Execution_finish',
  'Status'
];

const defaultData: ParsedData = [
  {
    "Item": "1",
    "Location": "Example Location",
    "Activity": "Example Activity",
    "Engineering Status": "Pending",
    "Engineering": format(new Date(), "yyyy-MM-dd"),
    "Procurement": "In Progress",
    "Procurement Date": format(new Date(), "yyyy-MM-dd"),
    "Execution_clearence": "2024-08-15",
    "Execution_start": "2024-08-20",
    "Execution_finish": "2024-08-30",
    "Status": "Not Started"
  }
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, header: string} | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    setFile(null);
    setParsedData(defaultData); // Reset to default data
    setError(null);
    setIsLoading(false);
    setEditingCell(null);
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
              let parsedJson;
              // Genkit can sometimes return an object directly or a stringified JSON.
              // We need to handle both cases.
              if (typeof result.parsedData === 'string') {
                  // Attempt to fix common JSON issues before parsing
                  let cleanJsonString = result.parsedData
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                  parsedJson = JSON.parse(cleanJsonString);
              } else {
                  parsedJson = result.parsedData;
              }

              if (Array.isArray(parsedJson)) {
                // Ensure all default headers exist in each row
                const sanitizedData = parsedJson.map(row => {
                  const newRow: Record<string, any> = {};
                  for (const header of defaultHeaders) {
                    newRow[header] = row[header] ?? '';
                  }
                  return newRow;
                });
                setParsedData(sanitizedData);
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
              setError("Failed to parse the data from AI. The format might be incorrect.");
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
      // This outer catch is for synchronous errors before reader starts
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred preparing the file.";
      setError(errorMessage);
      setIsLoading(false);
      setParsedData(defaultData);
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
      // Ensure the row object exists
      if (!newData[rowIndex]) newData[rowIndex] = {};
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
    const normalizedHeader = header.toLowerCase().replace(/_/g, ' ').replace(/ /g, '');

    if (editingCell?.rowIndex === rowIndex && editingCell?.header === header) {
      return (
        <Input
          type="text"
          defaultValue={String(cellValue ?? '')}
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
    
    if (normalizedHeader === 'engineeringstatus') {
      const statuses = ["Completed", "In Progress", "Delayed", "Pending"];
      return (
        <Select
          value={cellValue}
          onValueChange={(value) => handleCellChange(rowIndex, header, value)}
        >
          <SelectTrigger className="w-full min-w-[150px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (normalizedHeader === 'procurement') {
      const statuses = ["Completed", "In Progress", "Delayed", "Pending"];
      return (
        <Select
          value={cellValue}
          onValueChange={(value) => handleCellChange(rowIndex, header, value)}
        >
          <SelectTrigger className="w-full min-w-[150px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    const dateColumns = ["engineering", "procurementdate", "executionclearence", "executionstart", "executionfinish"];

    if (dateColumns.includes(normalizedHeader)) {
      const dateValue = isDateString(cellValue) ? new Date(cellValue) : undefined;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full min-w-[150px] justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => {
                handleDateChange(rowIndex, header, date)
                const popoverTrigger = document.querySelector(`[data-radix-popover-trigger][aria-expanded="true"]`) as HTMLElement | null;
                popoverTrigger?.click();
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }


    return (
      <div onClick={() => setEditingCell({rowIndex, header})} className="min-h-[2.5rem] flex items-center">
        {String(cellValue ?? '')}
      </div>
    );
  };


  const addRow = () => {
    if (Array.isArray(parsedData)) {
      const newRow = defaultHeaders.reduce((acc, header) => {
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
    if (!Array.isArray(data) || data.length === 0) {
        // Render table with default headers and a message or an empty row
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2}>Item</TableHead>
                <TableHead rowSpan={2}>Location</TableHead>
                <TableHead rowSpan={2}>Activity</TableHead>
                <TableHead colSpan={2} className="text-center border-l border-r">Engineering</TableHead>
                <TableHead colSpan={2} className="text-center border-r">Procurement</TableHead>
                <TableHead colSpan={3} className="text-center border-r">Execution</TableHead>
                <TableHead rowSpan={2}>Status</TableHead>
                <TableHead rowSpan={2} className="w-[50px]"></TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="border-l">Status</TableHead>
                <TableHead className="border-r">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="border-r">Date</TableHead>
                <TableHead>Clearence</TableHead>
                <TableHead>Start</TableHead>
                <TableHead className="border-r">Finish</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell colSpan={defaultHeaders.length + 1} className="text-center">
                        No data to display. Upload a file to get started.
                    </TableCell>
                </TableRow>
            </TableBody>
          </Table>
        )
    }
    const headers = defaultHeaders;
    return (
      <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2}>Item</TableHead>
            <TableHead rowSpan={2}>Location</TableHead>
            <TableHead rowSpan={2}>Activity</TableHead>
            <TableHead colSpan={2} className="text-center border-l border-r">Engineering</TableHead>
            <TableHead colSpan={2} className="text-center border-r">Procurement</TableHead>
            <TableHead colSpan={3} className="text-center border-r">Execution</TableHead>
            <TableHead rowSpan={2}>Status</TableHead>
            <TableHead rowSpan={2} className="w-[50px]"></TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="border-l">Status</TableHead>
            <TableHead className="border-r">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="border-r">Date</TableHead>
            <TableHead>Clearence</TableHead>
            <TableHead>Start</TableHead>
            <TableHead className="border-r">Finish</TableHead>
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
        <div className="grid gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Upload File
                </CardTitle>
                <CardDescription>Upload a file to automatically extract and structure data into the table below.</CardDescription>
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
              <CardDescription>Click any cell to edit its content. Dates will have a calendar picker.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {renderParsedData(parsedData)}
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        <p>Built with Next.js and Genkit. Styled with Tailwind CSS and ShadCN/UI.</p>
      </footer>
    </div>
  );
}

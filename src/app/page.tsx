
"use client";

import { useState } from "react";
import { Loader2, FileWarning, FileText, Plus, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { intelligentDataParsing, type IntelligentDataParsingOutput } from "@/ai/flows/intelligent-data-parsing";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Logo } from "@/components/icons";
import { FileUploader } from "@/components/file-uploader";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ParsedData = Record<string, any>[];

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
  const [editingCell, setEditingCell] = useState<{rowIndex: number, header: string} | null>(null);
  const { toast } = useToast();

  const getHeaders = (data: ParsedData) => {
    if (!Array.isArray(data) || data.length === 0) {
      return Object.keys(defaultData[0]);
    }
    const headers = new Set<string>();
    data.forEach(row => {
      if (row && typeof row === 'object' && !row.zone) {
        Object.keys(row).forEach(key => headers.add(key));
      }
    });
    return Array.from(headers);
  }

  const processDataWithSerialNumbers = (data: ParsedData) => {
    let serialNumber = 0;
    return data.map((row) => {
      if (row.zone) {
        serialNumber = 0; // Reset counter for new zone
        return row;
      }
      serialNumber++;
      const firstKey = Object.keys(row)[0];
      if (firstKey) {
        return { ...row, [firstKey]: serialNumber };
      }
      return { ...row };
    });
  };
  
  const resetState = () => {
    setFile(null);
    setParsedData(defaultData);
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
              if (typeof result.parsedData === 'string') {
                  const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/m;
                  const match = result.parsedData.match(jsonRegex);
                  
                  if (match) {
                    const cleanJsonString = match[1] || match[2];
                    if (cleanJsonString) {
                      parsedJson = JSON.parse(cleanJsonString);
                    } else {
                      throw new Error("Could not extract JSON from the response.");
                    }
                  } else {
                     throw new Error("No valid JSON found in the response.");
                  }
              } else {
                  parsedJson = result.parsedData;
              }

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
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred preparing the file.";
      setError(errorMessage);
      setIsLoading(false);
      setParsedData(defaultData);
    }
  };
  
  const handleCellChange = (rowIndex: number, header: string, value: any) => {
    if (Array.isArray(parsedData)) {
      const newData = [...parsedData];
      const row = newData[rowIndex];
      if (row.zone) {
        row.zone = value;
      } else {
         if (!row) newData[rowIndex] = {};
         row[header] = value;
      }
      setParsedData(newData);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const headers = getHeaders(parsedData);
    const body = parsedData.map(row => {
      if (row.zone) {
        return [{ content: row.zone, colSpan: headers.length, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }];
      }
      return headers.map(header => row[header] ?? '');
    });

    autoTable(doc, {
        head: [headers],
        body: body,
        didDrawPage: (data) => {
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text("NCSI Action Plan", data.settings.margin.left, 15);
        },
    });

    doc.save('ncsi-action-plan.pdf');
  };

  const exportToExcel = () => {
    const processedData = parsedData.map(row => {
      if(row.zone){
        return { Zone: row.zone };
      }
      return row;
    })
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "ncsi-action-plan.xlsx");
  };

  const renderCellContent = (rowIndex: number, header: string | null, cellValue: any) => {
    const isZoneRow = typeof cellValue === 'object' && cellValue.zone;
    const currentHeader = header || (isZoneRow ? 'zone' : '');
    
    if (editingCell?.rowIndex === rowIndex && editingCell?.header === currentHeader) {
      return (
        <Input
          type="text"
          defaultValue={String(isZoneRow ? cellValue.zone : cellValue ?? '')}
          onBlur={(e) => {
            handleCellChange(rowIndex, currentHeader, e.target.value);
            setEditingCell(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellChange(rowIndex, currentHeader, e.currentTarget.value);
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

    const valueToDisplay = isZoneRow ? cellValue.zone : String(cellValue ?? '');
    return (
      <div onClick={() => setEditingCell({rowIndex, header: currentHeader})} className="min-h-[2.5rem] flex items-center">
        {valueToDisplay}
      </div>
    );
  };


  const addRow = (rowIndex: number) => {
    if (Array.isArray(parsedData)) {
      const headers = getHeaders(parsedData);
      const newRow = headers.reduce((acc, header) => {
        acc[header] = '';
        return acc;
      }, {} as Record<string, any>);
      
      const newData = [...parsedData];
      newData.splice(rowIndex + 1, 0, newRow);
      setParsedData(newData);
    }
  };

  const removeRow = (rowIndex: number) => {
    if (Array.isArray(parsedData)) {
      const newData = parsedData.filter((_, index) => index !== rowIndex);
      setParsedData(newData);
    }
  };

  const renderParsedData = (data: ParsedData) => {
    const headers = getHeaders(data);
    if (!Array.isArray(data) || data.length === 0 || headers.length === 0) {
        return (
          <div className="text-center p-4">
              No data to display. Upload a file to get started.
          </div>
        )
    }
    
    const processedData = processDataWithSerialNumbers(data);

    return (
      <>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="text-center">{header}</TableHead>
            ))}
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedData.map((item, index) => (
            item.zone ? (
              <TableRow key={index}>
                <TableCell colSpan={headers.length} className="font-bold bg-muted/50">
                  {renderCellContent(index, null, item)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => addRow(index)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
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
                  <Button variant="ghost" size="icon" onClick={() => addRow(index)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Button onClick={() => addRow(parsedData.length -1)}><Plus className="mr-2"/> Add Row at End</Button>
      </div>
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center gap-3">
          <Logo className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight font-headline">NCSI Action Plan</h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid gap-8">
          <div className="grid md:grid-cols-2 gap-8">
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
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Download className="w-5 h-5" /> Export Data
                </CardTitle>
                <CardDescription>Download the table data in your preferred format.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Export the current table data (including any edits you've made) to a PDF or Excel file.</p>
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button onClick={exportToPDF} variant="outline">Export to PDF</Button>
                <Button onClick={exportToExcel} variant="outline">Export to Excel</Button>
              </CardFooter>
            </Card>
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
              <CardDescription>Click any cell to edit its content.</CardDescription>
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

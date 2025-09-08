
"use client";

import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ParsedData } from "@/app/page";

interface ExportDataCardProps {
    data: ParsedData;
    defaultData: ParsedData;
}

export function ExportDataCard({ data, defaultData }: ExportDataCardProps) {
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
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    const headers = getHeaders(data);
    const body = data.map(row => {
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
    const processedData = data.map(row => {
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
    
  return (
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
  );
}

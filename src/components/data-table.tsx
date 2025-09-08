
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ParsedData } from "@/app/page";

interface DataTableProps {
  data: ParsedData;
  setData: (data: ParsedData) => void;
  defaultData: ParsedData;
}

export function DataTable({ data, setData, defaultData }: DataTableProps) {
  const [editingCell, setEditingCell] = useState<{rowIndex: number, header: string} | null>(null);

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

  const processDataWithSerialNumbers = (data: ParsedData) => {
    let serialNumber = 0;
    return data.map((row) => {
      if (row.zone) {
        serialNumber = 0;
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

  const handleCellChange = (rowIndex: number, header: string, value: any) => {
    if (Array.isArray(data)) {
      const newData = [...data];
      const row = newData[rowIndex];
      if (row && row.zone) {
        row.zone = value;
      } else if (row) {
        row[header] = value;
      } else {
        newData[rowIndex] = {[header]: value};
      }
      setData(newData);
    }
  };

  const addRow = (rowIndex: number) => {
    if (Array.isArray(data)) {
      const headers = getHeaders(data);
      const newRow = headers.reduce((acc, header) => {
        acc[header] = '';
        return acc;
      }, {} as Record<string, any>);
      
      const newData = [...data];
      newData.splice(rowIndex + 1, 0, newRow);
      setData(newData);
    }
  };

  const removeRow = (rowIndex: number) => {
    if (Array.isArray(data)) {
      const newData = data.filter((_, index) => index !== rowIndex);
      setData(newData);
    }
  };

  const renderCellContent = (rowIndex: number, header: string | null, cellValue: any) => {
    const isZoneRow = typeof cellValue === 'object' && cellValue !== null && cellValue.zone;
    const currentHeader = header || (isZoneRow ? 'zone' : '');
    
    if (editingCell?.rowIndex === rowIndex && editingCell?.header === currentHeader) {
      return (
        <Input
          type="text"
          defaultValue={String(isZoneRow ? cellValue.zone : (cellValue ?? ''))}
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="text-center whitespace-nowrap">{header}</TableHead>
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
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => addRow(index)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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
                     <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => addRow(index)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4">
        <Button onClick={() => addRow(data.length - 1)}><Plus className="mr-2 h-4 w-4" /> Add Row at End</Button>
      </div>
    </>
  );
}

"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps {
  data: Record<string, any>[];
  headers: string[];
  onDataChange: (data: Record<string, any>[]) => void;
  isLoading: boolean;
}

export function DataTable({ data, headers, onDataChange, isLoading }: DataTableProps) {
  const handleCellChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowIndex: number,
    header: string
  ) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [header]: e.target.value };
    onDataChange(newData);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-auto border rounded-lg">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="font-semibold capitalize whitespace-nowrap">
                {header.replace(/_/g, ' ')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map((header) => (
                <TableCell key={header} className="p-0">
                  <Input
                    type="text"
                    value={row[header] ?? ""}
                    onChange={(e) => handleCellChange(e, rowIndex, header)}
                    className="w-full border-transparent rounded-none focus-visible:ring-1 focus-visible:ring-ring focus:border-input h-12 px-4"
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";

interface FileUploadCardProps {
    selectedFile: File | null;
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
}

export function FileUploadCard({ selectedFile, onFileSelect, onFileRemove }: FileUploadCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="w-5 h-5" /> Upload File
        </CardTitle>
        <CardDescription>Upload a file to automatically extract and structure data into the table below.</CardDescription>
      </CardHeader>
      <CardContent>
        <FileUploader onFileSelect={onFileSelect} onFileRemove={onFileRemove} selectedFile={selectedFile} />
      </CardContent>
    </Card>
  );
}

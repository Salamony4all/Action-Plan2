
"use client";

import { useState, useCallback, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  acceptedFileTypes?: string;
  selectedFile: File | null;
}

export function FileUploader({
  onFileSelect,
  onFileRemove,
  acceptedFileTypes,
  selectedFile,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <FileIcon className="w-6 h-6 text-primary" />
          <div className="font-medium">
            <p className="text-sm">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onFileRemove}>
          <X className="w-5 h-5" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
        isDragging ? "border-primary bg-muted/50" : "border-border"
      }`}
    >
      <UploadCloud className="w-12 h-12 text-muted-foreground" />
      <p className="mt-4 text-center text-muted-foreground">
        <span className="font-semibold text-primary">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-muted-foreground mt-1">CSV, TXT, or JSON files</p>
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept={acceptedFileTypes}
      />
    </div>
  );
}

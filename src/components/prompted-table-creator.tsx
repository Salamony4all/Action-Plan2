
"use client";

import { useState } from "react";
import { createTable, type CreateTableOutput } from "@/ai/flows/prompted-table-creation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptedTableCreatorProps {
  onTableCreated: (data: Record<string, any>[], notes?: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export function PromptedTableCreator({ onTableCreated, setIsLoading, setError }: PromptedTableCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const { toast } = useToast();

  const handleCreateTable = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description or paste some data.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const result: CreateTableOutput = await createTable({ prompt });
      
      if (result.tableData) {
        try {
          // The AI returns a JSON string, so we need to parse it.
          // The AI is instructed to return an array of objects.
          const parsedJson = JSON.parse(result.tableData);
          if (Array.isArray(parsedJson)) {
            onTableCreated(parsedJson);
          } else {
            throw new Error("AI did not return a valid array.");
          }
        } catch (e) {
          setError("Failed to parse table data from AI. The format might be incorrect.");
          onTableCreated([]);
        }
      } else {
        setError("The AI could not generate a table from your prompt.");
        onTableCreated([]);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      onTableCreated([]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2"><Wand2 className="w-5 h-5" /> 2. Create from Prompt</CardTitle>
        <CardDescription>
          Alternatively, describe the table you want, or paste data from sources like Excel or PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Textarea
          placeholder="e.g., 'A table of the top 5 largest countries by area' or paste your raw data here."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <Button onClick={handleCreateTable} className="w-full">
          Create Table
        </Button>
      </CardContent>
    </Card>
  );
}

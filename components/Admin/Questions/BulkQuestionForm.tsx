"use client";

import { useState } from "react";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { bulk_template } from "@/questions-bulk-upload-template";

export default function BulkQuestionForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{
    success: number;
    total: number;
    errors: string[];
  } | null>(null);

  const downloadTemplate = () => {
    const template = bulk_template;

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions-template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const fileContent = await file.text();
      let jsonData;
      try {
        jsonData = JSON.parse(fileContent);
      } catch {
        throw new Error("Invalid JSON file.");
      }

      if (!Array.isArray(jsonData)) throw new Error("JSON must be an array.");
      const response = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(typeof result === "string" ? result : result.error || "Upload failed");
      }

      const successCount = Number(result.message?.match(/Success: (\d+)/)?.[1] ?? 0);
      const errors = Array.isArray(result.data)
        ? result.data.filter((error: unknown): error is string => typeof error === "string")
        : [];

      setStats({
        success: successCount,
        total: jsonData.length,
        errors,
      });
      if (errors.length > 0) {
        toast.warning(`Upload completed with ${errors.length} failed question(s).`);
      } else {
        toast.success("Successfully processed batch!");
      }
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="bg-[#1a110d]/40 p-6 rounded-xl border border-[#3e2723] space-y-4">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-[#0f0b0a] rounded-lg border border-[#3e2723]">
          <div className="text-sm text-[#a1887f]">
            <p className="font-bold text-[#eaddcf]">Need the format?</p>
            <p>
              Download the JSON template. Test inputs and outputs are raw text; replace the language
              slugs with existing supported languages. If codestubs are included, add one for every
              supported language. supportedLanguageIds can optionally restrict the question to a
              subset of enabled language IDs.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            size="sm"
            className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black bg-[#3e2723]"
          >
            <Download className="w-4 h-4" /> Template
          </Button>
        </div>

        {/* File Input */}
        <div className="space-y-4">
          <Input
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="bg-[#0f0b0a] border-[#3e2723] text-[#eaddcf] file:bg-[#3e2723] file:text-[#eaddcf] file:mr-4 hover:file:bg-[#5d4037] cursor-pointer"
          />

          <Button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="w-full bg-[#d4af37] text-black hover:bg-[#b5952f] font-bold"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "Processing..." : "Upload JSON"}
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <>
            <Alert
              className={
                stats.errors.length > 0
                  ? "bg-amber-900/20 border-amber-900 text-amber-300"
                  : "bg-green-900/20 border-green-900 text-green-400"
              }
            >
              {stats.errors.length > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle>
                {stats.errors.length > 0 ? "Completed with errors" : "Success"}
              </AlertTitle>
              <AlertDescription>
                Processed {stats.success} / {stats.total} questions.
              </AlertDescription>
            </Alert>
            {stats.errors.length > 0 && (
              <Alert className="bg-red-950/30 border-red-900 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Questions that failed</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {stats.errors.map((error, index) => (
                      <li key={`${index}-${error}`}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Scan } from "@/lib/types";

interface ScanUploaderProps {
  caseId: string;
  onUploadComplete: (scans: Scan[]) => void;
}

export function ScanUploader({ caseId, onUploadComplete }: ScanUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const stlFiles = accepted.filter((f) => f.name.toLowerCase().endsWith(".stl"));
    setPendingFiles((prev) => [...prev, ...stlFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/octet-stream": [".stl"] },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("caseId", caseId);
      pendingFiles.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPendingFiles([]);
      onUploadComplete(data.uploads || []);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop STL files here" : "Drag & drop STL files"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse. Expects paired files: ID L_MoldLower.stl / ID U_MoldUpper.stl
        </p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <File className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button onClick={uploadFiles} disabled={uploading} className="w-full">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : `Upload ${pendingFiles.length} file${pendingFiles.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}

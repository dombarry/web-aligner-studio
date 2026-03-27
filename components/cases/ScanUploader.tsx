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
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`group relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-primary/60 bg-primary/[0.04] shadow-[0_0_40px_rgba(0,112,243,0.08)]"
            : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${
          isDragActive
            ? "bg-primary/20 scale-110"
            : "bg-white/[0.04] group-hover:bg-white/[0.06]"
        }`}>
          <Upload className={`w-6 h-6 transition-colors ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <p className="text-sm font-medium">
          {isDragActive ? "Drop STL files here" : "Drag & drop STL files"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1.5">
          or click to browse
        </p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <File className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{f.name}</span>
              <span className="text-[11px] text-muted-foreground font-mono">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
                <X className="w-3.5 h-3.5" />
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

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Link as LinkIcon, Type, X, Loader2 } from "lucide-react";
import { useUploadContent, useProcessContent } from "@/hooks/use-content";
import { cn } from "@/lib/utils/cn";

interface UploadZoneProps {
  onUploadComplete?: (contentId: string) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url" | "text">("file");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadContent();
  const processMutation = useProcessContent();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setError(null);

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);

      try {
        const result = await uploadMutation.mutateAsync(formData);
        const contentId = result.content.id;
        await processMutation.mutateAsync(contentId);
        onUploadComplete?.(contentId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [uploadMutation, processMutation, title, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/epub+zip": [".epub"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append("url", url);
    if (title) formData.append("title", title);

    try {
      const result = await uploadMutation.mutateAsync(formData);
      const contentId = result.content.id;
      await processMutation.mutateAsync(contentId);
      setUrl("");
      onUploadComplete?.(contentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append("text", text);
    formData.append("title", title || "Pasted Text");

    try {
      const result = await uploadMutation.mutateAsync(formData);
      const contentId = result.content.id;
      await processMutation.mutateAsync(contentId);
      setText("");
      onUploadComplete?.(contentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const isLoading = uploadMutation.isPending || processMutation.isPending;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <div>
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-background p-1">
        {(["file", "url", "text"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {tab === "file" && <FileText className="h-4 w-4" />}
            {tab === "url" && <LinkIcon className="h-4 w-4" />}
            {tab === "text" && <Type className="h-4 w-4" />}
            {tab === "file" ? "File" : tab === "url" ? "URL" : "Text"}
          </button>
        ))}
      </div>

      {/* File Upload */}
      {activeTab === "file" && (
        <div
          {...getRootProps()}
          className={cn(
            "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            isLoading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          {isLoading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <>
              <Upload className="mb-3 h-10 w-10 text-text-secondary" />
              <p className="text-sm font-medium text-text-primary">
                {isDragActive
                  ? "Drop your file here"
                  : "Drag & drop or click to upload"}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                PDF, DOCX, EPUB, or TXT (max 50MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* URL Input */}
      {activeTab === "url" && (
        <div className="space-y-3">
          <input
            type="text"
            inputMode="url"
            placeholder="https://example.com/article or YouTube link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleUrlSubmit}
            disabled={!url.trim() || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="h-4 w-4" />
            )}
            Import URL
          </button>
        </div>
      )}

      {/* Text Input */}
      {activeTab === "text" && (
        <div className="space-y-3">
          <textarea
            placeholder="Paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim() || isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Type className="h-4 w-4" />
            )}
            Import Text
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

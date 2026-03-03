"use client";

import { UploadZone } from "@/components/content/upload-zone";
import { useContents } from "@/hooks/use-content";
import { ProcessingStatusBar } from "@/components/content/processing-status";
import { Upload, FileText, Globe, Type, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formats = [
  { label: "PDF", icon: FileText },
  { label: "DOCX", icon: FileText },
  { label: "TXT", icon: Type },
  { label: "URL", icon: Globe },
  { label: "Plain Text", icon: Type },
];

export default function UploadPage() {
  const router = useRouter();
  const { data } = useContents({ sort: "newest" });
  const recentUploads = data?.contents?.slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Upload Content
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add new learning materials to your library
        </p>
      </div>

      <UploadZone
        onUploadComplete={(id) => router.push(`/content/${id}`)}
      />

      {/* Supported formats */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Supported Formats
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {formats.map((fmt) => (
            <div
              key={fmt.label}
              className="flex items-center gap-2 text-sm text-text-secondary"
            >
              <fmt.icon className="h-4 w-4 text-success" />
              {fmt.label}
            </div>
          ))}
        </div>
      </div>

      {/* Recent uploads */}
      {recentUploads.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Recent Uploads
          </h2>
          <div className="space-y-3">
            {recentUploads.map((content) => (
              <div
                key={content.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {content.title}
                  </p>
                  {content.processingStatus !== "completed" &&
                    content.processingStatus !== "failed" && (
                      <ProcessingStatusBar
                        contentId={content.id}
                        initialStatus={content.processingStatus}
                        initialProgress={content.processingProgress || 0}
                      />
                    )}
                  {content.processingStatus === "completed" && (
                    <div className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle className="h-3 w-3" />
                      Processed
                    </div>
                  )}
                  {content.processingStatus === "failed" && (
                    <p className="text-xs text-danger">Processing failed</p>
                  )}
                </div>
                {content.processingStatus === "completed" && (
                  <Link
                    href={`/content/${content.id}`}
                    className="shrink-0 text-xs text-primary hover:underline"
                  >
                    Open
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

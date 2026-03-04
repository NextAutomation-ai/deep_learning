"use client";

import {
  FileText,
  Globe,
  Type,
  Brain,
  HelpCircle,
  Trash2,
  MoreVertical,
  Star,
} from "lucide-react";
import { ProcessingStatusBar } from "./processing-status";
import {
  useDeleteContent,
  useFavoriteContent,
  type ContentItem,
} from "@/hooks/use-content";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const sourceTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  url: Globe,
  text: Type,
  txt: Type,
};

const sourceTypeLabels: Record<string, string> = {
  pdf: "PDF",
  docx: "DOCX",
  url: "URL",
  text: "Text",
  txt: "TXT",
};

export function ContentCard({ content }: { content: ContentItem }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = useDeleteContent();
  const favoriteMutation = useFavoriteContent();
  const router = useRouter();
  const Icon = sourceTypeIcons[content.sourceType] || HelpCircle;
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const isProcessing =
    content.processingStatus !== "completed" &&
    content.processingStatus !== "failed";

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="group relative cursor-pointer rounded-xl border border-border bg-surface p-5 transition-all hover:shadow-md"
      onClick={() => {
        if (
          content.processingStatus === "completed" &&
          !showDeleteConfirm &&
          !showMenu &&
          !deleteMutation.isPending
        ) {
          router.push(`/content/${content.id}`);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
            content.processingStatus === "completed"
              ? "bg-success/10"
              : content.processingStatus === "failed"
                ? "bg-danger/10"
                : "bg-primary/10"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              content.processingStatus === "completed"
                ? "text-success"
                : content.processingStatus === "failed"
                  ? "text-danger"
                  : "text-primary"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-text-primary">
            {content.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span className="flex-shrink-0 rounded bg-background px-1.5 py-0.5">
              {sourceTypeLabels[content.sourceType] || content.sourceType}
            </span>
            {content.fileSize && (
              <span className="flex-shrink-0">{formatFileSize(content.fileSize)}</span>
            )}
            <span className="flex-shrink-0">{formatDate(content.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            title={content.isFavorited ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => {
              e.stopPropagation();
              favoriteMutation.mutate(content.id);
            }}
            className={cn(
              "rounded-lg p-1.5 transition-all",
              content.isFavorited
                ? "text-warning opacity-100"
                : "text-text-secondary opacity-0 hover:bg-surface-hover group-hover:opacity-100"
            )}
          >
            <Star
              className={cn(
                "h-4 w-4",
                content.isFavorited && "fill-warning"
              )}
            />
          </button>
          <div className="relative" ref={menuRef}>
          <button
            title="More options"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-1.5 text-text-secondary opacity-0 transition-opacity hover:bg-surface-hover group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-surface-hover"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Stats (show when completed) */}
      {content.processingStatus === "completed" && (
        <div className="mt-4 flex gap-4 text-xs text-text-secondary">
          {content.totalConcepts != null && content.totalConcepts > 0 && (
            <div className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" />
              {content.totalConcepts} concepts
            </div>
          )}
          {content.totalChunks != null && content.totalChunks > 0 && (
            <div>
              {content.totalChunks} sections
            </div>
          )}
        </div>
      )}

      {/* Processing status */}
      {(isProcessing || content.processingStatus === "failed") && (
        <div className="mt-4">
          <ProcessingStatusBar
            contentId={content.id}
            initialStatus={content.processingStatus}
            initialProgress={content.processingProgress || 0}
          />
        </div>
      )}

      <DeleteConfirmDialog
        contentTitle={content.title}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => deleteMutation.mutate(content.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

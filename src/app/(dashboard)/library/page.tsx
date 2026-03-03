"use client";

import { ContentGrid } from "@/components/content/content-grid";
import { UploadZone } from "@/components/content/upload-zone";
import {
  LibraryToolbar,
  type LibraryFilters,
} from "@/components/library/library-toolbar";
import { useContents } from "@/hooks/use-content";
import { Plus, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function LibraryPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<LibraryFilters>({
    q: "",
    type: "all",
    status: "all",
    sort: "newest",
    favorites: false,
  });

  const { data: allData } = useContents();
  const { data: filteredData } = useContents(filters);

  const totalCount = allData?.totalCount ?? allData?.contents?.length ?? 0;
  const filteredCount = filteredData?.contents?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Content Library
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Upload and manage your learning content
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          {showUpload ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {showUpload ? "Hide Upload" : "Upload Content"}
        </button>
      </div>

      {showUpload && (
        <UploadZone
          onUploadComplete={() => {
            // Keep upload zone open for subsequent uploads
          }}
        />
      )}

      <LibraryToolbar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      <ContentGrid filters={filters} />
    </div>
  );
}

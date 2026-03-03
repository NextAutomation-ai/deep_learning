"use client";

import { Library, Brain, Layers } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchResults {
  contents: Array<{
    id: string;
    title: string;
    sourceType: string;
  }>;
  concepts: Array<{
    id: string;
    contentId: string;
    name: string;
    definition: string;
  }>;
  flashcards: Array<{
    id: string;
    contentId: string;
    frontText: string;
  }>;
}

interface SearchDropdownProps {
  results: SearchResults;
  query: string;
  onSelect: (href: string) => void;
  onClose: () => void;
}

export function SearchDropdown({
  results,
  query,
  onSelect,
  onClose,
}: SearchDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const hasResults =
    results.contents.length > 0 ||
    results.concepts.length > 0 ||
    results.flashcards.length > 0;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-surface shadow-lg"
    >
      {!hasResults ? (
        <div className="px-4 py-6 text-center text-sm text-text-secondary">
          No results for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto py-2">
          {results.contents.length > 0 && (
            <Section title="Content" icon={Library}>
              {results.contents.map((item) => (
                <ResultItem
                  key={item.id}
                  label={item.title}
                  secondary={item.sourceType.toUpperCase()}
                  onClick={() => onSelect(`/content/${item.id}`)}
                />
              ))}
            </Section>
          )}

          {results.concepts.length > 0 && (
            <Section title="Concepts" icon={Brain}>
              {results.concepts.map((item) => (
                <ResultItem
                  key={item.id}
                  label={item.name}
                  secondary={
                    item.definition.length > 60
                      ? item.definition.slice(0, 60) + "..."
                      : item.definition
                  }
                  onClick={() => onSelect(`/content/${item.contentId}`)}
                />
              ))}
            </Section>
          )}

          {results.flashcards.length > 0 && (
            <Section title="Flashcards" icon={Layers}>
              {results.flashcards.map((item) => (
                <ResultItem
                  key={item.id}
                  label={
                    item.frontText.length > 60
                      ? item.frontText.slice(0, 60) + "..."
                      : item.frontText
                  }
                  onClick={() => onSelect(`/content/${item.contentId}`)}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Library;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  label,
  secondary,
  onClick,
}: {
  label: string;
  secondary?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-0.5 px-4 py-2 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="text-sm font-medium text-text-primary line-clamp-1">
        {label}
      </span>
      {secondary && (
        <span className="text-xs text-text-secondary line-clamp-1">
          {secondary}
        </span>
      )}
    </button>
  );
}

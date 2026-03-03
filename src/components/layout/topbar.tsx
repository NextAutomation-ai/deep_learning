"use client";

import { Search, Menu } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchDropdown } from "@/components/layout/search-dropdown";
import { useSearch } from "@/hooks/use-search";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function Topbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const { data } = useSearch(debouncedQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      setQuery("");
      setShowResults(false);
    },
    [router]
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Search content..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if (query.length >= 2) setShowResults(true);
            }}
            className="h-10 w-64 rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {showResults && debouncedQuery.length >= 2 && data && (
            <SearchDropdown
              results={data}
              query={debouncedQuery}
              onSelect={handleSelect}
              onClose={() => setShowResults(false)}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

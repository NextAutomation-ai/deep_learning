"use client";

import { DEFAULT_USER } from "@/lib/auth/default-user";
import { Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-white">
          {DEFAULT_USER.name[0]}
        </div>
        <span className="hidden text-text-primary md:block">
          {DEFAULT_USER.name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface py-2 shadow-lg">
          <div className="border-b border-border px-4 py-2">
            <p className="text-sm font-medium text-text-primary">
              {DEFAULT_USER.name}
            </p>
            <p className="text-xs text-text-secondary">{DEFAULT_USER.email}</p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      )}
    </div>
  );
}

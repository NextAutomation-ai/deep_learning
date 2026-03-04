"use client";

import { useSession, signOut } from "next-auth/react";
import { Settings, LogOut, LogIn } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function UserMenu() {
  const { data: session } = useSession();
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

  const user = session?.user;

  // Guest user — show Sign In button
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Link>
    );
  }

  const initial = user.name?.[0] || user.email?.[0] || "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-hover"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-white">
            {initial}
          </div>
        )}
        <span className="hidden text-text-primary md:block">
          {user.name || "User"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface py-2 shadow-lg">
          <div className="border-b border-border px-4 py-2">
            <p className="text-sm font-medium text-text-primary">
              {user.name || "User"}
            </p>
            <p className="text-xs text-text-secondary">{user.email}</p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-surface-hover"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

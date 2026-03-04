"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSettingsStore } from "@/stores/settings-store";
import { useThemeStore } from "@/stores/theme-store";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import { Sun, Moon, Monitor, Download, Trash2, User, BookOpen, Palette, LogIn } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toastSuccess, toastError } from "@/hooks/use-toast";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isGuest = !user;
  const { preferences, setPreference } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deeplearn-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Data exported successfully");
    } catch {
      toastError("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearProgress = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/user/progress", { method: "DELETE" });
      if (!res.ok) throw new Error("Clear failed");
      toastSuccess("Progress cleared successfully");
    } catch {
      toastError("Failed to clear progress");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your profile, preferences, and data
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
        </div>
        {isGuest ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-text-secondary">
              Sign in to view and manage your profile
            </p>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="h-14 w-14 rounded-full"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {user.name?.[0] || user.email?.[0] || "?"}
                </div>
              )}
              <div>
                <p className="font-medium text-text-primary">{user.name || "User"}</p>
                <p className="text-sm text-text-secondary">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Study Preferences */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Study Preferences
          </h2>
        </div>
        <div className="space-y-6">
          {/* Daily goal */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Daily Flashcard Goal
              </label>
              <span className="text-sm font-medium text-primary">
                {preferences.dailyGoal} cards
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={preferences.dailyGoal}
              onChange={(e) =>
                setPreference("dailyGoal", Number(e.target.value))
              }
              className="mt-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-text-secondary">
              <span>5</span>
              <span>100</span>
            </div>
          </div>

          {/* Due badge toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Show Due Count Badge
              </p>
              <p className="text-xs text-text-secondary">
                Display the number of due cards in the sidebar
              </p>
            </div>
            <button
              onClick={() =>
                setPreference(
                  "showDueCountBadge",
                  !preferences.showDueCountBadge
                )
              }
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                preferences.showDueCountBadge ? "bg-primary" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  preferences.showDueCountBadge && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Appearance
          </h2>
        </div>
        <div className="flex gap-3">
          {[
            { value: "light" as const, label: "Light", icon: Sun },
            { value: "dark" as const, label: "Dark", icon: Moon },
            { value: "system" as const, label: "System", icon: Monitor },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                theme === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-text-secondary hover:bg-surface-hover"
              )}
            >
              <option.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Data Management */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">
            Data Management
          </h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <Download className="h-5 w-5 text-text-secondary" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {isExporting ? "Exporting..." : "Export All Data"}
              </p>
              <p className="text-xs text-text-secondary">
                Download your content, progress, and stats as JSON
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowClearDialog(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-danger/20 p-4 text-left transition-colors hover:bg-danger/5"
          >
            <Trash2 className="h-5 w-5 text-danger" />
            <div>
              <p className="text-sm font-medium text-danger">Clear Progress</p>
              <p className="text-xs text-text-secondary">
                Reset all mastery levels, review history, and quiz stats
              </p>
            </div>
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear All Progress?"
        description="This will permanently reset all your mastery levels, review history, and quiz statistics. Your content and flashcards will not be affected. This action cannot be undone."
        confirmLabel="Clear Progress"
        onConfirm={handleClearProgress}
        variant="danger"
        isLoading={isClearing}
      />
    </div>
  );
}

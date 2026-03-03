"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const shortcuts = [
  {
    section: "Quiz",
    keys: [
      { key: "A / B / C / D", desc: "Select MCQ option" },
      { key: "1 / 2 / 3 / 4", desc: "Select option by number" },
      { key: "T / F", desc: "Select True or False" },
      { key: "\u2190 / \u2192", desc: "Previous / Next question" },
      { key: "Enter", desc: "Submit quiz (on last question)" },
    ],
  },
  {
    section: "Flashcards",
    keys: [
      { key: "Space", desc: "Flip card" },
      { key: "1", desc: "Rate: Again" },
      { key: "2", desc: "Rate: Hard" },
      { key: "3", desc: "Rate: Good" },
      { key: "4", desc: "Rate: Easy" },
    ],
  },
  {
    section: "General",
    keys: [{ key: "?", desc: "Toggle this overlay" }],
  },
];

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {shortcuts.map((group) => (
            <div key={group.section}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {group.section}
              </h3>
              <div className="space-y-1.5">
                {group.keys.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-text-secondary">{item.desc}</span>
                    <kbd className="rounded bg-background px-2 py-0.5 font-mono text-xs text-text-primary">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-text-secondary">
          Press <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">?</kbd> to
          close
        </p>
      </div>
    </div>
  );
}

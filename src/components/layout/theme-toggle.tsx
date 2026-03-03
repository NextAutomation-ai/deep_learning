"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils/cn";

const options = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary">
          <CurrentIcon className="h-5 w-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[140px] rounded-xl border border-border bg-surface p-1 shadow-lg"
          align="end"
          sideOffset={8}
        >
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <DropdownMenu.Item
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                  theme === opt.value
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

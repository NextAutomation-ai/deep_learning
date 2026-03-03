"use client";

import { cn } from "@/lib/utils/cn";
import { useBadges } from "@/hooks/use-badges";
import {
  Footprints,
  BookOpen,
  Gem,
  Telescope,
  Crown,
  Sparkles,
  GraduationCap,
  Zap,
  Sword,
  Star,
  MessageCircleQuestion,
  Swords,
  ScanSearch,
  Flame,
  Link,
  Building2,
  Trophy,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  BookOpen,
  Gem,
  Telescope,
  Crown,
  Sparkles,
  GraduationCap,
  Zap,
  Sword,
  Star,
  MessageCircleQuestion,
  Swords,
  ScanSearch,
  Flame,
  Link,
  Building2,
  Trophy,
};

const RARITY_COLORS: Record<string, string> = {
  common: "border-border",
  rare: "border-primary/50",
  epic: "border-purple-500/50",
  legendary: "border-warning/50",
};

const RARITY_BG: Record<string, string> = {
  common: "bg-border/20",
  rare: "bg-primary/10",
  epic: "bg-purple-500/10",
  legendary: "bg-warning/10",
};

export function BadgeShowcase() {
  const { data, isLoading } = useBadges();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-16 animate-pulse rounded-xl bg-border"
            />
          ))}
        </div>
      </div>
    );
  }

  const badges = data?.badges || [];
  const earned = badges.filter((b) => b.earned);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Badges</h3>
        <span className="text-xs text-text-secondary">
          {data?.totalEarned || 0} / {data?.totalAvailable || 0}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {badges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Trophy;
          return (
            <div
              key={badge.id}
              className={cn(
                "group relative flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all",
                badge.earned
                  ? `${RARITY_COLORS[badge.rarity]} ${RARITY_BG[badge.rarity]}`
                  : "border-border bg-border/10 opacity-30"
              )}
              title={`${badge.name}: ${badge.description}${badge.earned ? " (Earned)" : ""}`}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  badge.earned
                    ? badge.rarity === "legendary"
                      ? "text-warning"
                      : badge.rarity === "epic"
                        ? "text-purple-500"
                        : "text-primary"
                    : "text-text-secondary"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { WeeklyHeatmap } from "./weekly-heatmap";
import { XpChart } from "./xp-chart";
import { BadgeShowcase } from "./badge-showcase";
import { StreakDisplay } from "./streak-display";
import { MasteryChart } from "./mastery-chart";

export function GamificationSection() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <StreakDisplay />
        <XpChart />
      </div>
      <MasteryChart />
      <BadgeShowcase />
      <WeeklyHeatmap />
    </div>
  );
}

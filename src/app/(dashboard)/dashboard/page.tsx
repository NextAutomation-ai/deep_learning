import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { contents, userStats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLevelInfo } from "@/lib/learning/xp";
import Link from "next/link";
import { Upload, Library, Brain, Star, Flame, Trophy } from "lucide-react";
import { GamificationSection } from "@/components/dashboard/gamification-section";
import { DueCardsWidget } from "@/components/dashboard/due-cards-widget";

export default async function DashboardPage() {
  const session = await getUser();

  // Fetch real stats
  const stats = db
    .select()
    .from(userStats)
    .all()
    .find((s) => s.userId === session.user.id);

  const contentCount = db
    .select()
    .from(contents)
    .where(eq(contents.userId, session.user.id))
    .all().length;

  const levelInfo = getLevelInfo(stats?.totalXp ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back, {session.user.name?.split(" ")[0] || "Learner"}!
        </h1>
        <p className="mt-1 text-text-secondary">
          Ready to learn something new today?
        </p>
      </div>

      {/* XP & Level */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Level {levelInfo.level}</p>
              <p className="text-xl font-bold text-text-primary">{levelInfo.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{levelInfo.totalXp} XP</p>
            {levelInfo.progress < 1 && (
              <p className="text-xs text-text-secondary">
                {levelInfo.xpForNextLevel - levelInfo.xpInLevel} XP to {levelInfo.nextLevelName}
              </p>
            )}
          </div>
        </div>
        {levelInfo.progress < 1 && (
          <div className="mt-4 h-2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${levelInfo.progress * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Library} label="Content Items" value={String(contentCount)} color="primary" />
        <StatCard icon={Brain} label="Concepts Mastered" value={String(stats?.totalConceptsMastered ?? 0)} color="secondary" />
        <StatCard icon={Trophy} label="Quizzes Taken" value={String(stats?.totalQuizzesCompleted ?? 0)} color="accent" />
        <StatCard icon={Flame} label="Current Streak" value={String(stats?.currentStreak ?? 0)} color="warning" />
      </div>

      {/* Gamification: Streak, Charts, Badges, Heatmap */}
      <GamificationSection />

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Get Started
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DueCardsWidget />
          <Link
            href="/upload"
            className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <Upload className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Upload Content</p>
              <p className="text-sm text-text-secondary">
                PDF, DOCX, URL, or paste text
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}/10`}>
          <Icon className={`h-5 w-5 text-${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}

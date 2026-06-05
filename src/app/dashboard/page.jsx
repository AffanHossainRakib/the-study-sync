"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  PlayCircle,
  Clock,
  CheckCircle2,
  Flame,
  GraduationCap,
  TrendingUp,
  Activity,
} from "lucide-react";
import { getInstances, getUserProgress } from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import StatCard from "@/components/dashboard/StatCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import ProgressDonut from "@/components/dashboard/ProgressDonut";

const ACTIVITY_DAYS = 30;

const dayKey = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString().slice(0, 10);
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [instances, setInstances] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [instancesRes, progressRes] = await Promise.all([
        getInstances(token),
        getUserProgress(token).catch(() => ({ progress: [] })),
      ]);
      setInstances(instancesRes.instances || []);
      setProgress(progressRes.progress || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getDisplayTitle = (instance) => {
    const courseCode = instance.studyPlan?.courseCode || "General";
    const title = instance.customTitle || instance.studyPlan?.title;
    return courseCode !== "General" ? `${courseCode} - ${title}` : title;
  };

  // Only "active" courses count toward the dashboard (paused/dropped excluded).
  const activeInstances = useMemo(
    () => instances.filter((i) => (i.status || "active") === "active"),
    [instances],
  );

  // ---- Derived metrics ----------------------------------------------------
  const stats = useMemo(() => {
    const completedRecords = progress.filter(
      (p) => p.completed && p.completedAt,
    );

    // Completions bucketed by day
    const counts = {};
    completedRecords.forEach((p) => {
      const k = dayKey(p.completedAt);
      counts[k] = (counts[k] || 0) + 1;
    });

    // Activity series for the last N days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activity = [];
    for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      activity.push({
        key: k,
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        count: counts[k] || 0,
      });
    }

    // This week's completions (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const thisWeek = completedRecords.filter(
      (p) => new Date(p.completedAt) >= weekAgo,
    ).length;

    // Streaks (consecutive days with at least one completion)
    const daySet = new Set(Object.keys(counts));
    const keyOf = (dt) => dt.toISOString().slice(0, 10);
    let currentStreak = 0;
    const cursor = new Date(today);
    if (!daySet.has(keyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(keyOf(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    let bestStreak = 0;
    const sortedDays = Array.from(daySet).sort();
    let run = 0;
    let prev = null;
    sortedDays.forEach((k) => {
      if (prev) {
        const diff = (new Date(k) - new Date(prev)) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      bestStreak = Math.max(bestStreak, run);
      prev = k;
    });

    const activeCourses = activeInstances.filter(
      (i) => (i.resourcePercent || 0) < 100,
    ).length;
    const completedCourses = activeInstances.filter(
      (i) => i.totalResources > 0 && (i.resourcePercent || 0) >= 100,
    ).length;

    const sumCompleted = activeInstances.reduce(
      (s, i) => s + (i.completedResources || 0),
      0,
    );
    const sumTotal = activeInstances.reduce(
      (s, i) => s + (i.totalResources || 0),
      0,
    );
    const overall = sumTotal > 0 ? Math.round((sumCompleted / sumTotal) * 100) : 0;

    return {
      activity,
      thisWeek,
      currentStreak,
      bestStreak,
      resourcesCompleted: completedRecords.length,
      activeCourses,
      completedCourses,
      overall,
      hasActivity: completedRecords.length > 0,
    };
  }, [activeInstances, progress]);

  const deadlines = useMemo(() => {
    return activeInstances
      .filter(
        (inst) =>
          inst.deadline &&
          !(inst.totalResources > 0 && (inst.resourcePercent || 0) >= 100),
      )
      .map((inst) => ({
        ...inst,
        daysUntil: Math.ceil(
          (new Date(inst.deadline) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      }))
      .filter((inst) => inst.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);
  }, [activeInstances]);

  const courseProgress = useMemo(
    () =>
      [...activeInstances]
        .sort((a, b) => (b.resourcePercent || 0) - (a.resourcePercent || 0))
        .slice(0, 6),
    [activeInstances],
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // "Continue Learning" should surface something still in progress.
  const inProgressInstances = activeInstances.filter(
    (i) => !(i.totalResources > 0 && (i.resourcePercent || 0) >= 100),
  );
  const lastAccessedInstance = inProgressInstances[0];

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/5 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.displayName || "Learner"}
            </p>
          </div>
          <Link
            href="/create-plan"
            className="px-3 py-2 md:px-5 md:py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg text-xs md:text-sm"
          >
            <Plus className="h-4 w-4" />
            Create New Plan
          </Link>
        </div>

        {activeInstances.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No active study plans yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start by browsing available study plans or creating your own to
              begin your learning journey
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/plans"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Browse Plans
              </Link>
              <Link
                href="/create-plan"
                className="px-6 py-3 border-2 border-border rounded-xl hover:bg-muted font-medium text-foreground transition-all"
              >
                Create Plan
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={GraduationCap}
                label="Active Courses"
                value={stats.activeCourses}
                accent="primary"
              />
              <StatCard
                icon={CheckCircle2}
                label="Courses Completed"
                value={stats.completedCourses}
                accent="success"
              />
              <StatCard
                icon={Target}
                label="Resources Completed"
                value={stats.resourcesCompleted}
                accent="info"
                hint={`${stats.thisWeek} this week`}
              />
              <StatCard
                icon={Flame}
                label="Day Streak"
                value={stats.currentStreak}
                accent="warning"
                hint={`Best: ${stats.bestStreak} ${
                  stats.bestStreak === 1 ? "day" : "days"
                }`}
              />
            </div>

            {/* Activity + Overall progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Activity
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Last {ACTIVITY_DAYS} days
                  </span>
                </div>
                {stats.hasActivity ? (
                  <ActivityChart data={stats.activity} />
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Complete resources to see your activity here
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  Overall Progress
                </h2>
                <div className="flex-1 flex items-center justify-center">
                  <ProgressDonut value={stats.overall} label="of all resources" />
                </div>
              </div>
            </div>

            {/* Continue Learning + Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Continue Learning */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  Continue Learning
                </h2>

                {lastAccessedInstance ? (
                  <Link
                  href={`/instances/${lastAccessedInstance._id}`}
                  className="block bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                          Most Recent
                        </span>
                        {lastAccessedInstance.lastAccessedAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(
                              new Date(lastAccessedInstance.lastAccessedAt),
                              { addSuffix: true },
                            )}
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {getDisplayTitle(lastAccessedInstance)}
                      </h3>

                      <p className="text-muted-foreground mb-6 line-clamp-2">
                        {lastAccessedInstance.studyPlan?.shortDescription}
                      </p>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {lastAccessedInstance.completedResources}/
                            {lastAccessedInstance.totalResources} Resources
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {Math.round(
                              (lastAccessedInstance.completedTime || 0) / 60,
                            )}
                            h done
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:w-48 flex flex-col justify-center">
                      <div className="mb-2 flex justify-between text-sm font-medium">
                        <span className="text-foreground">Progress</span>
                        <span className="text-primary">
                          {Math.round(lastAccessedInstance.resourcePercent || 0)}
                          %
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-4">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${lastAccessedInstance.resourcePercent || 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        Resume
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  </Link>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      You&apos;re all caught up!
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      No courses in progress right now.
                    </p>
                    <Link
                      href="/plans"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Browse Plans
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Deadlines */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Deadlines
                </h2>

                {deadlines.length > 0 ? (
                  <div className="space-y-3">
                    {deadlines.map((instance) => (
                      <Link
                        key={instance._id}
                        href={`/instances/${instance._id}`}
                        className="block bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/40 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors pr-2">
                            {getDisplayTitle(instance)}
                          </h4>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                              instance.daysUntil <= 2
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {instance.daysUntil === 0
                              ? "Today"
                              : `${instance.daysUntil}d`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due {new Date(instance.deadline).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-border rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground text-sm">
                      No upcoming deadlines
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Course Progress */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Course Progress
                </h2>
                <Link
                  href="/instances"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {courseProgress.map((instance) => {
                  const pct = Math.round(instance.resourcePercent || 0);
                  return (
                    <Link
                      key={instance._id}
                      href={`/instances/${instance._id}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="font-medium text-foreground truncate pr-3 group-hover:text-primary transition-colors">
                          {getDisplayTitle(instance)}
                        </span>
                        <span className="text-muted-foreground shrink-0 tabular-nums">
                          {instance.completedResources}/
                          {instance.totalResources} · {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 100 ? "bg-success" : "bg-primary"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 mt-4 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/plans"
                  className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/40 hover:bg-muted transition-all"
                >
                  Browse Public Plans
                </Link>
                <Link
                  href="/my-plans"
                  className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:border-primary/40 hover:bg-muted transition-all"
                >
                  My Created Plans
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Eye,
  Plus,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "@/components/ui";
import {
  TimelineView,
  DashboardFilter,
  LogFormModal,
  MeetingFormModal,
} from "@/components/dev-history";
import { devHistoryApi } from "@/lib/supabase";
import type { DevHistory, DevPhase, LogType } from "@/types/database";
import { getDomainCategory } from "@/types/database";

export default function HomePage() {
  const [entries, setEntries] = useState<DevHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // Filter state
  const [selectedPhase, setSelectedPhase] = useState<DevPhase | "all">("all");
  const [selectedDomainCategory, setSelectedDomainCategory] = useState<
    "all" | "Optics" | "Mech" | "SW" | "Board"
  >("all");
  const [selectedLogType, setSelectedLogType] = useState<LogType | "all">("all");

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await devHistoryApi.getAll();
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Phase filter
      if (selectedPhase !== "all" && entry.dev_phase !== selectedPhase) {
        return false;
      }

      // Domain category filter
      if (selectedDomainCategory !== "all") {
        const category = getDomainCategory(entry.domain);
        if (selectedDomainCategory === "Board" && category !== "HW") {
          return false;
        }
        if (
          selectedDomainCategory !== "Board" &&
          category !== selectedDomainCategory
        ) {
          return false;
        }
      }

      // Log type filter
      if (selectedLogType !== "all" && entry.log_type !== selectedLogType) {
        return false;
      }

      return true;
    });
  }, [entries, selectedPhase, selectedDomainCategory, selectedLogType]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCount = entries.length;
    const alignmentIssues = entries.filter(
      (e) => e.log_type === "Alignment"
    ).length;
    const bugCount = entries.filter((e) => e.log_type === "Bug").length;
    const decisionCount = entries.filter(
      (e) => e.log_type === "Decision"
    ).length;
    const meetingCount = entries.filter(
      (e) => e.log_type === "Meeting"
    ).length;

    const byPhase: Record<string, number> = {};
    const byDomain: Record<string, number> = {};

    entries.forEach((entry) => {
      byPhase[entry.dev_phase] = (byPhase[entry.dev_phase] || 0) + 1;
      const category = getDomainCategory(entry.domain);
      byDomain[category] = (byDomain[category] || 0) + 1;
    });

    return {
      totalCount,
      alignmentIssues,
      bugCount,
      decisionCount,
      meetingCount,
      byPhase,
      byDomain,
    };
  }, [entries]);

  const handleLogSuccess = useCallback(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">DR-DevLog</h1>
                <p className="text-sm text-muted-foreground">
                  Digital Refraction System 개발 히스토리
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowMeetingModal(true)}
                variant="outline"
                size="lg"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
              >
                <Calendar className="h-5 w-5 mr-2" />
                회의록
              </Button>
              <Button onClick={() => setShowLogModal(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                빠른 기록
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                전체 기록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalCount}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-indigo-600">
                <Calendar className="h-4 w-4" />
                회의록
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-indigo-600">
                  {stats.meetingCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={stats.alignmentIssues > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                정렬 이슈
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-amber-600">
                  {stats.alignmentIssues}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={stats.bugCount > 0 ? "border-red-200 dark:border-red-800" : ""}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                버그
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  {stats.bugCount}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                의사결정
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {stats.decisionCount}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <DashboardFilter
          selectedPhase={selectedPhase}
          selectedDomainCategory={selectedDomainCategory}
          selectedLogType={selectedLogType}
          onPhaseChange={setSelectedPhase}
          onDomainCategoryChange={setSelectedDomainCategory}
          onLogTypeChange={setSelectedLogType}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline View - Main area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    타임라인
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {filteredEntries.length}건
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-20 w-full rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {error}
                  </div>
                ) : (
                  <TimelineView entries={filteredEntries} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel - Stats */}
          <div className="space-y-6">
            {/* Phase Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">단계별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : Object.keys(stats.byPhase).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.byPhase)
                      .sort((a, b) => b[1] - a[1])
                      .map(([phase, count]) => (
                        <div
                          key={phase}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">{phase}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(count / stats.totalCount) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-muted-foreground w-8 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    데이터가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Domain Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">도메인별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : Object.keys(stats.byDomain).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.byDomain)
                      .sort((a, b) => b[1] - a[1])
                      .map(([domain, count]) => {
                        const colorMap: Record<string, string> = {
                          Optics: "bg-violet-500",
                          Mech: "bg-orange-500",
                          HW: "bg-emerald-500",
                          SW: "bg-sky-500",
                        };
                        return (
                          <div
                            key={domain}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium">{domain}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${colorMap[domain] || "bg-slate-500"} rounded-full`}
                                  style={{
                                    width: `${(count / stats.totalCount) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-muted-foreground w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    데이터가 없습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Log Form Modal */}
      <LogFormModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        onSuccess={handleLogSuccess}
      />

      {/* Meeting Form Modal */}
      <MeetingFormModal
        open={showMeetingModal}
        onOpenChange={setShowMeetingModal}
        onSuccess={handleLogSuccess}
      />
    </div>
  );
}

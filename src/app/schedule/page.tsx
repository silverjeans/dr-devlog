"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  Eye,
  CalendarDays,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Loader2,
  Target,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Input,
  Label,
  Textarea,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { scheduleApi } from "@/lib/supabase";
import {
  type Schedule,
  type ScheduleInsert,
  type ScheduleStatus,
  type SchedulePriority,
  type DevPhase,
  SCHEDULE_STATUSES,
  SCHEDULE_PRIORITIES,
  DEV_PHASES,
  calculateDDay,
  getDDayColor,
} from "@/types/database";
import { cn } from "@/lib/utils";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
    status: "진행중" as ScheduleStatus,
    priority: "보통" as SchedulePriority,
    dev_phase: "" as DevPhase | "",
  });
  const [assignees, setAssignees] = useState<string[]>([]);
  const [newAssignee, setNewAssignee] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scheduleApi.getAll();
      setSchedules(data);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setError("일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start_date: format(new Date(), "yyyy-MM-dd"),
      due_date: "",
      status: "진행중",
      priority: "보통",
      dev_phase: "",
    });
    setAssignees([]);
    setNewAssignee("");
    setEditingSchedule(null);
  };

  const addAssignee = () => {
    if (newAssignee.trim() && !assignees.includes(newAssignee.trim())) {
      setAssignees([...assignees, newAssignee.trim()]);
      setNewAssignee("");
    }
  };

  const removeAssignee = (index: number) => {
    setAssignees(assignees.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title,
      description: schedule.description || "",
      start_date: schedule.start_date,
      due_date: schedule.due_date,
      status: schedule.status,
      priority: schedule.priority,
      dev_phase: schedule.dev_phase || "",
    });
    setAssignees(schedule.assignees || []);
    setNewAssignee("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.due_date) return;

    setFormLoading(true);
    try {
      const data: ScheduleInsert = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        due_date: formData.due_date,
        status: formData.status,
        priority: formData.priority,
        dev_phase: formData.dev_phase || null,
        assignees: assignees.length > 0 ? assignees : null,
      };

      if (editingSchedule) {
        await scheduleApi.update(editingSchedule.id, data);
      } else {
        await scheduleApi.create(data);
      }

      setShowModal(false);
      resetForm();
      fetchSchedules();
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await scheduleApi.delete(id);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const handleStatusChange = async (id: number, status: ScheduleStatus) => {
    try {
      await scheduleApi.update(id, { status });
      fetchSchedules();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Group schedules by status
  const groupedSchedules = useMemo(() => {
    const active = schedules.filter(
      (s) => s.status === "진행중" || s.status === "지연"
    );
    const upcoming = schedules.filter((s) => s.status === "예정");
    const completed = schedules.filter((s) => s.status === "완료");
    return { active, upcoming, completed };
  }, [schedules]);

  // Stats
  const stats = useMemo(() => {
    const total = schedules.length;
    const inProgress = schedules.filter((s) => s.status === "진행중").length;
    const delayed = schedules.filter((s) => s.status === "지연").length;
    const completed = schedules.filter((s) => s.status === "완료").length;

    // Find nearest deadline
    const activeSchedules = schedules.filter(
      (s) => s.status !== "완료"
    );
    const nearestDeadline = activeSchedules.length > 0
      ? activeSchedules.reduce((nearest, s) => {
          const dDay = calculateDDay(s.due_date);
          const nearestDDay = calculateDDay(nearest.due_date);
          return dDay < nearestDDay ? s : nearest;
        })
      : null;

    return { total, inProgress, delayed, completed, nearestDeadline };
  }, [schedules]);

  const renderDDayBadge = (dueDate: string, status: ScheduleStatus) => {
    if (status === "완료") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          완료
        </span>
      );
    }

    const dDay = calculateDDay(dueDate);
    const color = getDDayColor(dDay);
    const colorClasses = {
      red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      gray: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };

    const label = dDay === 0 ? "D-Day" : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`;

    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", colorClasses[color])}>
        {label}
      </span>
    );
  };

  const renderScheduleCard = (schedule: Schedule) => {
    const dDay = calculateDDay(schedule.due_date);
    const color = schedule.status === "완료" ? "gray" : getDDayColor(dDay);

    const borderColorClasses = {
      red: "border-l-red-500",
      amber: "border-l-amber-500",
      green: "border-l-green-500",
      gray: "border-l-gray-400",
    };

    return (
      <div
        key={schedule.id}
        className={cn(
          "p-4 rounded-lg border border-l-4 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow",
          borderColorClasses[color]
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {renderDDayBadge(schedule.due_date, schedule.status)}
              {schedule.dev_phase && (
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {schedule.dev_phase}
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 rounded text-xs",
                schedule.priority === "높음" && "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
                schedule.priority === "보통" && "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
                schedule.priority === "낮음" && "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
              )}>
                {schedule.priority}
              </span>
            </div>
            <h3 className="font-semibold text-base mb-1 truncate">{schedule.title}</h3>
            {schedule.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {schedule.description}
              </p>
            )}
            {schedule.assignees && schedule.assignees.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {schedule.assignees.map((name, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>시작: {schedule.start_date}</span>
              <span>마감: {schedule.due_date}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEditModal(schedule)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {schedule.status !== "완료" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700"
                onClick={() => handleStatusChange(schedule.id, "완료")}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={() => handleDelete(schedule.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
            <Button onClick={openCreateModal} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              일정 추가
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 border-b -mb-px">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-slate-300"
            >
              개발 히스토리
            </Link>
            <Link
              href="/schedule"
              className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary"
            >
              일정 관리
            </Link>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* D-Day Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                전체 일정
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-blue-600">
                <Clock className="h-4 w-4" />
                진행중
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {stats.inProgress}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={stats.delayed > 0 ? "border-red-200 dark:border-red-800" : ""}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                지연
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  {stats.delayed}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                완료
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </div>
              )}
            </CardContent>
          </Card>

          {stats.nearestDeadline && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-amber-600">
                  <Target className="h-4 w-4" />
                  가장 가까운 마감
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-400 truncate">
                  {renderDDayBadge(stats.nearestDeadline.due_date, stats.nearestDeadline.status)}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {stats.nearestDeadline.title}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Schedule Lists */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active & Delayed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-blue-600" />
                  진행중 / 지연
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {groupedSchedules.active.length}건
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSchedules.active.length > 0 ? (
                  groupedSchedules.active.map(renderScheduleCard)
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    진행중인 일정이 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-5 w-5 text-slate-600" />
                  예정
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {groupedSchedules.upcoming.length}건
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedSchedules.upcoming.length > 0 ? (
                  groupedSchedules.upcoming.map(renderScheduleCard)
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    예정된 일정이 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Completed */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  완료
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {groupedSchedules.completed.length}건
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedSchedules.completed.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedSchedules.completed.map(renderScheduleCard)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    완료된 일정이 없습니다
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Schedule Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingSchedule ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingSchedule ? "일정 수정" : "새 일정 추가"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-title">제목 *</Label>
              <Input
                id="schedule-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="일정 제목"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-description">설명</Label>
              <Textarea
                id="schedule-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="상세 설명 (선택)"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-start">시작일</Label>
                <Input
                  id="schedule-start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-due">마감일 *</Label>
                <Input
                  id="schedule-due"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>상태</Label>
                <Select
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as ScheduleStatus })}
                  options={SCHEDULE_STATUSES.map((s) => ({
                    value: s.value,
                    label: s.label,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select
                  value={formData.priority}
                  onChange={(value) => setFormData({ ...formData, priority: value as SchedulePriority })}
                  options={SCHEDULE_PRIORITIES.map((p) => ({
                    value: p.value,
                    label: p.label,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>개발 단계</Label>
                <Select
                  value={formData.dev_phase}
                  onChange={(value) => setFormData({ ...formData, dev_phase: value as DevPhase | "" })}
                  options={[
                    { value: "", label: "선택안함" },
                    ...DEV_PHASES.map((p) => ({
                      value: p.value,
                      label: p.label,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* 담당자 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                담당자
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="담당자 이름 추가"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAssignee();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addAssignee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {assignees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignees.map((name, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-sm"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeAssignee(index)}
                        className="hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={formLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : editingSchedule ? (
                  <Edit2 className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingSchedule ? "수정" : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

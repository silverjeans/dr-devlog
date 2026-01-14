"use client";

import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import {
  Eye,
  Focus,
  Target,
  Bug,
  CheckCircle,
  User,
  AlertTriangle,
  ChevronRight,
  Calendar,
  Users,
  ListTodo,
} from "lucide-react";

import type { DevHistory, Domain, LogType, DevPhase } from "@/types/database";
import { getDomainCategory } from "@/types/database";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
  entries: DevHistory[];
}

// Group entries by date
function groupByDate(entries: DevHistory[]): Map<string, DevHistory[]> {
  const groups = new Map<string, DevHistory[]>();

  entries.forEach((entry) => {
    const date = entry.event_date;
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  });

  return groups;
}

// Format date label
function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "오늘";
  if (isYesterday(date)) return "어제";
  return format(date, "M월 d일 (EEEE)", { locale: ko });
}

// Get domain badge style
function getDomainStyle(domain: Domain): { bg: string; text: string } {
  const category = getDomainCategory(domain);
  switch (category) {
    case "Optics":
      return { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400" };
    case "Mech":
      return { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400" };
    case "HW":
      return { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" };
    case "SW":
      return { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-400" };
    case "Common":
      return { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400" };
    default:
      return { bg: "bg-slate-500/10", text: "text-slate-700 dark:text-slate-400" };
  }
}

// Get phase badge style
function getPhaseStyle(phase: DevPhase): string {
  switch (phase) {
    case "기획":
      return "bg-slate-500";
    case "WS":
      return "bg-amber-500";
    case "PT":
      return "bg-orange-500";
    case "ES":
      return "bg-blue-500";
    case "PP":
      return "bg-purple-500";
    case "MP":
      return "bg-green-500";
    default:
      return "bg-slate-500";
  }
}

// Get log type icon and style
function getLogTypeInfo(logType: LogType): {
  icon: typeof Eye;
  style: string;
  isWarning: boolean;
  isMeeting: boolean;
} {
  switch (logType) {
    case "Meeting":
      return { icon: Calendar, style: "text-indigo-600", isWarning: false, isMeeting: true };
    case "Alignment":
      return { icon: Focus, style: "text-amber-600", isWarning: true, isMeeting: false };
    case "Calibration":
      return { icon: Target, style: "text-yellow-600", isWarning: false, isMeeting: false };
    case "Accuracy":
      return { icon: Eye, style: "text-blue-600", isWarning: false, isMeeting: false };
    case "Bug":
      return { icon: Bug, style: "text-red-600", isWarning: true, isMeeting: false };
    case "Decision":
      return { icon: CheckCircle, style: "text-green-600", isWarning: false, isMeeting: false };
    default:
      return { icon: CheckCircle, style: "text-slate-600", isWarning: false, isMeeting: false };
  }
}

interface TimelineItemProps {
  entry: DevHistory;
}

function TimelineItem({ entry }: TimelineItemProps) {
  const domainStyle = getDomainStyle(entry.domain);
  const logTypeInfo = getLogTypeInfo(entry.log_type);
  const LogTypeIcon = logTypeInfo.icon;

  // 회의록인 경우 다른 스타일로 렌더링
  if (logTypeInfo.isMeeting) {
    const attendees = entry.meta_data?.attendees || [];
    const actionItems = entry.meta_data?.action_items || [];

    return (
      <Link href={`/history/${entry.id}`} className="block group">
        <div
          className={cn(
            "relative pl-8 pb-6 border-l-2 ml-3 transition-colors",
            "border-indigo-300 dark:border-indigo-700 hover:border-indigo-500"
          )}
        >
          {/* Timeline dot - larger for meetings */}
          <div className="absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>

          {/* Meeting card */}
          <div
            className={cn(
              "p-5 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 transition-all",
              "hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-600"
            )}
          >
            {/* Meeting header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-xs font-medium mb-2">
                  <Calendar className="h-3 w-3" />
                  주간회의
                </span>
                <h4 className="font-semibold text-lg text-foreground group-hover:text-indigo-600 transition-colors">
                  {entry.title}
                </h4>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium text-white",
                  getPhaseStyle(entry.dev_phase)
                )}
              >
                {entry.dev_phase}
              </span>
            </div>

            {/* Content preview */}
            {entry.content && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {entry.content}
              </p>
            )}

            {/* Meeting metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {attendees.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                  참석자 {attendees.length}명
                </span>
              )}
              {actionItems.length > 0 && (
                <span className="flex items-center gap-1">
                  <ListTodo className="h-3.5 w-3.5 text-indigo-500" />
                  Action Items {actionItems.length}개
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{entry.author_name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // 일반 이슈 아이템
  return (
    <Link href={`/history/${entry.id}`} className="block group">
      <div
        className={cn(
          "relative pl-8 pb-6 border-l-2 ml-3 transition-colors",
          logTypeInfo.isWarning
            ? "border-amber-300 hover:border-amber-500"
            : "border-slate-200 dark:border-slate-700 hover:border-primary"
        )}
      >
        {/* Timeline dot */}
        <div
          className={cn(
            "absolute -left-2.5 w-5 h-5 rounded-full flex items-center justify-center",
            logTypeInfo.isWarning
              ? "bg-amber-100 dark:bg-amber-900/30"
              : "bg-slate-100 dark:bg-slate-800"
          )}
        >
          <LogTypeIcon className={cn("h-3 w-3", logTypeInfo.style)} />
        </div>

        {/* Content card */}
        <div
          className={cn(
            "p-4 rounded-lg border bg-card transition-all",
            "hover:shadow-md hover:border-primary/50",
            logTypeInfo.isWarning && "border-l-4 border-l-amber-500"
          )}
        >
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white",
                getPhaseStyle(entry.dev_phase)
              )}
            >
              {entry.dev_phase}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                domainStyle.bg,
                domainStyle.text
              )}
            >
              {entry.domain}
            </span>
            {logTypeInfo.isWarning && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {entry.log_type}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {entry.title}
          </h4>

          {/* Content preview */}
          {entry.content && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {entry.content}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{entry.author_name}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TimelineView({ entries }: TimelineViewProps) {
  const groupedEntries = groupByDate(entries);
  const sortedDates = Array.from(groupedEntries.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="text-lg mb-2">기록이 없습니다</p>
        <p className="text-sm">새로운 개발 히스토리를 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
              {formatDateLabel(date)}
            </h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {groupedEntries.get(date)!.length}건
            </span>
          </div>

          {/* Timeline items */}
          <div>
            {groupedEntries.get(date)!.map((entry) => (
              <TimelineItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

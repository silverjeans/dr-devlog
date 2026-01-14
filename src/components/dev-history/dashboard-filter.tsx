"use client";

import { cn } from "@/lib/utils";
import { Eye, Settings, Cpu, Code, Calendar } from "lucide-react";
import type { DevPhase, LogType } from "@/types/database";

interface DashboardFilterProps {
  selectedPhase: DevPhase | "all";
  selectedDomainCategory: "all" | "Optics" | "Mech" | "SW" | "Board";
  selectedLogType?: LogType | "all";
  onPhaseChange: (phase: DevPhase | "all") => void;
  onDomainCategoryChange: (category: "all" | "Optics" | "Mech" | "SW" | "Board") => void;
  onLogTypeChange?: (logType: LogType | "all") => void;
}

const phases: { value: DevPhase | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "WS", label: "WS" },
  { value: "PT", label: "PT" },
  { value: "ES", label: "ES" },
  { value: "PP", label: "PP" },
  { value: "MP", label: "MP" },
];

const domainCategories: {
  value: "all" | "Optics" | "Mech" | "SW" | "Board";
  label: string;
  icon: typeof Eye;
  color: string;
}[] = [
  { value: "all", label: "전체", icon: Eye, color: "text-slate-600" },
  { value: "Optics", label: "Optics", icon: Eye, color: "text-violet-600" },
  { value: "Mech", label: "Mech", icon: Settings, color: "text-orange-600" },
  { value: "SW", label: "SW", icon: Code, color: "text-sky-600" },
  { value: "Board", label: "Board", icon: Cpu, color: "text-emerald-600" },
];

const logTypes: {
  value: LogType | "all";
  label: string;
  icon: typeof Eye;
  color: string;
}[] = [
  { value: "all", label: "전체", icon: Eye, color: "text-slate-600" },
  { value: "Meeting", label: "회의록", icon: Calendar, color: "text-indigo-600" },
];

export function DashboardFilter({
  selectedPhase,
  selectedDomainCategory,
  selectedLogType = "all",
  onPhaseChange,
  onDomainCategoryChange,
  onLogTypeChange,
}: DashboardFilterProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Phase Filter */}
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            개발 단계
          </label>
          <div className="flex flex-wrap gap-1">
            {phases.map((phase) => (
              <button
                key={phase.value}
                onClick={() => onPhaseChange(phase.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  selectedPhase === phase.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 border"
                )}
              >
                {phase.label}
              </button>
            ))}
          </div>
        </div>

        {/* Domain Filter */}
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            도메인
          </label>
          <div className="flex flex-wrap gap-1">
            {domainCategories.map((domain) => {
              const Icon = domain.icon;
              return (
                <button
                  key={domain.value}
                  onClick={() => onDomainCategoryChange(domain.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    selectedDomainCategory === domain.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 border"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      selectedDomainCategory === domain.value
                        ? "text-primary-foreground"
                        : domain.color
                    )}
                  />
                  {domain.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log Type Filter */}
      {onLogTypeChange && (
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            유형
          </label>
          <div className="flex flex-wrap gap-1">
            {logTypes.map((logType) => {
              const Icon = logType.icon;
              return (
                <button
                  key={logType.value}
                  onClick={() => onLogTypeChange(logType.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                    selectedLogType === logType.value
                      ? logType.value === "Meeting"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-primary text-primary-foreground shadow-sm"
                      : "bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-700 border"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      selectedLogType === logType.value
                        ? "text-white"
                        : logType.color
                    )}
                  />
                  {logType.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

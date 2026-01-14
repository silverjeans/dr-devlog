"use client";

import { useState, useCallback } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button, Input, Select, Badge } from "@/components/ui";
import {
  DEV_PHASES,
  DOMAINS,
  LOG_TYPES,
  type DevPhase,
  type Domain,
  type LogType,
  type DevHistoryFilter,
} from "@/types/database";


interface HistoryFilterProps {
  onFilterChange: (filter: DevHistoryFilter) => void;
  initialFilter?: DevHistoryFilter;
}

export function HistoryFilter({
  onFilterChange,
  initialFilter,
}: HistoryFilterProps) {
  const [search, setSearch] = useState(initialFilter?.search || "");
  const [devPhase, setDevPhase] = useState<DevPhase | "">(
    (initialFilter?.dev_phase as DevPhase) || ""
  );
  const [domain, setDomain] = useState<Domain | "">(
    (initialFilter?.domain as Domain) || ""
  );
  const [logType, setLogType] = useState<LogType | "">(
    (initialFilter?.log_type as LogType) || ""
  );
  const [dateFrom, setDateFrom] = useState(initialFilter?.date_from || "");
  const [dateTo, setDateTo] = useState(initialFilter?.date_to || "");
  const [showFilters, setShowFilters] = useState(false);

  const applyFilter = useCallback(() => {
    const filter: DevHistoryFilter = {};
    if (search) filter.search = search;
    if (devPhase) filter.dev_phase = devPhase;
    if (domain) filter.domain = domain;
    if (logType) filter.log_type = logType;
    if (dateFrom) filter.date_from = dateFrom;
    if (dateTo) filter.date_to = dateTo;
    onFilterChange(filter);
  }, [search, devPhase, domain, logType, dateFrom, dateTo, onFilterChange]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDevPhase("");
    setDomain("");
    setLogType("");
    setDateFrom("");
    setDateTo("");
    onFilterChange({});
  }, [onFilterChange]);

  const hasActiveFilters =
    search || devPhase || domain || logType || dateFrom || dateTo;

  const activeFilterCount = [
    search,
    devPhase,
    domain,
    logType,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search bar and filter toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목, 내용 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilter();
              }
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            필터
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button onClick={applyFilter}>검색</Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dev Phase */}
            <div className="space-y-2">
              <label className="text-sm font-medium">개발 단계</label>
              <Select
                value={devPhase}
                onChange={(value) => setDevPhase(value as DevPhase | "")}
                options={[
                  { value: "", label: "전체" },
                  ...DEV_PHASES.map((p) => ({
                    value: p.value,
                    label: `${p.label} - ${p.description}`,
                  })),
                ]}
                placeholder="개발 단계 선택"
              />
            </div>

            {/* Domain */}
            <div className="space-y-2">
              <label className="text-sm font-medium">기술 도메인</label>
              <Select
                value={domain}
                onChange={(value) => setDomain(value as Domain | "")}
                options={[
                  { value: "", label: "전체" },
                  ...DOMAINS.map((d) => ({
                    value: d.value,
                    label: `${d.label} - ${d.description}`,
                  })),
                ]}
                placeholder="도메인 선택"
              />
            </div>

            {/* Log Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">로그 유형</label>
              <Select
                value={logType}
                onChange={(value) => setLogType(value as LogType | "")}
                options={[
                  { value: "", label: "전체" },
                  ...LOG_TYPES.map((l) => ({
                    value: l.value,
                    label: `${l.label} - ${l.description}`,
                  })),
                ]}
                placeholder="로그 유형 선택"
              />
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Filter actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                초기화
              </Button>
            )}
            <Button onClick={applyFilter}>필터 적용</Button>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {devPhase && (
            <Badge variant="secondary" className="gap-1">
              단계: {devPhase}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setDevPhase("");
                  setTimeout(applyFilter, 0);
                }}
              />
            </Badge>
          )}
          {domain && (
            <Badge variant="secondary" className="gap-1">
              도메인: {domain}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setDomain("");
                  setTimeout(applyFilter, 0);
                }}
              />
            </Badge>
          )}
          {logType && (
            <Badge variant="secondary" className="gap-1">
              유형: {logType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setLogType("");
                  setTimeout(applyFilter, 0);
                }}
              />
            </Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="gap-1">
              기간: {dateFrom || "~"} ~ {dateTo || "~"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setTimeout(applyFilter, 0);
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

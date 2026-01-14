"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, X, Link2, Loader2, Plus } from "lucide-react";
import {
  Button,
  Input,
  Badge,
} from "@/components/ui";
import { relatedIssuesApi } from "@/lib/supabase";
import type { DevHistory, Domain, LogType } from "@/types/database";
import { cn } from "@/lib/utils";
import { getDomainCategory } from "@/types/database";

type IssueInfo = Pick<DevHistory, "id" | "title" | "log_type" | "domain" | "event_date">;

interface IssueSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  excludeId?: number;
}

// Get badge variant based on domain category
function getDomainBadgeVariant(domain: Domain): "optics" | "mech" | "hw" | "sw" {
  const category = getDomainCategory(domain);
  switch (category) {
    case "Optics":
      return "optics";
    case "Mech":
      return "mech";
    case "HW":
      return "hw";
    case "SW":
      return "sw";
    default:
      return "sw";
  }
}

// Get badge variant based on log type
function getLogTypeBadgeVariant(
  logType: LogType
): "alignment" | "calibration" | "accuracy" | "bug" | "decision" {
  switch (logType) {
    case "Alignment":
      return "alignment";
    case "Calibration":
      return "calibration";
    case "Accuracy":
      return "accuracy";
    case "Bug":
      return "bug";
    case "Decision":
      return "decision";
    default:
      return "decision";
  }
}

export function IssueSelector({ selectedIds, onChange, excludeId }: IssueSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<IssueInfo[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<IssueInfo[]>([]);
  const [recentIssues, setRecentIssues] = useState<IssueInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch selected issues info on mount
  useEffect(() => {
    const fetchSelectedIssues = async () => {
      if (selectedIds.length > 0) {
        try {
          const issues = await relatedIssuesApi.getByIds(selectedIds);
          setSelectedIssues(issues);
        } catch (err) {
          console.error("Failed to fetch selected issues:", err);
        }
      } else {
        setSelectedIssues([]);
      }
    };
    fetchSelectedIssues();
  }, [selectedIds]);

  // Fetch recent issues for quick selection
  useEffect(() => {
    const fetchRecentIssues = async () => {
      try {
        const recent = await relatedIssuesApi.getRecent(excludeId, 10);
        setRecentIssues(recent);
      } catch (err) {
        console.error("Failed to fetch recent issues:", err);
      }
    };
    fetchRecentIssues();
  }, [excludeId]);

  // Search for issues
  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await relatedIssuesApi.searchForLinking(term, excludeId);
      setSearchResults(results);
    } catch (err) {
      console.error("Failed to search issues:", err);
    } finally {
      setLoading(false);
    }
  }, [excludeId]);

  // Add issue to selection
  const addIssue = (issue: IssueInfo) => {
    if (!selectedIds.includes(issue.id)) {
      onChange([...selectedIds, issue.id]);
    }
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Remove issue from selection
  const removeIssue = (id: number) => {
    onChange(selectedIds.filter((i) => i !== id));
  };

  // Issues to show in dropdown
  const dropdownIssues = searchTerm.trim() ? searchResults : recentIssues;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">관련 이슈 연결</span>
      </div>

      {/* Selected issues */}
      {selectedIssues.length > 0 && (
        <div className="space-y-2">
          {selectedIssues.map((issue) => (
            <div
              key={issue.id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getDomainBadgeVariant(issue.domain)} className="text-xs">
                    {issue.domain}
                  </Badge>
                  <Badge variant={getLogTypeBadgeVariant(issue.log_type)} className="text-xs">
                    {issue.log_type}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">{issue.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(issue.event_date), "yyyy.MM.dd", { locale: ko })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeIssue(issue.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이슈 검색... (제목 또는 내용)"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="pl-9"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {dropdownIssues.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">
                {searchTerm.trim() ? "검색 결과가 없습니다" : "최근 이슈가 없습니다"}
              </p>
            ) : (
              <>
                {!searchTerm.trim() && (
                  <p className="px-3 py-2 text-xs text-muted-foreground border-b">
                    최근 이슈
                  </p>
                )}
                {dropdownIssues
                  .filter((issue) => !selectedIds.includes(issue.id))
                  .map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => addIssue(issue)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0",
                        "flex items-start gap-2"
                      )}
                    >
                      <Plus className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge variant={getDomainBadgeVariant(issue.domain)} className="text-xs">
                            {issue.domain}
                          </Badge>
                          <Badge variant={getLogTypeBadgeVariant(issue.log_type)} className="text-xs">
                            {issue.log_type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(issue.event_date), "yyyy.MM.dd", { locale: ko })}
                        </p>
                      </div>
                    </button>
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

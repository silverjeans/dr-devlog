"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

import { HistoryCard } from "./history-card";
import { HistoryFilter } from "./history-filter";
import { Alert, AlertDescription, Skeleton, Button } from "@/components/ui";
import { devHistoryApi } from "@/lib/supabase";
import type { DevHistory, DevHistoryFilter } from "@/types/database";

const PAGE_SIZE = 20;

interface HistoryListProps {
  initialData?: DevHistory[];
}

export function HistoryList({ initialData }: HistoryListProps) {
  const [entries, setEntries] = useState<DevHistory[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DevHistoryFilter>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEntries = useCallback(async (currentFilter: DevHistoryFilter, reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    const currentPage = reset ? 0 : page;

    try {
      const result = await devHistoryApi.getPaginated(currentFilter, currentPage, PAGE_SIZE);
      if (reset) {
        setEntries(result.data);
      } else {
        setEntries(prev => [...prev, ...result.data]);
      }
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      if (!reset) {
        setPage(currentPage + 1);
      } else {
        setPage(1);
      }
    } catch (err) {
      console.error("Failed to fetch entries:", err);
      setError("데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchEntries(filter, false);
    }
  }, [fetchEntries, filter, loadingMore, hasMore]);

  useEffect(() => {
    if (!initialData) {
      fetchEntries({}, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleFilterChange = useCallback(
    (newFilter: DevHistoryFilter) => {
      setFilter(newFilter);
      fetchEntries(newFilter, true);
    },
    [fetchEntries]
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <HistoryFilter
        onFilterChange={handleFilterChange}
        initialFilter={filter}
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border rounded-lg space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">기록이 없습니다</p>
          <p className="text-sm">
            새로운 개발 히스토리를 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            총 {totalCount}개의 기록 중 {entries.length}개 표시
          </p>
          <div className="grid gap-4">
            {entries.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full max-w-md"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    불러오는 중...
                  </>
                ) : (
                  <>더 보기 ({entries.length} / {totalCount})</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

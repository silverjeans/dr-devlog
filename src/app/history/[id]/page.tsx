"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { HistoryDetail } from "@/components/dev-history";
import { Alert, AlertDescription } from "@/components/ui";
import { devHistoryApi } from "@/lib/supabase";
import type { DevHistory } from "@/types/database";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [entry, setEntry] = useState<DevHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntry() {
      try {
        const data = await devHistoryApi.getById(id);
        if (!data) {
          setError("기록을 찾을 수 없습니다.");
        } else {
          setEntry(data);
        }
      } catch (err) {
        console.error("Failed to fetch entry:", err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchEntry();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="container py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>{error || "기록을 찾을 수 없습니다."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <HistoryDetail entry={entry} />
    </div>
  );
}

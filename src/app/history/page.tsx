import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { HistoryList } from "@/components/dev-history";

export const metadata = {
  title: "개발 히스토리 - Opti-DevLog",
  description: "통합 광학 검사기 개발 히스토리 목록",
};

export default function HistoryPage() {
  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">개발 히스토리</h1>
          <p className="text-muted-foreground">
            ARK+LM 통합 광학 검사기 개발 과정의 모든 기록
          </p>
        </div>
        <Link href="/history/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 기록
          </Button>
        </Link>
      </div>

      <HistoryList />
    </div>
  );
}

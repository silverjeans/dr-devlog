import { HistoryForm } from "@/components/dev-history";

export const metadata = {
  title: "새 기록 - Opti-DevLog",
  description: "새로운 개발 히스토리 기록 추가",
};

export default function NewHistoryPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">새 기록 추가</h1>
        <p className="text-muted-foreground">
          개발 과정의 이슈, 결정 사항, 테스트 결과 등을 기록하세요.
        </p>
      </div>

      <HistoryForm mode="create" />
    </div>
  );
}

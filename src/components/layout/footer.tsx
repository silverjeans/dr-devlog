import { Eye } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Eye className="h-5 w-5" />
            <span className="text-sm font-medium">Opti-DevLog</span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            통합 광학 검사기 (ARK+LM) 개발 히스토리 관리 시스템
          </p>
        </div>
      </div>
    </footer>
  );
}

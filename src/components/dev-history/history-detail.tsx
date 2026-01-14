"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Focus,
  Target,
  Bug,
  CheckCircle,
  Link as LinkIcon,
  ExternalLink,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui";
import { CommentSection } from "./comment-section";
import { devHistoryApi } from "@/lib/supabase";
import type { DevHistory, Domain, LogType, DevPhase } from "@/types/database";
import { getDomainCategory } from "@/types/database";

interface HistoryDetailProps {
  entry: DevHistory;
}

// Get badge variant based on domain category
function getDomainBadgeVariant(
  domain: Domain
): "optics" | "mech" | "hw" | "sw" {
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

// Get badge variant based on dev phase
function getPhaseBadgeVariant(
  phase: DevPhase
): "planning" | "ws" | "pt" | "es" | "pp" | "mp" {
  switch (phase) {
    case "기획":
      return "planning";
    case "WS":
      return "ws";
    case "PT":
      return "pt";
    case "ES":
      return "es";
    case "PP":
      return "pp";
    case "MP":
      return "mp";
    default:
      return "planning";
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

// Get icon for log type
function getLogTypeIcon(logType: LogType) {
  switch (logType) {
    case "Alignment":
      return Focus;
    case "Calibration":
      return Target;
    case "Accuracy":
      return Eye;
    case "Bug":
      return Bug;
    case "Decision":
      return CheckCircle;
    default:
      return CheckCircle;
  }
}

export function HistoryDetail({ entry }: HistoryDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const LogTypeIcon = getLogTypeIcon(entry.log_type);
  const hasMetaData =
    entry.meta_data &&
    (entry.meta_data.diopterError ||
      entry.meta_data.modelEye ||
      entry.meta_data.repeatability);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await devHistoryApi.delete(entry.id);
      router.push("/history");
    } catch (err) {
      console.error("Failed to delete:", err);
      setError("삭제에 실패했습니다.");
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header with navigation and actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>
        <div className="flex gap-2">
          <Link href={`/history/${entry.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      {/* Main content card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={getPhaseBadgeVariant(entry.dev_phase)}>
              {entry.dev_phase}
            </Badge>
            <Badge variant={getDomainBadgeVariant(entry.domain)}>
              {entry.domain}
            </Badge>
            <Badge variant={getLogTypeBadgeVariant(entry.log_type)}>
              <LogTypeIcon className="h-3 w-3 mr-1" />
              {entry.log_type}
            </Badge>
          </div>
          <CardTitle className="text-2xl">{entry.title}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(entry.event_date), "yyyy년 MM월 dd일 (EEEE)", {
                  locale: ko,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{entry.author_name}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entry.content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{entry.content}</p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">내용이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* Metadata card */}
      {hasMetaData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              측정 데이터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {entry.meta_data.diopterError !== undefined && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Diopter 오차값</p>
                  <p className="text-2xl font-semibold">
                    {entry.meta_data.diopterError} D
                  </p>
                </div>
              )}
              {entry.meta_data.modelEye && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">모형안 정보</p>
                  <p className="text-lg font-semibold">
                    {entry.meta_data.modelEye}
                  </p>
                </div>
              )}
              {entry.meta_data.repeatability !== undefined && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">반복성 (σ)</p>
                  <p className="text-2xl font-semibold">
                    {entry.meta_data.repeatability}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images card */}
      {entry.image_urls && entry.image_urls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              첨부 이미지 ({entry.image_urls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {entry.image_urls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(url)}
                  className="relative aspect-square overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related links card */}
      {entry.related_links && entry.related_links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              관련 링크 ({entry.related_links.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {entry.related_links.map((link, index) => (
                <li key={index}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    <span className="text-primary hover:underline truncate">
                      {link}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Comments section */}
      <CommentSection devHistoryId={entry.id} />

      {/* Created time info */}
      <div className="text-sm text-muted-foreground text-center">
        생성: {format(new Date(entry.created_at), "yyyy.MM.dd HH:mm:ss")}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기록 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline" disabled={deleting}>
                취소
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>이미지 미리보기</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Preview"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Plus,
  X,
  Upload,
  Loader2,
  Camera,
  Eye,
  Focus,
  Target,
  Bug,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Link2,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { devHistoryApi, storageApi } from "@/lib/supabase";
import {
  DEV_PHASES,
  DOMAINS,
  LOG_TYPES,
  type DevPhase,
  type Domain,
  type LogType,
  type DevHistoryInsert,
} from "@/types/database";
import { cn } from "@/lib/utils";
import { IssueSelector } from "./issue-selector";

interface LogFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const logTypeIcons: Record<LogType, typeof Eye> = {
  Meeting: Calendar,
  Alignment: Focus,
  Calibration: Target,
  Accuracy: Eye,
  Bug: Bug,
  Decision: CheckCircle,
};

export function LogFormModal({ open, onOpenChange, onSuccess }: LogFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [authorName, setAuthorName] = useState("");
  const [devPhase, setDevPhase] = useState<DevPhase>("WS");
  const [domain, setDomain] = useState<Domain>("Optics_ARK");
  const [logType, setLogType] = useState<LogType>("Alignment");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [relatedLinks, setRelatedLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [relatedIssueIds, setRelatedIssueIds] = useState<number[]>([]);

  const resetForm = useCallback(() => {
    setEventDate(format(new Date(), "yyyy-MM-dd"));
    setAuthorName("");
    setDevPhase("WS");
    setDomain("Optics_ARK");
    setLogType("Alignment");
    setTitle("");
    setContent("");
    setImageUrls([]);
    setRelatedLinks([]);
    setNewLink("");
    setRelatedIssueIds([]);
    setError(null);
    setSuccess(false);
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadingImage(true);
      try {
        const uploadPromises = Array.from(files).map((file) =>
          storageApi.uploadImage(file)
        );
        const urls = await Promise.all(uploadPromises);
        setImageUrls((prev) => [...prev, ...urls]);
      } catch (err) {
        console.error("Image upload failed:", err);
        setError("이미지 업로드에 실패했습니다.");
      } finally {
        setUploadingImage(false);
      }
    },
    []
  );

  const removeImage = useCallback((index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addLink = () => {
    if (newLink.trim() && !relatedLinks.includes(newLink.trim())) {
      setRelatedLinks([...relatedLinks, newLink.trim()]);
      setNewLink("");
    }
  };

  const removeLink = (index: number) => {
    setRelatedLinks(relatedLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!authorName.trim()) {
      setError("작성자 이름을 입력해주세요.");
      setLoading(false);
      return;
    }
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      const data: DevHistoryInsert = {
        event_date: eventDate,
        author_name: authorName.trim(),
        dev_phase: devPhase,
        domain,
        log_type: logType,
        title: title.trim(),
        content: content.trim() || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        related_links: relatedLinks.length > 0 ? relatedLinks : null,
        meta_data: relatedIssueIds.length > 0 ? { related_issues: relatedIssueIds } : undefined,
      };

      await devHistoryApi.create(data);
      setSuccess(true);

      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }, 1000);
    } catch (err) {
      console.error("Failed to save:", err);
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            빠른 기록 추가
          </DialogTitle>
          <DialogDescription>
            실험실에서 빠르게 이슈나 결정 사항을 기록하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>기록이 저장되었습니다!</AlertDescription>
            </Alert>
          )}

          {/* Row 1: Date & Author */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-date">날짜</Label>
              <Input
                id="modal-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-author">작성자 *</Label>
              <Input
                id="modal-author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="이름"
                required
              />
            </div>
          </div>

          {/* Row 2: Phase & Domain */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>단계</Label>
              <Select
                value={devPhase}
                onChange={(value) => setDevPhase(value as DevPhase)}
                options={DEV_PHASES.map((p) => ({
                  value: p.value,
                  label: p.label,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>도메인</Label>
              <Select
                value={domain}
                onChange={(value) => setDomain(value as Domain)}
                options={DOMAINS.map((d) => ({
                  value: d.value,
                  label: d.label,
                }))}
              />
            </div>
          </div>

          {/* Row 3: Log Type (Radio style buttons) */}
          <div className="space-y-2">
            <Label>유형</Label>
            <div className="grid grid-cols-5 gap-2">
              {LOG_TYPES.map((type) => {
                const Icon = logTypeIcons[type.value];
                const isSelected = logType === type.value;
                const isWarning = type.value === "Alignment" || type.value === "Bug";

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setLogType(type.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? isWarning
                          ? "border-amber-500 bg-amber-500/10 text-amber-700"
                          : "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="modal-title">제목 *</Label>
            <Input
              id="modal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이슈나 결정 사항의 제목"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="modal-content">내용</Label>
            <Textarea
              id="modal-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상세 내용 (선택)"
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              사진 첨부
            </Label>
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="h-16 w-16 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Spot 이미지, Mire Ring 캡처 등을 첨부하세요.
            </p>
          </div>

          {/* 관련 이슈 연결 */}
          <IssueSelector
            selectedIds={relatedIssueIds}
            onChange={setRelatedIssueIds}
          />

          {/* 관련 링크 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              관련 문서 링크
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Google Drive, Notion 등 문서 링크"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addLink}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {relatedLinks.length > 0 && (
              <ul className="space-y-1">
                {relatedLinks.map((link, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50 border text-sm"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate flex-1 mr-2"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

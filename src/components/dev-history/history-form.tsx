"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  X,
  Upload,
  Link as LinkIcon,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { devHistoryApi, storageApi } from "@/lib/supabase";
import {
  DEV_PHASES,
  DOMAINS,
  LOG_TYPES,
  type DevHistory,
  type DevHistoryInsert,
  type DevHistoryUpdate,
  type DevPhase,
  type Domain,
  type LogType,
  type MetaData,
} from "@/types/database";

interface HistoryFormProps {
  entry?: DevHistory;
  mode: "create" | "edit";
}

export function HistoryForm({ entry, mode }: HistoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [eventDate, setEventDate] = useState(
    entry?.event_date || format(new Date(), "yyyy-MM-dd")
  );
  const [authorName, setAuthorName] = useState(entry?.author_name || "");
  const [devPhase, setDevPhase] = useState<DevPhase>(
    entry?.dev_phase || "기획"
  );
  const [domain, setDomain] = useState<Domain>(entry?.domain || "Optics_ARK");
  const [logType, setLogType] = useState<LogType>(entry?.log_type || "Decision");
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");

  // MetaData fields
  const [diopterError, setDiopterError] = useState<string>(
    entry?.meta_data?.diopterError?.toString() || ""
  );
  const [modelEye, setModelEye] = useState(entry?.meta_data?.modelEye || "");
  const [repeatability, setRepeatability] = useState<string>(
    entry?.meta_data?.repeatability?.toString() || ""
  );

  // Images and links
  const [imageUrls, setImageUrls] = useState<string[]>(entry?.image_urls || []);
  const [relatedLinks, setRelatedLinks] = useState<string[]>(
    entry?.related_links || []
  );
  const [newLink, setNewLink] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const addLink = useCallback(() => {
    if (newLink.trim()) {
      setRelatedLinks((prev) => [...prev, newLink.trim()]);
      setNewLink("");
    }
  }, [newLink]);

  const removeLink = useCallback((index: number) => {
    setRelatedLinks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
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

    // Build metadata
    const metaData: MetaData = {};
    if (diopterError) metaData.diopterError = parseFloat(diopterError);
    if (modelEye) metaData.modelEye = modelEye;
    if (repeatability) metaData.repeatability = parseFloat(repeatability);

    try {
      if (mode === "create") {
        const data: DevHistoryInsert = {
          event_date: eventDate,
          author_name: authorName.trim(),
          dev_phase: devPhase,
          domain,
          log_type: logType,
          title: title.trim(),
          content: content.trim() || null,
          meta_data: metaData,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          related_links: relatedLinks.length > 0 ? relatedLinks : null,
        };
        const created = await devHistoryApi.create(data);
        setSuccess(true);
        setTimeout(() => {
          router.push(`/history/${created.id}`);
        }, 1000);
      } else if (entry) {
        const data: DevHistoryUpdate = {
          event_date: eventDate,
          author_name: authorName.trim(),
          dev_phase: devPhase,
          domain,
          log_type: logType,
          title: title.trim(),
          content: content.trim() || null,
          meta_data: metaData,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          related_links: relatedLinks.length > 0 ? relatedLinks : null,
        };
        await devHistoryApi.update(entry.id, data);
        setSuccess(true);
        setTimeout(() => {
          router.push(`/history/${entry.id}`);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    if (!confirm("정말로 이 기록을 삭제하시겠습니까?")) return;

    setLoading(true);
    try {
      await devHistoryApi.delete(entry.id);
      router.push("/history");
    } catch (err) {
      console.error("Failed to delete:", err);
      setError("삭제에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>
            {mode === "create" ? "새 기록이 생성되었습니다!" : "수정되었습니다!"}
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">이벤트 날짜 *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorName">작성자 *</Label>
              <Input
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="이름을 입력하세요"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="devPhase">개발 단계 *</Label>
              <Select
                value={devPhase}
                onChange={(value) => setDevPhase(value as DevPhase)}
                options={DEV_PHASES.map((p) => ({
                  value: p.value,
                  label: `${p.label} - ${p.description}`,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">기술 도메인 *</Label>
              <Select
                value={domain}
                onChange={(value) => setDomain(value as Domain)}
                options={DOMAINS.map((d) => ({
                  value: d.value,
                  label: `${d.label}`,
                  description: d.description,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logType">로그 유형 *</Label>
              <Select
                value={logType}
                onChange={(value) => setLogType(value as LogType)}
                options={LOG_TYPES.map((l) => ({
                  value: l.value,
                  label: `${l.label} - ${l.description}`,
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이슈나 결정 사항의 제목을 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상세 내용을 입력하세요"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metadata (Optical specific) */}
      <Card>
        <CardHeader>
          <CardTitle>측정 데이터 (선택)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diopterError">Diopter 오차값</Label>
              <Input
                id="diopterError"
                type="number"
                step="0.01"
                value={diopterError}
                onChange={(e) => setDiopterError(e.target.value)}
                placeholder="예: 0.25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelEye">모형안 정보</Label>
              <Input
                id="modelEye"
                value={modelEye}
                onChange={(e) => setModelEye(e.target.value)}
                placeholder="예: Model Eye #3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repeatability">반복성 (σ)</Label>
              <Input
                id="repeatability"
                type="number"
                step="0.001"
                value={repeatability}
                onChange={(e) => setRepeatability(e.target.value)}
                placeholder="예: 0.05"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>이미지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="h-24 w-24 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
              {uploadingImage ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Related Links */}
      <Card>
        <CardHeader>
          <CardTitle>관련 링크</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="URL을 입력하세요"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addLink}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {relatedLinks.length > 0 && (
            <ul className="space-y-2">
              {relatedLinks.map((link, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <LinkIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate"
                    >
                      {link}
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === "create" ? "저장" : "수정"}
          </Button>
        </div>
      </div>
    </form>
  );
}

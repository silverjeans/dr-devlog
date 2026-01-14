"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Users, ListTodo, X, Plus, Loader2 } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Select,
} from "@/components/ui";
import { devHistoryApi } from "@/lib/supabase";
import { DEV_PHASES, type DevPhase, type DevHistoryInsert } from "@/types/database";
import { cn } from "@/lib/utils";

interface MeetingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MeetingFormModal({
  open,
  onOpenChange,
  onSuccess,
}: MeetingFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_date: format(new Date(), "yyyy-MM-dd"),
    author_name: "",
    dev_phase: "WS" as DevPhase,
    title: "",
    content: "",
  });

  // 참석자 관리
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState("");

  // Action Items 관리
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [newActionItem, setNewActionItem] = useState("");

  const addAttendee = () => {
    if (newAttendee.trim() && !attendees.includes(newAttendee.trim())) {
      setAttendees([...attendees, newAttendee.trim()]);
      setNewAttendee("");
    }
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const addActionItem = () => {
    if (newActionItem.trim()) {
      setActionItems([...actionItems, newActionItem.trim()]);
      setNewActionItem("");
    }
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const meetingData: DevHistoryInsert = {
        event_date: formData.event_date,
        author_name: formData.author_name,
        dev_phase: formData.dev_phase,
        domain: "Project_Common",
        log_type: "Meeting",
        title: formData.title,
        content: formData.content,
        meta_data: {
          attendees: attendees.length > 0 ? attendees : undefined,
          action_items: actionItems.length > 0 ? actionItems : undefined,
        },
      };

      await devHistoryApi.create(meetingData);

      // Reset form
      setFormData({
        event_date: format(new Date(), "yyyy-MM-dd"),
        author_name: "",
        dev_phase: "WS",
        title: "",
        content: "",
      });
      setAttendees([]);
      setActionItems([]);

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            주간 회의록 작성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">회의 일자</Label>
              <Input
                id="meeting-date"
                type="date"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-phase">개발 단계</Label>
              <Select
                value={formData.dev_phase}
                onChange={(value) =>
                  setFormData({ ...formData, dev_phase: value as DevPhase })
                }
                options={DEV_PHASES.map((phase) => ({
                  value: phase.value,
                  label: `${phase.label} - ${phase.description}`,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-author">작성자</Label>
              <Input
                id="meeting-author"
                placeholder="작성자 이름"
                value={formData.author_name}
                onChange={(e) =>
                  setFormData({ ...formData, author_name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-title">회의 제목</Label>
              <Input
                id="meeting-title"
                placeholder="예: 1월 2주차 주간회의"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* 참석자 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              참석자
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="참석자 이름 추가"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAttendee();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addAttendee}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attendees.map((attendee, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm"
                  >
                    {attendee}
                    <button
                      type="button"
                      onClick={() => removeAttendee(index)}
                      className="hover:text-indigo-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 회의 내용 */}
          <div className="space-y-2">
            <Label htmlFor="meeting-content">회의 내용</Label>
            <Textarea
              id="meeting-content"
              placeholder="회의에서 논의된 주요 내용을 작성하세요..."
              className="min-h-[150px]"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
            />
          </div>

          {/* Action Items */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Action Items
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="실행 항목 추가"
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addActionItem();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addActionItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {actionItems.length > 0 && (
              <ul className="space-y-2">
                {actionItems.map((item, index) => (
                  <li
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      "bg-slate-50 dark:bg-slate-800/50 border"
                    )}
                  >
                    <span className="text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeActionItem(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              회의록 저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

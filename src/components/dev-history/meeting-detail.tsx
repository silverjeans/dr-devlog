"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  Users,
  ListTodo,
  User,
  FileText,
  Link2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { DevHistory } from "@/types/database";
import { cn } from "@/lib/utils";

interface MeetingDetailProps {
  meeting: DevHistory;
  relatedIssues?: DevHistory[];
}

export function MeetingDetail({ meeting, relatedIssues }: MeetingDetailProps) {
  const attendees = meeting.meta_data?.attendees || [];
  const actionItems = meeting.meta_data?.action_items || [];

  return (
    <div className="space-y-6">
      {/* 회의 헤더 */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 mb-2">
              <Calendar className="h-4 w-4" />
              {format(parseISO(meeting.event_date), "yyyy년 M월 d일 (EEEE)", {
                locale: ko,
              })}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                작성: {meeting.author_name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                {meeting.dev_phase} 단계
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm font-medium">
            주간회의
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 메인 컨텐츠 영역 */}
        <div className="md:col-span-2 space-y-6">
          {/* 회의 내용 */}
          {meeting.content && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-slate-600" />
                  회의 내용
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {meeting.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListTodo className="h-5 w-5 text-indigo-600" />
                  Action Items
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {actionItems.length}개 항목
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {actionItems.map((item, index) => (
                    <li
                      key={index}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg",
                        "bg-slate-50 dark:bg-slate-800/50 border"
                      )}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white text-sm flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 관련 이슈 */}
          {relatedIssues && relatedIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Link2 className="h-5 w-5 text-orange-600" />
                  논의된 이슈
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {relatedIssues.length}개 이슈
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatedIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href={`/history/${issue.id}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              issue.log_type === "Bug" &&
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                              issue.log_type === "Alignment" &&
                                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                              issue.log_type === "Decision" &&
                                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              !["Bug", "Alignment", "Decision"].includes(issue.log_type) &&
                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            )}
                          >
                            {issue.log_type}
                          </span>
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {issue.title}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 참석자 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-indigo-600" />
                참석자
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {attendees.length}명
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attendees.map((attendee, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-sm"
                    >
                      <User className="h-3 w-3" />
                      {attendee}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">참석자 정보 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 회의 메타 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">회의 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">개발 단계</span>
                <span className="font-medium">{meeting.dev_phase}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">작성일</span>
                <span className="font-medium">
                  {format(parseISO(meeting.created_at), "yyyy.MM.dd HH:mm")}
                </span>
              </div>
              {meeting.meta_data?.next_meeting_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">다음 회의</span>
                  <span className="font-medium">
                    {format(
                      parseISO(meeting.meta_data.next_meeting_date),
                      "M월 d일"
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 첨부 이미지 */}
          {meeting.image_urls && meeting.image_urls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">첨부 자료</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {meeting.image_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      <img
                        src={url}
                        alt={`첨부 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  User,
  ArrowRight,
  Eye,
  Focus,
  Target,
  Bug,
  CheckCircle,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui";
import type { DevHistory, Domain, LogType, DevPhase } from "@/types/database";
import { getDomainCategory } from "@/types/database";

interface HistoryCardProps {
  entry: DevHistory;
}

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

export function HistoryCard({ entry }: HistoryCardProps) {
  const LogTypeIcon = getLogTypeIcon(entry.log_type);
  const hasImages = entry.image_urls && entry.image_urls.length > 0;
  const hasLinks = entry.related_links && entry.related_links.length > 0;

  return (
    <Link href={`/history/${entry.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
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
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          <CardTitle className="text-lg mt-2 line-clamp-2">
            {entry.title}
          </CardTitle>
          {entry.content && (
            <CardDescription className="line-clamp-2 mt-1">
              {entry.content}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(entry.event_date), "yyyy.MM.dd", {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>{entry.author_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasImages && (
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{entry.image_urls!.length}</span>
                </div>
              )}
              {hasLinks && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{entry.related_links!.length}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

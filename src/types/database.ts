// Database types for dev_history table
// Aligned with the optical equipment development tracking schema

export type DevPhase = '기획' | 'WS' | 'PT' | 'ES' | 'PP' | 'MP';

export type Domain =
  | 'Optics_ARK'      // 굴절검사 광학계
  | 'Optics_LM'       // 렌즈미터 광학계
  | 'Mech_Moving'     // XYZ/턱받침 구동
  | 'HW_Board'        // Main/Sensor 보드
  | 'SW_Algo'         // 영상처리/도수계산
  | 'SW_UI'           // 인터페이스
  | 'Project_Common'; // 프로젝트 공통 (회의록 등)

export type LogType =
  | 'Meeting'      // 주간회의
  | 'Alignment'    // 광축 정렬 이슈
  | 'Calibration'  // 보정값 문제
  | 'Accuracy'     // 측정 정확도
  | 'Bug'          // 버그
  | 'Decision';    // 의사결정

// Metadata type for optical measurements and meetings
export interface MetaData {
  // 회의록 관련 필드
  attendees?: string[];            // 참석자 목록
  action_items?: string[];         // 실행 항목 (Action Items)
  related_issues?: number[];       // 연관된 이슈 ID 목록
  next_meeting_date?: string;      // 다음 회의 일정

  // 측정/이슈 관련 필드
  diopterError?: number;           // 측정된 Diopter 오차값
  error_code?: string;             // 에러 코드
  measured_val?: number;           // 측정값
  modelEye?: string;               // 사용된 모형안 정보
  measurementRange?: {
    sph?: { min: number; max: number };
    cyl?: { min: number; max: number };
  };
  repeatability?: number;          // 반복성 데이터
  environmentCondition?: string;   // 환경 조건 (온도, 습도 등)
  softwareVersion?: string;        // 소프트웨어 버전
  firmwareVersion?: string;        // 펌웨어 버전
  testResults?: {
    passed: boolean;
    details?: string;
  };
  [key: string]: unknown;          // 추가 확장 필드
}

// Main dev_history type
export interface DevHistory {
  id: number;
  created_at: string;
  event_date: string;
  author_name: string;
  dev_phase: DevPhase;
  domain: Domain;
  log_type: LogType;
  title: string;
  content: string | null;
  meta_data: MetaData;
  image_urls: string[] | null;
  related_links: string[] | null;
}

// Type for creating new dev history entry
export interface DevHistoryInsert {
  event_date?: string;
  author_name: string;
  dev_phase: DevPhase;
  domain: Domain;
  log_type: LogType;
  title: string;
  content?: string | null;
  meta_data?: MetaData;
  image_urls?: string[] | null;
  related_links?: string[] | null;
}

// Type for updating dev history entry
export interface DevHistoryUpdate {
  event_date?: string;
  author_name?: string;
  dev_phase?: DevPhase;
  domain?: Domain;
  log_type?: LogType;
  title?: string;
  content?: string | null;
  meta_data?: MetaData;
  image_urls?: string[] | null;
  related_links?: string[] | null;
}

// Filter options for querying
export interface DevHistoryFilter {
  dev_phase?: DevPhase | DevPhase[];
  domain?: Domain | Domain[];
  log_type?: LogType | LogType[];
  author_name?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Constants for dropdown options
export const DEV_PHASES: { value: DevPhase; label: string; description: string }[] = [
  { value: '기획', label: '기획', description: '요구사항 정의 및 초기 설계' },
  { value: 'WS', label: 'WS', description: 'Working Sample - 동작 샘플' },
  { value: 'PT', label: 'PT', description: 'Prototype - 시제품' },
  { value: 'ES', label: 'ES', description: 'Engineering Sample - 엔지니어링 샘플' },
  { value: 'PP', label: 'PP', description: 'Pre-Production - 사전 양산' },
  { value: 'MP', label: 'MP', description: 'Mass Production - 양산' },
];

export const DOMAINS: { value: Domain; label: string; description: string; color: string }[] = [
  { value: 'Project_Common', label: 'Project_Common', description: '프로젝트 공통', color: 'common' },
  { value: 'Optics_ARK', label: 'Optics_ARK', description: '굴절검사 광학계', color: 'optics' },
  { value: 'Optics_LM', label: 'Optics_LM', description: '렌즈미터 광학계', color: 'optics' },
  { value: 'Mech_Moving', label: 'Mech_Moving', description: 'XYZ/턱받침 구동', color: 'mech' },
  { value: 'HW_Board', label: 'HW_Board', description: 'Main/Sensor 보드', color: 'hw' },
  { value: 'SW_Algo', label: 'SW_Algo', description: '영상처리/도수계산', color: 'sw' },
  { value: 'SW_UI', label: 'SW_UI', description: '인터페이스', color: 'sw' },
];

export const LOG_TYPES: { value: LogType; label: string; description: string }[] = [
  { value: 'Meeting', label: 'Meeting', description: '주간회의' },
  { value: 'Alignment', label: 'Alignment', description: '광축 정렬 이슈' },
  { value: 'Calibration', label: 'Calibration', description: '보정값 문제' },
  { value: 'Accuracy', label: 'Accuracy', description: '측정 정확도' },
  { value: 'Bug', label: 'Bug', description: '버그' },
  { value: 'Decision', label: 'Decision', description: '의사결정' },
];

// Domain color mapping utility
export function getDomainColor(domain: Domain): string {
  const domainInfo = DOMAINS.find(d => d.value === domain);
  return domainInfo?.color || 'muted';
}

// Get domain category (Optics, Mech, HW, SW, Common)
export function getDomainCategory(domain: Domain): 'Optics' | 'Mech' | 'HW' | 'SW' | 'Common' {
  if (domain === 'Project_Common') return 'Common';
  if (domain.startsWith('Optics_')) return 'Optics';
  if (domain.startsWith('Mech_')) return 'Mech';
  if (domain.startsWith('HW_')) return 'HW';
  return 'SW';
}

// Check if entry is a meeting
export function isMeeting(entry: DevHistory): boolean {
  return entry.log_type === 'Meeting';
}

// Check if entry is a warning type (Alignment, Bug)
export function isWarningType(logType: LogType): boolean {
  return logType === 'Alignment' || logType === 'Bug';
}

// ============================================
// Schedule (일정 관리) Types
// ============================================

export type ScheduleStatus = '진행중' | '완료' | '지연' | '예정';
export type SchedulePriority = '높음' | '보통' | '낮음';

export interface Schedule {
  id: number;
  created_at: string;
  title: string;
  description: string | null;
  start_date: string;
  due_date: string;
  status: ScheduleStatus;
  priority: SchedulePriority;
  dev_phase: DevPhase | null;
}

export interface ScheduleInsert {
  title: string;
  description?: string | null;
  start_date?: string;
  due_date: string;
  status?: ScheduleStatus;
  priority?: SchedulePriority;
  dev_phase?: DevPhase | null;
}

export interface ScheduleUpdate {
  title?: string;
  description?: string | null;
  start_date?: string;
  due_date?: string;
  status?: ScheduleStatus;
  priority?: SchedulePriority;
  dev_phase?: DevPhase | null;
}

export const SCHEDULE_STATUSES: { value: ScheduleStatus; label: string; color: string }[] = [
  { value: '진행중', label: '진행중', color: 'blue' },
  { value: '완료', label: '완료', color: 'green' },
  { value: '지연', label: '지연', color: 'red' },
  { value: '예정', label: '예정', color: 'gray' },
];

export const SCHEDULE_PRIORITIES: { value: SchedulePriority; label: string; color: string }[] = [
  { value: '높음', label: '높음', color: 'red' },
  { value: '보통', label: '보통', color: 'yellow' },
  { value: '낮음', label: '낮음', color: 'gray' },
];

// Calculate D-Day from due date
export function calculateDDay(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Get D-Day color based on remaining days
export function getDDayColor(dDays: number): 'red' | 'amber' | 'green' | 'gray' {
  if (dDays < 0) return 'red';      // 지남
  if (dDays <= 7) return 'red';     // 7일 이내
  if (dDays <= 14) return 'amber';  // 14일 이내
  return 'green';                   // 여유
}

// ============================================
// Comment (댓글) Types
// ============================================

export interface Comment {
  id: number;
  created_at: string;
  dev_history_id: number;
  author_name: string;
  content: string;
}

export interface CommentInsert {
  dev_history_id: number;
  author_name: string;
  content: string;
}

export interface CommentUpdate {
  content?: string;
}

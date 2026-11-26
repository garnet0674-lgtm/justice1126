export type InspectionResult = '적합' | '부적합' | '조치필요';

export type InspectionStatus = 'overdue' | 'dueSoon' | 'normal' | 'unentered';

export interface InspectionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  result: InspectionResult;
  actionTaken: string;
  note: string;
  createdAt: string;
}

export interface InspectionItem {
  id: string;
  category: string;
  name: string;
  cycleMonths: number;
  lastInspectedDate: string; // YYYY-MM-DD or ''
  vendorOrManager: string;
  legalBasis: string;
  note: string;
  records: InspectionRecord[];
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComputedInspectionItem extends InspectionItem {
  nextDueDate: string; // YYYY-MM-DD or ''
  daysRemaining: number | null; // negative = overdue, 0 = due today, positive = future
  status: InspectionStatus;
}

export interface AppSettings {
  facilityName: string;
  warningDays: number;
  categories: string[];
}

export interface AppState {
  items: InspectionItem[];
  settings: AppSettings;
}

export interface ExportPayload {
  version: number;
  exportedAt: string;
  settings: AppSettings;
  items: InspectionItem[];
}

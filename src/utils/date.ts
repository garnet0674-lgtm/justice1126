import { ComputedInspectionItem, InspectionItem, InspectionStatus } from '../types/inspection';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

export function addDays(dateStr: string, days: number): string {
  const base = parseLocalDate(dateStr);
  if (!base) return '';
  const result = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return formatDate(result);
}

export function addMonths(dateStr: string, months: number): string {
  const base = parseLocalDate(dateStr);
  if (!base || !Number.isFinite(months) || months <= 0) return '';
  const targetYear = base.getFullYear();
  const targetMonthIndex = base.getMonth() + Math.round(months);
  const originalDay = base.getDate();

  const firstOfTarget = new Date(targetYear, targetMonthIndex, 1);
  const daysInTargetMonth = new Date(
    firstOfTarget.getFullYear(),
    firstOfTarget.getMonth() + 1,
    0
  ).getDate();
  const clampedDay = Math.min(originalDay, daysInTargetMonth);
  const result = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), clampedDay);
  return formatDate(result);
}

export function diffDays(fromDateStr: string, toDateStr: string): number | null {
  const from = parseLocalDate(fromDateStr);
  const to = parseLocalDate(toDateStr);
  if (!from || !to) return null;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / MS_PER_DAY);
}

export function computeInspectionItem(
  item: InspectionItem,
  todayStr: string,
  warningDays: number
): ComputedInspectionItem {
  const hasLastDate = Boolean(parseLocalDate(item.lastInspectedDate));
  if (!hasLastDate || !Number.isFinite(item.cycleMonths) || item.cycleMonths <= 0) {
    return {
      ...item,
      nextDueDate: '',
      daysRemaining: null,
      status: 'unentered',
    };
  }

  const nextDueDate = addMonths(item.lastInspectedDate, item.cycleMonths);
  const daysRemaining = diffDays(todayStr, nextDueDate);

  let status: InspectionStatus = 'normal';
  if (daysRemaining === null) {
    status = 'unentered';
  } else if (daysRemaining < 0) {
    status = 'overdue';
  } else if (daysRemaining <= warningDays) {
    status = 'dueSoon';
  } else {
    status = 'normal';
  }

  return {
    ...item,
    nextDueDate,
    daysRemaining,
    status,
  };
}

export function getStatusLabel(status: InspectionStatus): string {
  switch (status) {
    case 'overdue':
      return '지연';
    case 'dueSoon':
      return '임박';
    case 'normal':
      return '정상';
    case 'unentered':
      return '미입력';
  }
}

export function formatDaysRemaining(daysRemaining: number | null): string {
  if (daysRemaining === null) return '최근 점검일 미입력';
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}일 지연`;
  if (daysRemaining === 0) return '오늘 예정';
  return `${daysRemaining}일 남음`;
}

export function getWeekdayName(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[d.getDay()];
}

export interface CalendarCell {
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
}

export function getMonthCalendarCells(year: number, monthIndex: number): CalendarCell[] {
  const firstDay = new Date(year, monthIndex, 1);
  const startWeekday = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const d = new Date(year, monthIndex - 1, dayNum);
    cells.push({
      dateStr: formatDate(d),
      day: dayNum,
      isCurrentMonth: false,
    });
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = new Date(year, monthIndex, dayNum);
    cells.push({
      dateStr: formatDate(d),
      day: dayNum,
      isCurrentMonth: true,
    });
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let dayNum = 1; dayNum <= remaining; dayNum++) {
    const d = new Date(year, monthIndex + 1, dayNum);
    cells.push({
      dateStr: formatDate(d),
      day: dayNum,
      isCurrentMonth: false,
    });
  }

  return cells;
}

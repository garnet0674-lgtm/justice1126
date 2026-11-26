import {
  AppSettings,
  AppState,
  ComputedInspectionItem,
  ExportPayload,
  InspectionItem,
  InspectionRecord,
  InspectionResult,
} from '../types/inspection';
import { addDays, addMonths, getStatusLabel, getTodayString, parseLocalDate } from './date';

const STORAGE_KEY = 'civic_facility_inspection_manager_v1';

export const DEFAULT_CATEGORIES = ['소방', '전기', '승강기', '가스', '정화조', '기타'];

export const DEFAULT_SETTINGS: AppSettings = {
  facilityName: '청사(복지관) 시설 관리',
  warningDays: 30,
  categories: [...DEFAULT_CATEGORIES],
};

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createId(prefix = 'item'): string {
  return generateId(prefix);
}

/**
 * 초기 예시용 가상 샘플 데이터 5건 생성.
 * 주의: 점검 주기는 화면 시연용 임의 예시값이며 실제 법정 주기가 아닙니다.
 * 근거 법령은 사용자가 직접 입력하도록 기본값을 비워 둡니다.
 */
export function createSampleItems(todayStr = getTodayString()): InspectionItem[] {
  const nowIso = new Date().toISOString();

  // 1. 소방 - 지연 상태가 되도록 최근 점검일 설정 (예시 주기 6개월 -> 예정일이 오늘보다 14일 전)
  const targetOverdue = addDays(todayStr, -14);
  const fireLastDate = addMonths(targetOverdue, -6) || addDays(todayStr, -194);

  // 2. 승강기 - 임박 상태가 되도록 최근 점검일 설정 (예시 주기 12개월 -> 예정일이 오늘 + 10일)
  const targetDueSoon = addDays(todayStr, 10);
  const elevatorLastDate = addMonths(targetDueSoon, -12) || addDays(todayStr, -355);

  // 3. 전기 - 임박 상태 (예시 주기 12개월 -> 예정일이 오늘 + 25일)
  const targetDueSoon2 = addDays(todayStr, 25);
  const electricLastDate = addMonths(targetDueSoon2, -12) || addDays(todayStr, -340);

  // 4. 가스 - 정상 상태 (예시 주기 6개월 -> 예정일이 오늘 + 95일)
  const targetNormal = addDays(todayStr, 95);
  const gasLastDate = addMonths(targetNormal, -6) || addDays(todayStr, -88);

  // 5. 저수조(물탱크) - 최근 점검일 2026-06-20 (6개월 주기 -> 다음 예정일 2026-12-20)

  return [
    {
      id: 'sample_fire_1',
      category: '소방',
      name: '[예시] 소방시설 작동점검',
      cycleMonths: 6,
      lastInspectedDate: fireLastDate,
      vendorOrManager: '(예시) 대한소방안전관리(주)',
      legalBasis: '',
      note: '샘플 데이터입니다. 실제 청사 점검 주기 및 근거 법령을 확인하여 수정해 주세요.',
      isSample: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      records: [
        {
          id: 'sample_rec_fire_1',
          date: fireLastDate,
          result: '적합',
          actionTaken: '수신반·유도등·소화전 압력 확인 완료 (예시 기록)',
          note: '가상 샘플 이력',
          createdAt: nowIso,
        },
      ],
    },
    {
      id: 'sample_elevator_2',
      category: '승강기',
      name: '[예시] 승강기 정기안전검사',
      cycleMonths: 12,
      lastInspectedDate: elevatorLastDate,
      vendorOrManager: '(예시) 한국승강기안전공단',
      legalBasis: '',
      note: '샘플 데이터입니다. 실제 점검일과 주기로 교체해 주세요.',
      isSample: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      records: [
        {
          id: 'sample_rec_elevator_1',
          date: elevatorLastDate,
          result: '조치필요',
          actionTaken: '비상통화장치 배터리 교체 권고 후 교체 완료 (예시 기록)',
          note: '가상 샘플 이력',
          createdAt: nowIso,
        },
      ],
    },
    {
      id: 'sample_electric_3',
      category: '전기',
      name: '[예시] 전기설비 정기점검',
      cycleMonths: 12,
      lastInspectedDate: electricLastDate,
      vendorOrManager: '(예시) OO전기안전관리대행',
      legalBasis: '',
      note: '샘플 데이터입니다. 수전설비 용량별 법정 주기를 별도 확인하세요.',
      isSample: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      records: [
        {
          id: 'sample_rec_electric_1',
          date: electricLastDate,
          result: '적합',
          actionTaken: '분전반 누전차단기 동작 시험 이상 없음 (예시 기록)',
          note: '가상 샘플 이력',
          createdAt: nowIso,
        },
      ],
    },
    {
      id: 'sample_gas_4',
      category: '가스',
      name: '[예시] 도시가스 사용시설 안전점검',
      cycleMonths: 6,
      lastInspectedDate: gasLastDate,
      vendorOrManager: '(예시) 지역도시가스(주)',
      legalBasis: '',
      note: '샘플 데이터입니다. 복지관 급식실·보일러실 기준을 확인하세요.',
      isSample: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      records: [
        {
          id: 'sample_rec_gas_1',
          date: gasLastDate,
          result: '적합',
          actionTaken: '배관 가스 누출 점검 및 경보기 작동 확인 (예시 기록)',
          note: '가상 샘플 이력',
          createdAt: nowIso,
        },
      ],
    },
    {
      id: 'sample_watertank_5',
      category: '기타',
      name: '[예시] 저수조(물탱크) 청소',
      cycleMonths: 6,
      lastInspectedDate: '2026-06-20',
      vendorOrManager: '(예시) OO저수조위생관리',
      legalBasis: '',
      note: '샘플 데이터입니다. 실제 저수조 청소 이력 및 관계 법령 주기를 확인하여 수정해 주세요.',
      isSample: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      records: [
        {
          id: 'sample_rec_watertank_1',
          date: '2026-06-20',
          result: '적합',
          actionTaken: '저수조 내부 고압 세척 및 수질·소독 상태 점검 완료 (예시 기록)',
          note: '가상 샘플 이력',
          createdAt: nowIso,
        },
      ],
    },
  ];
}

function sanitizeRecord(raw: unknown): InspectionRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const date = typeof r.date === 'string' && parseLocalDate(r.date) ? r.date : '';
  if (!date) return null;
  const validResults: InspectionResult[] = ['적합', '부적합', '조치필요'];
  const result = validResults.includes(r.result as InspectionResult)
    ? (r.result as InspectionResult)
    : '적합';

  return {
    id: typeof r.id === 'string' && r.id ? r.id : generateId('rec'),
    date,
    result,
    actionTaken: typeof r.actionTaken === 'string' ? r.actionTaken : '',
    note: typeof r.note === 'string' ? r.note : '',
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
  };
}

function sanitizeItem(raw: unknown): InspectionItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!name) return null;

  const category =
    typeof obj.category === 'string' && obj.category.trim() ? obj.category.trim() : '기타';
  const cycleNum = Number(obj.cycleMonths);
  const cycleMonths = Number.isFinite(cycleNum) && cycleNum > 0 ? Math.round(cycleNum) : 1;
  const lastInspectedDate =
    typeof obj.lastInspectedDate === 'string' && parseLocalDate(obj.lastInspectedDate)
      ? obj.lastInspectedDate
      : '';

  const rawRecords = Array.isArray(obj.records) ? obj.records : [];
  const records = rawRecords
    .map(sanitizeRecord)
    .filter((rec): rec is InspectionRecord => rec !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : generateId('item'),
    category,
    name,
    cycleMonths,
    lastInspectedDate,
    vendorOrManager: typeof obj.vendorOrManager === 'string' ? obj.vendorOrManager : '',
    legalBasis: typeof obj.legalBasis === 'string' ? obj.legalBasis : '',
    note: typeof obj.note === 'string' ? obj.note : '',
    records,
    isSample: Boolean(obj.isSample),
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
  };
}

function sanitizeSettings(raw: unknown, itemCategories: string[] = []): AppSettings {
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const facilityName =
    typeof s.facilityName === 'string' && s.facilityName.trim()
      ? s.facilityName.trim()
      : DEFAULT_SETTINGS.facilityName;
  const warningRaw = Number(s.warningDays);
  const warningDays =
    Number.isFinite(warningRaw) && warningRaw >= 0 && warningRaw <= 365
      ? Math.round(warningRaw)
      : DEFAULT_SETTINGS.warningDays;

  const baseCategories = Array.isArray(s.categories)
    ? s.categories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
    : [...DEFAULT_CATEGORIES];

  const mergedSet = new Set<string>([
    ...(baseCategories.length > 0 ? baseCategories : DEFAULT_CATEGORIES),
    ...itemCategories,
  ]);

  return {
    facilityName,
    warningDays,
    categories: Array.from(mergedSet),
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppState = {
        items: createSampleItems(),
        settings: { ...DEFAULT_SETTINGS },
      };
      saveAppState(initial);
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const rawItems = Array.isArray(parsed.items)
      ? parsed.items.map(sanitizeItem).filter((i): i is InspectionItem => i !== null)
      : [];
    const items = rawItems.map((item) => {
      if (
        item.isSample &&
        (item.id === 'sample_septic_5' ||
          item.id === 'sample_watertank_5' ||
          item.name.includes('오수처리시설') ||
          item.name.includes('저수조(물탱크)'))
      ) {
        const shouldSetDefaultDate = !item.lastInspectedDate;
        const nextLastDate = shouldSetDefaultDate ? '2026-06-20' : item.lastInspectedDate;
        const nextRecords =
          shouldSetDefaultDate && item.records.length === 0
            ? [
                {
                  id: 'sample_rec_watertank_1',
                  date: '2026-06-20',
                  result: '적합' as const,
                  actionTaken: '저수조 내부 고압 세척 및 수질·소독 상태 점검 완료 (예시 기록)',
                  note: '가상 샘플 이력',
                  createdAt: item.createdAt,
                },
              ]
            : item.records;
        return {
          ...item,
          id: 'sample_watertank_5',
          category: '기타',
          name: '[예시] 저수조(물탱크) 청소',
          cycleMonths: 6,
          lastInspectedDate: nextLastDate,
          vendorOrManager: '(예시) OO저수조위생관리',
          note:
            item.note === '최근 점검일이 비어 있는 미입력 상태 예시입니다.'
              ? '샘플 데이터입니다. 실제 저수조 청소 이력 및 관계 법령 주기를 확인하여 수정해 주세요.'
              : item.note,
          records: nextRecords,
        };
      }
      return item;
    });
    const itemCategories = items.map((i) => i.category);
    const settings = sanitizeSettings(parsed.settings, itemCategories);

    return { items, settings };
  } catch {
    return {
      items: createSampleItems(),
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('localStorage 저장 중 오류가 발생했습니다.', err);
  }
}

export function parseImportedJson(jsonText: string): AppState {
  const parsed = JSON.parse(jsonText) as Partial<ExportPayload & AppState>;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
    throw new Error('올바른 점검 일정 백업 JSON 형식이 아닙니다.');
  }

  const items = parsed.items
    .map(sanitizeItem)
    .filter((i): i is InspectionItem => i !== null);
  const itemCategories = items.map((i) => i.category);
  const settings = sanitizeSettings(parsed.settings, itemCategories);

  return { items, settings };
}

export function downloadJsonBackup(state: AppState): void {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    items: state.items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const today = getTodayString();
  triggerDownload(blob, `청사_시설점검_백업_${today}.json`);
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadItemsCsv(
  items: ComputedInspectionItem[],
  facilityName: string
): void {
  const headers = [
    '점검 분야',
    '점검 명칭',
    '점검 주기(개월)',
    '최근 점검일',
    '다음 점검 예정일',
    '상태',
    '남은/지연 일수',
    '점검 업체/담당자',
    '근거 법령',
    '비고',
    '누적 이력 건수',
  ];

  const rows = items.map((item) => {
    const dayText =
      item.daysRemaining === null
        ? '미입력'
        : item.daysRemaining < 0
          ? `${Math.abs(item.daysRemaining)}일 지연`
          : item.daysRemaining === 0
            ? '오늘 예정'
            : `${item.daysRemaining}일 남음`;

    return [
      item.category,
      item.name,
      item.cycleMonths,
      item.lastInspectedDate || '',
      item.nextDueDate || '',
      getStatusLabel(item.status),
      dayText,
      item.vendorOrManager,
      item.legalBasis,
      item.note,
      item.records.length,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  // 엑셀 한글 깨짐 방지를 위한 UTF-8 BOM(\uFEFF) 포함
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const safeName = facilityName.replace(/[\\/:*?"<>|]/g, '_');
  triggerDownload(blob, `${safeName}_점검일정표_${getTodayString()}.csv`);
}

export function downloadHistoryCsv(
  items: ComputedInspectionItem[],
  facilityName: string
): void {
  const headers = [
    '점검 분야',
    '점검 명칭',
    '점검일',
    '점검 결과',
    '조치 내용',
    '이력 비고',
    '점검 업체/담당자',
    '근거 법령',
  ];

  const flatRows: string[] = [];
  const allRecords: Array<{ item: ComputedInspectionItem; record: InspectionRecord }> = [];

  for (const item of items) {
    for (const record of item.records) {
      allRecords.push({ item, record });
    }
  }

  allRecords.sort((a, b) => b.record.date.localeCompare(a.record.date));

  for (const { item, record } of allRecords) {
    flatRows.push(
      [
        item.category,
        item.name,
        record.date,
        record.result,
        record.actionTaken,
        record.note,
        item.vendorOrManager,
        item.legalBasis,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  const csvContent = [headers.map(escapeCsvCell).join(','), ...flatRows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const safeName = facilityName.replace(/[\\/:*?"<>|]/g, '_');
  triggerDownload(blob, `${safeName}_점검이력대장_${getTodayString()}.csv`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

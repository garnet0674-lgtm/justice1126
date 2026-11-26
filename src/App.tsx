import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  List,
  Plus,
  Printer,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { CalendarView } from './components/CalendarView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DetailDrawer } from './components/DetailDrawer';
import { InspectionTable } from './components/InspectionTable';
import { ItemFormModal } from './components/ItemFormModal';
import { PrintSheet } from './components/PrintSheet';
import { SettingsModal } from './components/SettingsModal';
import { SummaryCards } from './components/SummaryCards';
import {
  AppSettings,
  AppState,
  ComputedInspectionItem,
  InspectionItem,
  InspectionRecord,
  InspectionResult,
  InspectionStatus,
} from './types/inspection';
import { computeInspectionItem, getTodayString, getWeekdayName } from './utils/date';
import {
  createId,
  createSampleItems,
  downloadItemsCsv,
  loadAppState,
  saveAppState,
} from './utils/storage';

type ViewMode = 'list' | 'calendar';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  onConfirm: () => void;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [todayStr] = useState<string>(() => getTodayString());

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | InspectionStatus>('all');

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [drawerOpenAddForm, setDrawerOpenAddForm] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '확인',
    destructive: false,
    onConfirm: () => {},
  });

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  const computedItems = useMemo<ComputedInspectionItem[]>(() => {
    return appState.items.map((item) =>
      computeInspectionItem(item, todayStr, appState.settings.warningDays)
    );
  }, [appState.items, todayStr, appState.settings.warningDays]);

  const sortedItems = useMemo(() => {
    return [...computedItems].sort((a, b) => {
      if (a.nextDueDate && b.nextDueDate) {
        const cmp = a.nextDueDate.localeCompare(b.nextDueDate);
        if (cmp !== 0) return cmp;
      } else if (a.nextDueDate && !b.nextDueDate) {
        return -1;
      } else if (!a.nextDueDate && b.nextDueDate) {
        return 1;
      }
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [computedItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          item.category,
          item.name,
          item.vendorOrManager,
          item.legalBasis,
          item.note,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sortedItems, categoryFilter, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let normal = 0;
    let unentered = 0;
    for (const item of computedItems) {
      if (item.status === 'overdue') overdue += 1;
      else if (item.status === 'dueSoon') dueSoon += 1;
      else if (item.status === 'normal') normal += 1;
      else unentered += 1;
    }
    return {
      total: computedItems.length,
      overdue,
      dueSoon,
      normal,
      unentered,
    };
  }, [computedItems]);

  const sampleCount = useMemo(
    () => appState.items.filter((i) => i.isSample).length,
    [appState.items]
  );

  const selectedItem = useMemo(
    () => computedItems.find((i) => i.id === selectedItemId) || null,
    [computedItems, selectedItemId]
  );

  const availableCategories = useMemo(() => {
    const set = new Set<string>(appState.settings.categories);
    for (const item of appState.items) {
      set.add(item.category);
    }
    return Array.from(set);
  }, [appState.settings.categories, appState.items]);

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (item: InspectionItem) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleSaveItem = (
    data: {
      category: string;
      name: string;
      cycleMonths: number;
      lastInspectedDate: string;
      vendorOrManager: string;
      legalBasis: string;
      note: string;
    },
    newCategory?: string
  ) => {
    const nowIso = new Date().toISOString();

    setAppState((prev) => {
      const nextCategories =
        newCategory && !prev.settings.categories.includes(newCategory)
          ? [...prev.settings.categories, newCategory]
          : prev.settings.categories;

      if (editingItem) {
        const nextItems = prev.items.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                ...data,
                isSample: false,
                updatedAt: nowIso,
              }
            : item
        );
        return {
          items: nextItems,
          settings: { ...prev.settings, categories: nextCategories },
        };
      }

      const newItem: InspectionItem = {
        id: createId('item'),
        ...data,
        records: [],
        isSample: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      return {
        items: [newItem, ...prev.items],
        settings: { ...prev.settings, categories: nextCategories },
      };
    });

    setFormModalOpen(false);
    setEditingItem(null);
    setToastMsg(editingItem ? '점검 항목 정보가 수정되었습니다.' : '새 점검 항목이 등록되었습니다.');
  };

  const handleDeleteItem = (item: ComputedInspectionItem) => {
    setConfirmState({
      open: true,
      title: '점검 항목 삭제',
      message: `'${item.name}' 항목과 누적된 점검 이력 ${item.records.length}건을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`,
      confirmLabel: '삭제',
      destructive: true,
      onConfirm: () => {
        setAppState((prev) => ({
          ...prev,
          items: prev.items.filter((i) => i.id !== item.id),
        }));
        if (selectedItemId === item.id) {
          setSelectedItemId(null);
        }
        closeConfirm();
        setToastMsg('점검 항목이 삭제되었습니다.');
      },
    });
  };

  const handleAddRecord = (
    itemId: string,
    recordData: {
      date: string;
      result: InspectionResult;
      actionTaken: string;
      note: string;
    }
  ) => {
    const nowIso = new Date().toISOString();
    const newRecord: InspectionRecord = {
      id: createId('rec'),
      ...recordData,
      createdAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const nextRecords = [newRecord, ...item.records].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        const latestRecordDate = nextRecords[0]?.date || '';
        const updatedLastDate =
          !item.lastInspectedDate || latestRecordDate >= item.lastInspectedDate
            ? latestRecordDate
            : item.lastInspectedDate;

        return {
          ...item,
          lastInspectedDate: updatedLastDate,
          records: nextRecords,
          updatedAt: nowIso,
        };
      }),
    }));

    setToastMsg('점검 이력이 저장되었으며 최근 점검일과 다음 예정일이 갱신되었습니다.');
  };

  const handleDeleteRecord = (itemId: string, recordId: string) => {
    setConfirmState({
      open: true,
      title: '점검 이력 삭제',
      message: '선택한 점검 이력을 삭제하시겠습니까? 삭제 후 남은 이력 기준으로 최근 점검일이 재계산됩니다.',
      confirmLabel: '삭제',
      destructive: true,
      onConfirm: () => {
        const nowIso = new Date().toISOString();
        setAppState((prev) => ({
          ...prev,
          items: prev.items.map((item) => {
            if (item.id !== itemId) return item;
            const nextRecords = item.records
              .filter((r) => r.id !== recordId)
              .sort((a, b) => b.date.localeCompare(a.date));
            const nextLastDate = nextRecords[0]?.date ?? '';
            return {
              ...item,
              lastInspectedDate: nextLastDate,
              records: nextRecords,
              updatedAt: nowIso,
            };
          }),
        }));
        closeConfirm();
        setToastMsg('점검 이력이 삭제되었습니다.');
      },
    });
  };

  const handleDeleteAllSamples = () => {
    setConfirmState({
      open: true,
      title: '샘플 데이터 전체 삭제',
      message: `안내용 가상 샘플 데이터 ${sampleCount}건을 모두 삭제하시겠습니까?\n직접 등록하거나 수정하신 항목은 그대로 유지됩니다.`,
      confirmLabel: '샘플 전체 삭제',
      destructive: true,
      onConfirm: () => {
        setAppState((prev) => ({
          ...prev,
          items: prev.items.filter((item) => !item.isSample),
        }));
        if (selectedItem?.isSample) {
          setSelectedItemId(null);
        }
        closeConfirm();
        setToastMsg('가상 샘플 데이터가 모두 삭제되었습니다.');
      },
    });
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
    setToastMsg('환경 설정이 저장되었습니다.');
  };

  const handleRequestRestoreJson = (importedState: AppState) => {
    setConfirmState({
      open: true,
      title: 'JSON 백업 불러오기',
      message: `백업 파일에서 점검 항목 ${importedState.items.length}건을 불러오시겠습니까?\n현재 브라우저에 저장된 기존 데이터는 백업 파일 내용으로 교체됩니다.`,
      confirmLabel: '불러오기 적용',
      destructive: false,
      onConfirm: () => {
        setAppState(importedState);
        setSelectedItemId(null);
        setSettingsModalOpen(false);
        closeConfirm();
        setToastMsg(`백업 파일에서 ${importedState.items.length}건의 항목을 복원했습니다.`);
      },
    });
  };

  const handleRequestRestoreSample = () => {
    setConfirmState({
      open: true,
      title: '예시 샘플 데이터 불러오기',
      message: '현재 목록에 예시 샘플 데이터 5건을 다시 추가하시겠습니까?',
      confirmLabel: '샘플 추가',
      destructive: false,
      onConfirm: () => {
        const samples = createSampleItems(todayStr).map((s) => ({
          ...s,
          id: createId('sample'),
        }));
        setAppState((prev) => ({
          ...prev,
          items: [...prev.items.filter((i) => !i.isSample), ...samples],
        }));
        setSettingsModalOpen(false);
        closeConfirm();
        setToastMsg('예시 샘플 데이터 5건이 추가되었습니다.');
      },
    });
  };

  const handleRequestClearAll = () => {
    setConfirmState({
      open: true,
      title: '전체 데이터 초기화',
      message:
        '등록된 모든 점검 항목과 이력을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으므로 필요시 먼저 JSON 백업을 저장해 주세요.',
      confirmLabel: '전체 삭제',
      destructive: true,
      onConfirm: () => {
        setAppState((prev) => ({
          ...prev,
          items: [],
        }));
        setSelectedItemId(null);
        setSettingsModalOpen(false);
        closeConfirm();
        setToastMsg('모든 점검 데이터가 초기화되었습니다.');
      },
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F7EFE4] text-[#2E231C]">
      {/* Subtle Blurred Facility Photo Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[520px] overflow-hidden select-none no-print"
      >
        <img
          src="/assets/aistudio/_____2026-11-26_140803_bd0ec314.png"
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          className="h-full w-full scale-[1.03] object-cover object-[center_40%] opacity-[0.26] blur-[2.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7EFE4]/30 via-[#F7EFE4]/65 to-[#F7EFE4]" />
      </div>

      {/* Top Navigation Bar (3-zone contract) */}
      <header className="relative z-10 border-b border-[#E5D7C4] bg-[#FFFCF7]/95 backdrop-blur-xs no-print">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setViewMode('list');
            }}
            className="text-lg font-bold tracking-tight text-[#8B4229] whitespace-nowrap shrink-0 sm:text-xl"
          >
            청사 시설 점검 일정 관리표
          </a>

          {/* Zone 2: Navigation Links */}
          <nav
            aria-label="주요 메뉴"
            className="hidden md:flex items-center gap-7 text-[15.5px] font-medium text-[#6C5B4F]"
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'list'
                  ? 'border-b-2 border-[#8B4229] font-semibold text-[#8B4229]'
                  : 'hover:text-[#2E231C]'
              }`}
            >
              점검 목록
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'calendar'
                  ? 'border-b-2 border-[#8B4229] font-semibold text-[#8B4229]'
                  : 'hover:text-[#2E231C]'
              }`}
            >
              월별 달력
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="py-1 transition-colors hover:text-[#2E231C] whitespace-nowrap shrink-0"
            >
              인쇄
            </button>
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="py-1 transition-colors hover:text-[#2E231C] whitespace-nowrap shrink-0"
            >
              설정·백업
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#8B4229] px-4 py-2 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#72341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>항목 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="relative z-10 mx-auto max-w-[1280px] space-y-6 px-4 py-7 sm:px-6 lg:px-8 no-print">
        {/* Context Info & Legal Notice Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[14.5px] font-semibold text-[#8B4229]">
              {appState.settings.facilityName}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2E231C] sm:text-[28px]">
              시설 점검 일정 및 이력 관리
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14.5px] text-[#5E4D40] tabular-nums">
            <span>
              오늘 날짜: <strong className="font-semibold text-[#2E231C]">{todayStr} ({getWeekdayName(todayStr)})</strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-[#D8C7B2]">|</span>
            <span>임박 기준: 예정일 {appState.settings.warningDays}일 이내</span>
          </div>
        </div>

        {/* Sample Data Notice Banner */}
        {sampleCount > 0 ? (
          <div
            role="region"
            aria-label="가상 샘플 데이터 안내"
            className="flex flex-col gap-3 rounded-xl border border-[#EAC68C] bg-[#FEF4E2]/95 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#A3580D]" aria-hidden="true" />
              <div className="text-[14.5px] leading-relaxed text-[#5C360B]">
                <p className="font-bold">
                  안내용 가상 샘플 데이터 {sampleCount}건이 포함되어 있습니다.
                </p>
                <p className="mt-0.5 text-[#704413]">
                  샘플의 점검 주기는 화면 확인용 임의 예시값이며 법정 주기가 아닙니다.{' '}
                  <strong className="underline decoration-[#C78538] underline-offset-2">
                    주기는 반드시 관계 법령으로 확인 필요
                  </strong>
                  하며, 실무 적용 전 샘플을 삭제하거나 실제 청사 기준으로 수정해 주세요.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDeleteAllSamples}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#D9B173] bg-[#FFFCF7] px-4 py-2 text-[14px] font-semibold text-[#85490B] hover:bg-[#FCECD2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A3580D] whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span>샘플 데이터 전체 삭제</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5D7C4] bg-[#FFFCF7]/95 px-4 py-3 text-[14px] text-[#66584B]">
            <span>
              안내: 각 시설의 점검 주기는 반드시 관계 법령으로 확인 필요하며, 모든 데이터는 현재 브라우저에만 안전하게 저장됩니다.
            </span>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMsg && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-lg border border-[#B8D9B5] bg-[#EFF7EE] px-4 py-3 text-[14.5px] font-medium text-[#236B3D]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#236B3D]" aria-hidden="true" />
              <span>{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-[#236B3D] hover:text-[#154527]"
              aria-label="알림 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Top 4 Summary Cards */}
        <SummaryCards
          totalCount={counts.total}
          overdueCount={counts.overdue}
          dueSoonCount={counts.dueSoon}
          normalCount={counts.normal}
          unenteredCount={counts.unentered}
          warningDays={appState.settings.warningDays}
          activeStatusFilter={statusFilter}
          onSelectStatusFilter={(nextStatus) => {
            setStatusFilter(nextStatus);
            if (viewMode !== 'list') setViewMode('list');
          }}
        />

        {/* Workspace Toolbar: View Toggle, Filter, Search, Quick Actions */}
        <section
          aria-label="필터 및 검색 도구"
          className="rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] p-4 space-y-3"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search & Filters */}
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#948374]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="점검 명칭, 분야, 업체·담당자, 법령, 비고 검색"
                  aria-label="점검 항목 검색"
                  className="min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white pl-9 pr-3 text-[15.5px] text-[#2E231C] placeholder:text-[#A59485] focus:border-[#8B4229] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <select
                  aria-label="점검 분야 필터"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="min-h-[46px] rounded-lg border border-[#D8C7B2] bg-white px-3 text-[14.5px] font-medium text-[#4E3D31] focus:border-[#8B4229] focus:outline-none"
                >
                  <option value="all">전체 분야</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="점검 상태 필터"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | InspectionStatus)
                  }
                  className="min-h-[46px] rounded-lg border border-[#D8C7B2] bg-white px-3 text-[14.5px] font-medium text-[#4E3D31] focus:border-[#8B4229] focus:outline-none"
                >
                  <option value="all">전체 상태</option>
                  <option value="overdue">지연 ({counts.overdue})</option>
                  <option value="dueSoon">임박 ({counts.dueSoon})</option>
                  <option value="normal">정상 ({counts.normal})</option>
                  <option value="unentered">미입력 ({counts.unentered})</option>
                </select>
              </div>
            </div>

            {/* Right Controls: View Switcher & Quick Utility Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
              <div
                className="inline-flex rounded-lg border border-[#D8C7B2] bg-[#F3ECE2] p-0.5"
                role="tablist"
                aria-label="화면 보기 전환"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-3.5 text-[14.5px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    viewMode === 'list'
                      ? 'bg-[#FFFCF7] text-[#8B4229] shadow-xs'
                      : 'text-[#6C5B4F] hover:text-[#2E231C]'
                  }`}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                  <span>목록 표</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'calendar'}
                  onClick={() => setViewMode('calendar')}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-3.5 text-[14.5px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    viewMode === 'calendar'
                      ? 'bg-[#FFFCF7] text-[#8B4229] shadow-xs'
                      : 'text-[#6C5B4F] hover:text-[#2E231C]'
                  }`}
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>월별 달력</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadItemsCsv(filteredItems, appState.settings.facilityName)
                  }
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3.5 text-[14.5px] font-medium text-[#4E3D31] hover:bg-[#FAF3EA] whitespace-nowrap shrink-0"
                >
                  CSV 저장
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3.5 text-[14.5px] font-medium text-[#4E3D31] hover:bg-[#FAF3EA] whitespace-nowrap shrink-0 md:hidden"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>인쇄</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3.5 text-[14.5px] font-medium text-[#4E3D31] hover:bg-[#FAF3EA] whitespace-nowrap shrink-0"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  <span>설정·내보내기</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active filter summary line */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F3ECE2] pt-2.5 text-[13.5px] text-[#7D6B5D]">
            <span className="tabular-nums">
              {viewMode === 'list'
                ? `표시 중 ${filteredItems.length}건 / 전체 ${counts.total}건 · 다음 점검 예정일 빠른 순`
                : `전체 ${counts.total}건 중 조건 일치 ${filteredItems.length}건 달력 표시`}
            </span>
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-semibold text-[#8B4229] hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        </section>

        {/* Main View: List Table or Monthly Calendar */}
        {viewMode === 'list' ? (
          <InspectionTable
            items={filteredItems}
            totalItemCount={counts.total}
            onSelectItem={(item, openHistoryForm = false) => {
              setDrawerOpenAddForm(openHistoryForm);
              setSelectedItemId(item.id);
            }}
            onEditItem={handleOpenEditModal}
            onAddNew={handleOpenAddModal}
            onResetFilters={handleResetFilters}
          />
        ) : (
          <CalendarView
            items={filteredItems}
            todayStr={todayStr}
            onSelectItem={(item) => {
              setDrawerOpenAddForm(false);
              setSelectedItemId(item.id);
            }}
          />
        )}

        {/* Quiet Footer */}
        <footer className="border-t border-[#E5D7C4] pt-4 pb-8 text-[13.5px] text-[#7D6B5D] flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p>
            청사 시설 점검 일정 관리표 · 데이터는 현재 브라우저(localStorage)에만 저장됩니다.
          </p>
          <p>항목을 클릭하면 상세 정보 확인 및 점검 이력을 누적 기록할 수 있습니다.</p>
        </footer>
      </main>

      {/* Print-Only Official Ledger */}
      <PrintSheet
        facilityName={appState.settings.facilityName}
        todayStr={todayStr}
        warningDays={appState.settings.warningDays}
        items={filteredItems}
      />

      {/* Detail Slide-over Drawer */}
      <DetailDrawer
        item={selectedItem}
        initialOpenAddForm={drawerOpenAddForm}
        onClose={() => setSelectedItemId(null)}
        onEditItem={(item) => handleOpenEditModal(item)}
        onDeleteItem={handleDeleteItem}
        onAddRecord={handleAddRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Add / Edit Item Modal */}
      <ItemFormModal
        open={formModalOpen}
        editingItem={editingItem}
        categories={availableCategories}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Settings & Backup Modal */}
      <SettingsModal
        open={settingsModalOpen}
        settings={appState.settings}
        items={appState.items}
        computedItems={sortedItems}
        onClose={() => setSettingsModalOpen(false)}
        onSaveSettings={handleSaveSettings}
        onRequestRestoreJson={handleRequestRestoreJson}
        onRequestRestoreSample={handleRequestRestoreSample}
        onRequestClearAll={handleRequestClearAll}
      />

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}

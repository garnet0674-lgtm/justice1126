import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import { AppSettings, AppState, ComputedInspectionItem, InspectionItem } from '../types/inspection';
import {
  DEFAULT_CATEGORIES,
  downloadHistoryCsv,
  downloadItemsCsv,
  downloadJsonBackup,
  parseImportedJson,
} from '../utils/storage';

interface SettingsModalProps {
  open: boolean;
  settings: AppSettings;
  items: InspectionItem[];
  computedItems: ComputedInspectionItem[];
  onClose: () => void;
  onSaveSettings: (newSettings: AppSettings) => void;
  onRequestRestoreJson: (importedState: AppState) => void;
  onRequestRestoreSample: () => void;
  onRequestClearAll: () => void;
}

export function SettingsModal({
  open,
  settings,
  items,
  computedItems,
  onClose,
  onSaveSettings,
  onRequestRestoreJson,
  onRequestRestoreSample,
  onRequestClearAll,
}: SettingsModalProps) {
  const [facilityName, setFacilityName] = useState(settings.facilityName);
  const [warningDays, setWarningDays] = useState(String(settings.warningDays));
  const [categories, setCategories] = useState<string[]>(settings.categories);
  const [newCategory, setNewCategory] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFacilityName(settings.facilityName);
    setWarningDays(String(settings.warningDays));
    setCategories(settings.categories);
    setNewCategory('');
    setFeedbackMsg(null);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setFeedbackMsg({ type: 'error', text: `'${trimmed}' 분야는 이미 등록되어 있습니다.` });
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory('');
    setFeedbackMsg(null);
  };

  const handleRemoveCategory = (cat: string) => {
    const inUse = items.some((item) => item.category === cat);
    if (inUse) {
      setFeedbackMsg({
        type: 'error',
        text: `'${cat}' 분야에 등록된 점검 항목이 있어 삭제할 수 없습니다.`,
      });
      return;
    }
    if (categories.length <= 1) {
      setFeedbackMsg({ type: 'error', text: '최소 1개 이상의 점검 분야가 필요합니다.' });
      return;
    }
    setCategories((prev) => prev.filter((c) => c !== cat));
    setFeedbackMsg(null);
  };

  const handleSubmitSettings = (e: FormEvent) => {
    e.preventDefault();
    const parsedWarning = Number(warningDays);
    if (!Number.isFinite(parsedWarning) || parsedWarning < 0 || parsedWarning > 365) {
      setFeedbackMsg({
        type: 'error',
        text: '임박 기준일은 0일 이상 365일 이하의 숫자로 입력해 주세요.',
      });
      return;
    }
    onSaveSettings({
      facilityName: facilityName.trim() || '청사(복지관) 시설 관리',
      warningDays: Math.round(parsedWarning),
      categories,
    });
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const imported = parseImportedJson(text);
        onRequestRestoreJson(imported);
      } catch (err) {
        setFeedbackMsg({
          type: 'error',
          text:
            err instanceof Error
              ? err.message
              : 'JSON 파일을 읽는 중 오류가 발생했습니다.',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E231C]/45 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#EDE2D4] px-6 py-4">
          <h2 id="settings-modal-title" className="text-xl font-bold text-[#2E231C]">
            환경 설정 및 데이터 백업·내보내기
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#877568] hover:bg-[#F3ECE2] hover:text-[#2E231C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-7">
          {feedbackMsg && (
            <div
              className={`rounded-lg border px-4 py-3 text-[14.5px] font-medium ${
                feedbackMsg.type === 'error'
                  ? 'border-[#EBB8B4] bg-[#FCECEB] text-[#B32D22]'
                  : 'border-[#B8D9B5] bg-[#EFF7EE] text-[#236B3D]'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* Section 1: Basic Settings */}
          <form id="settings-form" onSubmit={handleSubmitSettings} className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#2E231C]">기본 설정</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="setting-facility-name"
                    className="block text-[14.5px] font-semibold text-[#4E3D31]"
                  >
                    청사·기관명
                  </label>
                  <input
                    id="setting-facility-name"
                    type="text"
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="예: ○○구 종합사회복지관"
                    className="mt-1.5 min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="setting-warning-days"
                    className="block text-[14.5px] font-semibold text-[#4E3D31]"
                  >
                    임박 상태 기준일 (기본 30일)
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="setting-warning-days"
                      type="number"
                      min={0}
                      max={365}
                      step={1}
                      value={warningDays}
                      onChange={(e) => setWarningDays(e.target.value)}
                      className="min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] tabular-nums focus:border-[#8B4229] focus:outline-none"
                    />
                    <span className="shrink-0 text-[15.5px] text-[#4E3D31]">일 이내</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Category Management */}
            <div className="border-t border-[#EDE2D4] pt-5">
              <h3 className="text-base font-bold text-[#2E231C]">점검 분야 관리</h3>
              <p className="mt-1 text-[13.5px] text-[#7D6B5D]">
                청사 특성에 맞게 점검 분야를 추가하거나 미사용 분야를 정리할 수 있습니다.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder="새 분야명 입력 (예: 냉난방, 기계설비, 방송)"
                  className="min-h-[44px] flex-1 rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#D8C7B2] bg-[#FAF3EA] px-4 text-[14.5px] font-semibold text-[#4E3D31] hover:bg-[#F1E6D7]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>분야 추가</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isDefault = DEFAULT_CATEGORIES.includes(cat);
                  return (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5D7C4] bg-[#FAF3EA] px-3 py-1.5 text-[14px] font-medium text-[#4E3D31]"
                    >
                      <span>{cat}</span>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="ml-0.5 text-[#877568] hover:text-[#B32D22]"
                          aria-label={`${cat} 분야 삭제`}
                          title="분야 삭제"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Section 3: Data Export & Import */}
          <div className="border-t border-[#EDE2D4] pt-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#2E231C]">데이터 백업 및 내보내기</h3>
              <p className="mt-1 text-[13.5px] text-[#6C5B4F]">
                모든 데이터는 현재 브라우저(localStorage)에만 저장되며 외부 서버로 전송되지 않습니다. PC 교체나 브라우저 초기화에 대비해 주기적으로 백업하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => downloadItemsCsv(computedItems, facilityName || settings.facilityName)}
                className="flex min-h-[52px] items-center gap-3 rounded-lg border border-[#D8C7B2] bg-white px-4 py-3 text-left hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              >
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#236B3D]" aria-hidden="true" />
                <div>
                  <span className="block text-[14.5px] font-semibold text-[#2E231C]">
                    점검 일정표 CSV 내보내기
                  </span>
                  <span className="block text-[12.5px] text-[#7D6B5D]">
                    엑셀 호환 (UTF-8 BOM 포함)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => downloadHistoryCsv(computedItems, facilityName || settings.facilityName)}
                className="flex min-h-[52px] items-center gap-3 rounded-lg border border-[#D8C7B2] bg-white px-4 py-3 text-left hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              >
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#236B3D]" aria-hidden="true" />
                <div>
                  <span className="block text-[14.5px] font-semibold text-[#2E231C]">
                    점검 이력 대장 CSV 내보내기
                  </span>
                  <span className="block text-[12.5px] text-[#7D6B5D]">
                    감사 대비 전체 이력 (UTF-8 BOM 포함)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => downloadJsonBackup({ items, settings })}
                className="flex min-h-[52px] items-center gap-3 rounded-lg border border-[#D8C7B2] bg-white px-4 py-3 text-left hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              >
                <Download className="h-5 w-5 shrink-0 text-[#8B4229]" aria-hidden="true" />
                <div>
                  <span className="block text-[14.5px] font-semibold text-[#2E231C]">
                    전체 백업 JSON 저장
                  </span>
                  <span className="block text-[12.5px] text-[#7D6B5D]">
                    항목·이력·설정 전체 백업 파일
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[52px] items-center gap-3 rounded-lg border border-[#D8C7B2] bg-white px-4 py-3 text-left hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              >
                <Upload className="h-5 w-5 shrink-0 text-[#8B4229]" aria-hidden="true" />
                <div>
                  <span className="block text-[14.5px] font-semibold text-[#2E231C]">
                    JSON 백업 불러오기
                  </span>
                  <span className="block text-[12.5px] text-[#7D6B5D]">
                    저장해 둔 JSON 파일로 복원
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F3ECE2] pt-3">
              <button
                type="button"
                onClick={onRequestRestoreSample}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#D8C7B2] bg-white px-3.5 py-2 text-[13.5px] font-medium text-[#4E3D31] hover:bg-[#FAF3EA]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>예시 샘플 데이터 5건 불러오기</span>
              </button>

              <button
                type="button"
                onClick={onRequestClearAll}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#EBB8B4] bg-white px-3.5 py-2 text-[13.5px] font-medium text-[#B32D22] hover:bg-[#FCECEB]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>전체 항목 초기화</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#EDE2D4] bg-[#F7EFE4]/60 px-6 py-4 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-5 py-2 text-[15px] font-medium text-[#4E3D31] hover:bg-[#F3ECE2]"
          >
            닫기
          </button>
          <button
            type="submit"
            form="settings-form"
            className="min-h-[44px] rounded-lg bg-[#8B4229] px-6 py-2 text-[15px] font-semibold text-white hover:bg-[#72341F]"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
}

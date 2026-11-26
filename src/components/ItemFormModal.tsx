import { FormEvent, useEffect, useState } from 'react';
import { Info, Plus, X } from 'lucide-react';
import { InspectionItem } from '../types/inspection';
import { addMonths, parseLocalDate } from '../utils/date';

interface ItemFormModalProps {
  open: boolean;
  editingItem: InspectionItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (
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
  ) => void;
}

export function ItemFormModal({
  open,
  editingItem,
  categories,
  onClose,
  onSave,
}: ItemFormModalProps) {
  const [category, setCategory] = useState(categories[0] || '소방');
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [name, setName] = useState('');
  const [cycleMonths, setCycleMonths] = useState('6');
  const [lastInspectedDate, setLastInspectedDate] = useState('');
  const [vendorOrManager, setVendorOrManager] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setCategory(editingItem.category);
      setCustomCategoryMode(false);
      setCustomCategoryName('');
      setName(editingItem.name);
      setCycleMonths(String(editingItem.cycleMonths));
      setLastInspectedDate(editingItem.lastInspectedDate);
      setVendorOrManager(editingItem.vendorOrManager);
      setLegalBasis(editingItem.legalBasis);
      setNote(editingItem.note);
    } else {
      setCategory(categories[0] || '소방');
      setCustomCategoryMode(false);
      setCustomCategoryName('');
      setName('');
      setCycleMonths('6');
      setLastInspectedDate('');
      setVendorOrManager('');
      setLegalBasis('');
      setNote('');
    }
    setErrorMsg('');
  }, [open, editingItem, categories]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const parsedCycle = Number(cycleMonths);
  const previewNextDue =
    parseLocalDate(lastInspectedDate) && Number.isFinite(parsedCycle) && parsedCycle >= 1
      ? addMonths(lastInspectedDate, Math.round(parsedCycle))
      : '';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalCategory = customCategoryMode
      ? customCategoryName.trim()
      : category.trim();

    if (!finalCategory) {
      setErrorMsg('점검 분야를 선택하거나 새 분야명을 입력해 주세요.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('점검 명칭을 입력해 주세요.');
      return;
    }
    if (!Number.isFinite(parsedCycle) || parsedCycle < 1 || parsedCycle > 240) {
      setErrorMsg('점검 주기는 1개월 이상 240개월 이하의 숫자로 입력해 주세요.');
      return;
    }
    if (lastInspectedDate && !parseLocalDate(lastInspectedDate)) {
      setErrorMsg('최근 점검일은 YYYY-MM-DD 형식의 올바른 날짜로 입력해 주세요.');
      return;
    }

    onSave(
      {
        category: finalCategory,
        name: name.trim(),
        cycleMonths: Math.round(parsedCycle),
        lastInspectedDate: lastInspectedDate.trim(),
        vendorOrManager: vendorOrManager.trim(),
        legalBasis: legalBasis.trim(),
        note: note.trim(),
      },
      customCategoryMode ? finalCategory : undefined
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E231C]/45 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-form-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#EDE2D4] px-6 py-4">
          <h2 id="item-form-title" className="text-xl font-bold text-[#2E231C]">
            {editingItem ? '점검 항목 수정' : '새 점검 항목 등록'}
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

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-[#EBB8B4] bg-[#FCECEB] px-4 py-3 text-[14.5px] font-medium text-[#B32D22]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-category" className="block text-[14.5px] font-semibold text-[#4E3D31]">
                점검 분야 <span className="text-[#B32D22]">*</span>
              </label>
              {!customCategoryMode ? (
                <div className="mt-1.5 flex gap-2">
                  <select
                    id="item-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCustomCategoryMode(true)}
                    className="inline-flex min-h-[46px] shrink-0 items-center gap-1 rounded-lg border border-[#D8C7B2] bg-[#FAF3EA] px-3 text-[13.5px] font-medium text-[#4E3D31] hover:bg-[#F1E6D7]"
                    title="새 점검 분야 직접 추가"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>직접추가</span>
                  </button>
                </div>
              ) : (
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="item-category"
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="예: 냉난방기, 저수조, 방송설비"
                    className="min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCategoryMode(false);
                      setCustomCategoryName('');
                    }}
                    className="min-h-[46px] shrink-0 rounded-lg border border-[#D8C7B2] bg-white px-3 text-[13.5px] font-medium text-[#66584B] hover:bg-[#FAF3EA]"
                  >
                    목록선택
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="item-cycle" className="block text-[14.5px] font-semibold text-[#4E3D31]">
                점검 주기 (개월) <span className="text-[#B32D22]">*</span>
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="item-cycle"
                  type="number"
                  min={1}
                  max={240}
                  step={1}
                  value={cycleMonths}
                  onChange={(e) => setCycleMonths(e.target.value)}
                  className="min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] tabular-nums focus:border-[#8B4229] focus:outline-none"
                  required
                />
                <span className="shrink-0 text-[15.5px] font-medium text-[#4E3D31]">개월마다</span>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[12.5px] text-[#7D6B5D]">
                <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>주기는 반드시 관계 법령으로 확인 후 입력해 주세요.</span>
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="item-name" className="block text-[14.5px] font-semibold text-[#4E3D31]">
              점검 명칭 <span className="text-[#B32D22]">*</span>
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 소방시설 작동점검, 승강기 정기안전검사"
              className="mt-1.5 min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item-last-date" className="block text-[14.5px] font-semibold text-[#4E3D31]">
                최근 점검일 (YYYY-MM-DD)
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="item-last-date"
                  type="date"
                  value={lastInspectedDate}
                  onChange={(e) => setLastInspectedDate(e.target.value)}
                  className="min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] tabular-nums focus:border-[#8B4229] focus:outline-none"
                />
                {lastInspectedDate && (
                  <button
                    type="button"
                    onClick={() => setLastInspectedDate('')}
                    className="min-h-[46px] shrink-0 rounded-lg border border-[#D8C7B2] bg-white px-3 text-[13.5px] font-medium text-[#66584B] hover:bg-[#FAF3EA]"
                  >
                    비우기
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[12.5px] text-[#7D6B5D]">
                비워 두면 &lsquo;미입력&rsquo; 상태로 표시됩니다.
              </p>
            </div>

            <div>
              <span className="block text-[14.5px] font-semibold text-[#4E3D31]">
                다음 점검 예정일 (자동 계산)
              </span>
              <div className="mt-1.5 flex min-h-[46px] items-center rounded-lg border border-[#E5D7C4] bg-[#FAF3EA] px-3 text-[15.5px] font-semibold text-[#2E231C] tabular-nums">
                {previewNextDue || (
                  <span className="font-normal text-[#A59485]">
                    최근 점검일 입력 시 자동 계산
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="item-vendor" className="block text-[14.5px] font-semibold text-[#4E3D31]">
              점검 업체 또는 담당자 (선택)
            </label>
            <input
              id="item-vendor"
              type="text"
              value={vendorOrManager}
              onChange={(e) => setVendorOrManager(e.target.value)}
              placeholder="예: 한국전기안전공사 / 시설팀 홍길동 주무관"
              className="mt-1.5 min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="item-legal" className="block text-[14.5px] font-semibold text-[#4E3D31]">
              근거 법령 (사용자 메모란 · 기본값 비움)
            </label>
            <input
              id="item-legal"
              type="text"
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value)}
              placeholder="확인한 관계 법령 및 조문을 직접 메모하세요"
              className="mt-1.5 min-h-[46px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="item-note" className="block text-[14.5px] font-semibold text-[#4E3D31]">
              비고
            </label>
            <textarea
              id="item-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="점검 시 유의사항, 계약 만료일, 담당 연락처 등 메모"
              className="mt-1.5 w-full rounded-lg border border-[#D8C7B2] bg-white px-3 py-2.5 text-[15.5px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#EDE2D4] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-5 py-2 text-[15px] font-medium text-[#4E3D31] hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            >
              취소
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-[#8B4229] px-6 py-2 text-[15px] font-semibold text-white hover:bg-[#72341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            >
              {editingItem ? '수정 저장' : '항목 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

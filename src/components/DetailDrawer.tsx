import { FormEvent, useEffect, useState } from 'react';
import { CalendarPlus, Pencil, Trash2, X } from 'lucide-react';
import { ComputedInspectionItem, InspectionResult } from '../types/inspection';
import { formatDaysRemaining, getTodayString, parseLocalDate } from '../utils/date';
import { StatusLabel } from './StatusLabel';

interface DetailDrawerProps {
  item: ComputedInspectionItem | null;
  initialOpenAddForm?: boolean;
  onClose: () => void;
  onEditItem: (item: ComputedInspectionItem) => void;
  onDeleteItem: (item: ComputedInspectionItem) => void;
  onAddRecord: (
    itemId: string,
    record: {
      date: string;
      result: InspectionResult;
      actionTaken: string;
      note: string;
    }
  ) => void;
  onDeleteRecord: (itemId: string, recordId: string) => void;
}

const RESULT_OPTIONS: InspectionResult[] = ['적합', '부적합', '조치필요'];

export function DetailDrawer({
  item,
  initialOpenAddForm = false,
  onClose,
  onEditItem,
  onDeleteItem,
  onAddRecord,
  onDeleteRecord,
}: DetailDrawerProps) {
  const [showAddForm, setShowAddForm] = useState(initialOpenAddForm);
  const [recDate, setRecDate] = useState(getTodayString());
  const [recResult, setRecResult] = useState<InspectionResult>('적합');
  const [recAction, setRecAction] = useState('');
  const [recNote, setRecNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setShowAddForm(initialOpenAddForm);
    setRecDate(getTodayString());
    setRecResult('적합');
    setRecAction('');
    setRecNote('');
    setFormError('');
  }, [item?.id, initialOpenAddForm]);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const handleRecordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!parseLocalDate(recDate)) {
      setFormError('점검일은 YYYY-MM-DD 형식의 올바른 날짜로 입력해 주세요.');
      return;
    }
    onAddRecord(item.id, {
      date: recDate,
      result: recResult,
      actionTaken: recAction.trim(),
      note: recNote.trim(),
    });
    setRecDate(getTodayString());
    setRecResult('적합');
    setRecAction('');
    setRecNote('');
    setFormError('');
    setShowAddForm(false);
  };

  const getResultStyle = (result: InspectionResult) => {
    switch (result) {
      case '적합':
        return 'border-[#B8D9B5] bg-[#EFF7EE] text-[#236B3D]';
      case '부적합':
        return 'border-[#EBB8B4] bg-[#FCECEB] text-[#B32D22]';
      case '조치필요':
        return 'border-[#EAC68C] bg-[#FEF4E2] text-[#A3580D]';
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-[#2E231C]/40 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-drawer-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col border-l border-[#E5D7C4] bg-[#FFFCF7] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#EDE2D4] bg-[#F7EFE4]/75 px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-[#7D6B5D]">
              <span className="font-semibold text-[#8B4229]">{item.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">주기 {item.cycleMonths}개월</span>
              {item.isSample && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>예시 샘플 데이터</span>
                </>
              )}
            </div>
            <h2 id="detail-drawer-title" className="mt-1 text-xl font-bold text-[#2E231C] break-words">
              {item.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#877568] hover:bg-[#EDE2D4] hover:text-[#2E231C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            aria-label="상세 패널 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status & Schedule Summary */}
          <div className="grid grid-cols-1 gap-4 border-b border-[#EDE2D4] pb-5 sm:grid-cols-3">
            <div>
              <span className="block text-[12.5px] font-medium text-[#7D6B5D]">현재 상태</span>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusLabel status={item.status} />
              </div>
              <p className="mt-1.5 text-[13.5px] text-[#66584B] tabular-nums">
                {formatDaysRemaining(item.daysRemaining)}
              </p>
            </div>
            <div>
              <span className="block text-[12.5px] font-medium text-[#7D6B5D]">최근 점검일</span>
              <p className="mt-1.5 text-base font-semibold text-[#2E231C] tabular-nums">
                {item.lastInspectedDate || <span className="text-[#A59485]">미입력</span>}
              </p>
            </div>
            <div>
              <span className="block text-[12.5px] font-medium text-[#7D6B5D]">다음 점검 예정일</span>
              <p
                className={`mt-1.5 text-base font-bold tabular-nums ${
                  item.status === 'overdue'
                    ? 'text-[#B32D22]'
                    : item.status === 'dueSoon'
                      ? 'text-[#A3580D]'
                      : 'text-[#2E231C]'
                }`}
              >
                {item.nextDueDate || '-'}
              </p>
            </div>
          </div>

          {/* Item Metadata Details */}
          <dl className="space-y-3 border-b border-[#EDE2D4] pb-5 text-[15.5px]">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              <dt className="font-semibold text-[#66584B]">점검 업체/담당자</dt>
              <dd className="sm:col-span-2 text-[#2E231C]">
                {item.vendorOrManager || <span className="text-[#A59485]">미지정</span>}
              </dd>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              <dt className="font-semibold text-[#66584B]">근거 법령 (메모)</dt>
              <dd className="sm:col-span-2 text-[#2E231C]">
                {item.legalBasis || <span className="text-[#A59485]">미입력 (직접 확인 후 메모)</span>}
              </dd>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
              <dt className="font-semibold text-[#66584B]">비고</dt>
              <dd className="sm:col-span-2 whitespace-pre-line text-[#4E3D31]">
                {item.note || <span className="text-[#A59485]">없음</span>}
              </dd>
            </div>
          </dl>

          {/* Item Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE2D4] pb-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditItem(item)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-4 py-2 text-[14.5px] font-medium text-[#4E3D31] hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span>항목 정보 수정</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteItem(item)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#EBB8B4] bg-[#FFFCF7] px-4 py-2 text-[14.5px] font-medium text-[#B32D22] hover:bg-[#FCECEB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B32D22]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>항목 삭제</span>
              </button>
            </div>
          </div>

          {/* Inspection History Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-[#2E231C]">
                  점검 이력 대장 ({item.records.length}건)
                </h3>
                <p className="mt-0.5 text-[13.5px] text-[#7D6B5D]">
                  새 이력 등록 시 최근 점검일과 다음 예정일이 자동 갱신됩니다.
                </p>
              </div>
              {!showAddForm && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#8B4229] px-4 py-2 text-[14.5px] font-semibold text-white hover:bg-[#72341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  <span>점검 이력 추가</span>
                </button>
              )}
            </div>

            {showAddForm && (
              <form
                onSubmit={handleRecordSubmit}
                className="mt-4 space-y-4 rounded-xl border border-[#DFCBB3] bg-[#FAF3EA] p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[15.5px] font-bold text-[#2E231C]">새 점검 이력 기록</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-[13.5px] font-medium text-[#66584B] hover:text-[#2E231C]"
                  >
                    접기
                  </button>
                </div>

                {formError && (
                  <p className="rounded-lg border border-[#EBB8B4] bg-[#FCECEB] px-3 py-2 text-[13.5px] font-medium text-[#B32D22]">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="rec-date"
                      className="block text-[13.5px] font-semibold text-[#4E3D31]"
                    >
                      점검일 (YYYY-MM-DD) <span className="text-[#B32D22]">*</span>
                    </label>
                    <input
                      id="rec-date"
                      type="date"
                      value={recDate}
                      onChange={(e) => setRecDate(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15px] text-[#2E231C] tabular-nums focus:border-[#8B4229] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-[13.5px] font-semibold text-[#4E3D31]">
                      점검 결과 <span className="text-[#B32D22]">*</span>
                    </span>
                    <div className="mt-1 grid grid-cols-3 gap-1.5">
                      {RESULT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRecResult(opt)}
                          className={`min-h-[44px] rounded-lg border text-[14px] font-semibold transition-colors ${
                            recResult === opt
                              ? 'border-[#8B4229] bg-[#8B4229] text-white'
                              : 'border-[#D8C7B2] bg-white text-[#4E3D31] hover:bg-[#F3ECE2]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rec-action"
                    className="block text-[13.5px] font-semibold text-[#4E3D31]"
                  >
                    조치 내용
                  </label>
                  <input
                    id="rec-action"
                    type="text"
                    value={recAction}
                    onChange={(e) => setRecAction(e.target.value)}
                    placeholder="예: 감지기 1개 교체 완료, 누전차단기 정상 동작 확인"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rec-note"
                    className="block text-[13.5px] font-semibold text-[#4E3D31]"
                  >
                    비고
                  </label>
                  <input
                    id="rec-note"
                    type="text"
                    value={recNote}
                    onChange={(e) => setRecNote(e.target.value)}
                    placeholder="지출 결의 번호, 보고서 보관 위치 등"
                    className="mt-1 min-h-[44px] w-full rounded-lg border border-[#D8C7B2] bg-white px-3 text-[15px] text-[#2E231C] focus:border-[#8B4229] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="min-h-[42px] rounded-lg border border-[#D8C7B2] bg-white px-4 text-[14.5px] font-medium text-[#4E3D31] hover:bg-[#F3ECE2]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] rounded-lg bg-[#8B4229] px-5 text-[14.5px] font-semibold text-white hover:bg-[#72341F]"
                  >
                    이력 저장 및 예정일 갱신
                  </button>
                </div>
              </form>
            )}

            {/* History List */}
            <div className="mt-4 divide-y divide-[#EDE2D4] border-t border-b border-[#EDE2D4]">
              {item.records.length === 0 ? (
                <div className="py-8 text-center text-[15.5px] text-[#7D6B5D]">
                  아직 기록된 점검 이력이 없습니다.
                </div>
              ) : (
                item.records.map((rec) => (
                  <div key={rec.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[15.5px] font-bold text-[#2E231C] tabular-nums">
                          {rec.date}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[12.5px] font-semibold ${getResultStyle(
                            rec.result
                          )}`}
                        >
                          {rec.result}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(item.id, rec.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#A59485] hover:bg-[#FCECEB] hover:text-[#B32D22]"
                        aria-label={`${rec.date} 점검 이력 삭제`}
                        title="이력 삭제"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    {rec.actionTaken && (
                      <p className="mt-2 text-[14.5px] leading-relaxed text-[#4E3D31]">
                        <span className="font-semibold text-[#66584B]">조치 내용: </span>
                        {rec.actionTaken}
                      </p>
                    )}
                    {rec.note && (
                      <p className="mt-1 text-[13.5px] text-[#7D6B5D]">
                        <span className="font-medium">비고: </span>
                        {rec.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

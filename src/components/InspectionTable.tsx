import { CalendarPlus, ChevronRight, FileText, Pencil, Plus } from 'lucide-react';
import { ComputedInspectionItem } from '../types/inspection';
import { formatDaysRemaining } from '../utils/date';
import { StatusLabel } from './StatusLabel';

interface InspectionTableProps {
  items: ComputedInspectionItem[];
  totalItemCount: number;
  onSelectItem: (item: ComputedInspectionItem, openHistoryForm?: boolean) => void;
  onEditItem: (item: ComputedInspectionItem) => void;
  onAddNew: () => void;
  onResetFilters: () => void;
}

export function InspectionTable({
  items,
  totalItemCount,
  onSelectItem,
  onEditItem,
  onAddNew,
  onResetFilters,
}: InspectionTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] px-6 py-14 text-center">
        <FileText className="mx-auto h-10 w-10 text-[#A59485]" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-[#2E231C]">
          {totalItemCount === 0
            ? '등록된 시설 점검 항목이 없습니다'
            : '조건에 맞는 점검 항목이 없습니다'}
        </h3>
        <p className="mt-1.5 text-[15.5px] text-[#6C5B4F]">
          {totalItemCount === 0
            ? '새 점검 항목을 추가하거나 설정에서 기존 백업(JSON)을 불러올 수 있습니다.'
            : '검색어나 분야·상태 필터를 초기화하면 전체 항목을 다시 확인할 수 있습니다.'}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {totalItemCount === 0 ? (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#8B4229] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[#72341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>첫 점검 항목 등록</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-5 py-2.5 text-[15px] font-medium text-[#4E3D31] hover:bg-[#F3ECE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] overflow-hidden">
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E5D7C4] bg-[#F4EADC] text-[13.5px] font-semibold text-[#5E4D40]">
              <th scope="col" className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                상태
              </th>
              <th scope="col" className="px-3 py-3.5 whitespace-nowrap">
                점검 분야
              </th>
              <th scope="col" className="px-3 py-3.5">
                점검 명칭
              </th>
              <th scope="col" className="px-3 py-3.5 text-right whitespace-nowrap">
                주기
              </th>
              <th scope="col" className="px-3 py-3.5 whitespace-nowrap">
                최근 점검일
              </th>
              <th scope="col" className="px-3 py-3.5 whitespace-nowrap">
                다음 예정일
              </th>
              <th scope="col" className="px-3 py-3.5">
                업체·담당자
              </th>
              <th scope="col" className="px-3 py-3.5 text-right whitespace-nowrap">
                이력
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE2D4] text-[15.5px]">
            {items.map((item) => {
              const dueTextColor =
                item.status === 'overdue'
                  ? 'text-[#B32D22] font-semibold'
                  : item.status === 'dueSoon'
                    ? 'text-[#A3580D] font-semibold'
                    : item.status === 'normal'
                      ? 'text-[#2E231C] font-medium'
                      : 'text-[#A59485]';

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item, false)}
                  className="group cursor-pointer transition-colors hover:bg-[#FAF3EA]"
                >
                  <td className="py-4 pl-5 pr-3 align-middle whitespace-nowrap">
                    <StatusLabel status={item.status} />
                  </td>
                  <td className="px-3 py-4 align-middle font-medium text-[#4E3D31] whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="px-3 py-4 align-middle">
                    <div className="font-semibold text-[#2E231C] group-hover:text-[#8B4229]">
                      {item.name}
                    </div>
                    {(item.legalBasis || item.note) && (
                      <div className="mt-0.5 line-clamp-1 text-[13.5px] text-[#7D6B5D]">
                        {[item.legalBasis, item.note].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 align-middle text-right font-medium text-[#4E3D31] tabular-nums whitespace-nowrap">
                    {item.cycleMonths}개월
                  </td>
                  <td className="px-3 py-4 align-middle text-[#4E3D31] tabular-nums whitespace-nowrap">
                    {item.lastInspectedDate || (
                      <span className="text-[#A59485]">미입력</span>
                    )}
                  </td>
                  <td className="px-3 py-4 align-middle whitespace-nowrap">
                    <div className={`tabular-nums ${dueTextColor}`}>
                      {item.nextDueDate || '-'}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[#7D6B5D] tabular-nums">
                      {formatDaysRemaining(item.daysRemaining)}
                    </div>
                  </td>
                  <td className="px-3 py-4 align-middle text-[#66584B]">
                    <span className="line-clamp-1">
                      {item.vendorOrManager || <span className="text-[#A59485]">-</span>}
                    </span>
                  </td>
                  <td className="px-3 py-4 align-middle text-right text-[#66584B] tabular-nums whitespace-nowrap">
                    {item.records.length}건
                  </td>
                  <td
                    className="py-4 pl-3 pr-5 align-middle text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectItem(item, true)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3 py-1.5 text-[13.5px] font-medium text-[#4E3D31] hover:border-[#8B4229] hover:text-[#8B4229] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
                        title="새 점검 이력 추가"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>이력추가</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#E5D7C4] bg-[#FFFCF7] px-2.5 py-1.5 text-[13.5px] font-medium text-[#6C5B4F] hover:bg-[#F3ECE2] hover:text-[#2E231C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
                        aria-label={`${item.name} 수정`}
                        title="항목 수정"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list view */}
      <div className="divide-y divide-[#EDE2D4] md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item, false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectItem(item, false);
              }
            }}
            className="p-4 active:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8B4229]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13.5px] text-[#7D6B5D]">
                  <span className="font-semibold text-[#4E3D31]">{item.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">주기 {item.cycleMonths}개월</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">이력 {item.records.length}건</span>
                </div>
                <h3 className="mt-1 text-[16.5px] font-bold text-[#2E231C]">{item.name}</h3>
              </div>
              <StatusLabel status={item.status} compact />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#F3ECE2] pt-3 text-[14.5px]">
              <div>
                <span className="block text-[12.5px] text-[#7D6B5D]">최근 점검일</span>
                <span className="font-medium text-[#4E3D31] tabular-nums">
                  {item.lastInspectedDate || '미입력'}
                </span>
              </div>
              <div>
                <span className="block text-[12.5px] text-[#7D6B5D]">다음 점검 예정일</span>
                <span
                  className={`font-semibold tabular-nums ${
                    item.status === 'overdue'
                      ? 'text-[#B32D22]'
                      : item.status === 'dueSoon'
                        ? 'text-[#A3580D]'
                        : 'text-[#2E231C]'
                  }`}
                >
                  {item.nextDueDate || '-'}
                </span>
                <span className="ml-1.5 text-[12.5px] text-[#7D6B5D] tabular-nums">
                  ({formatDaysRemaining(item.daysRemaining)})
                </span>
              </div>
            </div>

            {item.vendorOrManager && (
              <p className="mt-2 text-[13.5px] text-[#66584B]">
                담당: {item.vendorOrManager}
              </p>
            )}

            <div
              className="mt-3 flex items-center justify-between gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectItem(item, true)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3.5 py-1.5 text-[13.5px] font-semibold text-[#8B4229]"
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  <span>이력 추가</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditItem(item)}
                  className="inline-flex min-h-[42px] items-center gap-1 rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3.5 py-1.5 text-[13.5px] font-medium text-[#4E3D31]"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>수정</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSelectItem(item, false)}
                className="inline-flex min-h-[42px] items-center gap-1 text-[13.5px] font-medium text-[#66584B]"
              >
                <span>상세보기</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

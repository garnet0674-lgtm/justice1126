import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ComputedInspectionItem, InspectionStatus } from '../types/inspection';
import { formatDaysRemaining, getMonthCalendarCells, getWeekdayName } from '../utils/date';
import { StatusLabel } from './StatusLabel';

interface CalendarViewProps {
  items: ComputedInspectionItem[];
  todayStr: string;
  onSelectItem: (item: ComputedInspectionItem) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarView({ items, todayStr, onSelectItem }: CalendarViewProps) {
  const initialDate = todayStr.split('-').map(Number);
  const [viewYear, setViewYear] = useState<number>(initialDate[0] || new Date().getFullYear());
  const [viewMonthIndex, setViewMonthIndex] = useState<number>(
    initialDate[1] ? initialDate[1] - 1 : new Date().getMonth()
  );

  const cells = useMemo(
    () => getMonthCalendarCells(viewYear, viewMonthIndex),
    [viewYear, viewMonthIndex]
  );

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ComputedInspectionItem[]>();
    for (const item of items) {
      if (!item.nextDueDate) continue;
      const list = map.get(item.nextDueDate) || [];
      list.push(item);
      map.set(item.nextDueDate, list);
    }
    return map;
  }, [items]);

  const monthPrefix = `${viewYear}-${String(viewMonthIndex + 1).padStart(2, '0')}`;
  const monthScheduledItems = useMemo(() => {
    return items
      .filter((item) => item.nextDueDate && item.nextDueDate.startsWith(monthPrefix))
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [items, monthPrefix]);

  const unenteredCount = useMemo(
    () => items.filter((item) => item.status === 'unentered').length,
    [items]
  );

  const handlePrevMonth = () => {
    if (viewMonthIndex === 0) {
      setViewYear((y) => y - 1);
      setViewMonthIndex(11);
    } else {
      setViewMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonthIndex === 11) {
      setViewYear((y) => y + 1);
      setViewMonthIndex(0);
    } else {
      setViewMonthIndex((m) => m + 1);
    }
  };

  const handleToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setViewYear(y);
    setViewMonthIndex(m - 1);
  };

  const getChipStyle = (status: InspectionStatus) => {
    switch (status) {
      case 'overdue':
        return 'border-[#EBB8B4] bg-[#FCECEB] text-[#B32D22] hover:bg-[#F9DFDD]';
      case 'dueSoon':
        return 'border-[#EAC68C] bg-[#FEF4E2] text-[#A3580D] hover:bg-[#FCEAD0]';
      case 'normal':
        return 'border-[#B8D9B5] bg-[#EFF7EE] text-[#236B3D] hover:bg-[#E2EFE0]';
      default:
        return 'border-[#DCD0C0] bg-[#F3ECE2] text-[#66584B]';
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] overflow-hidden">
        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D7C4] px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#2E231C] tabular-nums">
              {viewYear}년 {viewMonthIndex + 1}월
            </h2>
            <span className="text-[14.5px] text-[#7D6B5D] tabular-nums">
              예정 항목 {monthScheduledItems.length}건
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-2.5 text-[#4E3D31] hover:bg-[#F3ECE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-3.5 text-[14px] font-medium text-[#4E3D31] hover:bg-[#F3ECE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            >
              이번 달
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-2.5 text-[#4E3D31] hover:bg-[#F3ECE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop & Tablet Month Grid */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-7 border-b border-[#E5D7C4] bg-[#F4EADC] text-center text-[13.5px] font-semibold">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-2.5 ${
                  idx === 0
                    ? 'text-[#B32D22]'
                    : idx === 6
                      ? 'text-[#8B4229]'
                      : 'text-[#5E4D40]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-[#EDE2D4] border-b border-[#EDE2D4]">
            {cells.map((cell, idx) => {
              const dayItems = itemsByDate.get(cell.dateStr) || [];
              const isToday = cell.dateStr === todayStr;
              const weekday = idx % 7;

              return (
                <div
                  key={cell.dateStr}
                  className={`min-h-[116px] p-2.5 transition-colors ${
                    cell.isCurrentMonth ? 'bg-[#FFFCF7]' : 'bg-[#F7EFE4]/55'
                  } ${isToday ? 'bg-[#FFF5EC]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-6 min-w-[26px] items-center justify-center rounded-md px-1 text-[13.5px] font-semibold tabular-nums ${
                        isToday
                          ? 'bg-[#8B4229] text-white'
                          : !cell.isCurrentMonth
                            ? 'text-[#B5A596]'
                            : weekday === 0
                              ? 'text-[#B32D22]'
                              : weekday === 6
                                ? 'text-[#8B4229]'
                                : 'text-[#4E3D31]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {isToday && (
                      <span className="text-[11.5px] font-semibold text-[#8B4229]">오늘</span>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectItem(item)}
                        className={`block w-full rounded-md border px-2 py-1 text-left text-[12.5px] leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8B4229] ${getChipStyle(
                          item.status
                        )}`}
                        title={`${item.category} · ${item.name} (${formatDaysRemaining(item.daysRemaining)})`}
                      >
                        <span className="font-semibold">[{item.category}]</span>{' '}
                        <span className="truncate">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly List Summary */}
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#2E231C]">
              {viewYear}년 {viewMonthIndex + 1}월 점검 예정 목록
            </h3>
            {unenteredCount > 0 && (
              <span className="text-[13.5px] text-[#7D6B5D]">
                최근 점검일 미입력 {unenteredCount}건은 달력에 표시되지 않습니다.
              </span>
            )}
          </div>

          {monthScheduledItems.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-[#DCD0C0] bg-[#FAF3EA] px-4 py-6 text-center text-[15.5px] text-[#7D6B5D]">
              {viewYear}년 {viewMonthIndex + 1}월에 예정된 점검 항목이 없습니다.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-[#EDE2D4] rounded-lg border border-[#E5D7C4]">
              {monthScheduledItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#FAF3EA] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#8B4229]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-[#7D6B5D]">
                      <span className="font-semibold text-[#4E3D31] tabular-nums">
                        {item.nextDueDate} ({getWeekdayName(item.nextDueDate)})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#4E3D31]">{item.category}</span>
                      {item.vendorOrManager && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{item.vendorOrManager}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-0.5 text-[15.5px] font-semibold text-[#2E231C]">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13.5px] text-[#66584B] tabular-nums">
                      {formatDaysRemaining(item.daysRemaining)}
                    </span>
                    <StatusLabel status={item.status} compact />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { AlertCircle, CheckCircle2, Clock, ClipboardList } from 'lucide-react';
import { InspectionStatus } from '../types/inspection';

interface SummaryCardsProps {
  totalCount: number;
  overdueCount: number;
  dueSoonCount: number;
  normalCount: number;
  unenteredCount: number;
  warningDays: number;
  activeStatusFilter: 'all' | InspectionStatus;
  onSelectStatusFilter: (filter: 'all' | InspectionStatus) => void;
}

export function SummaryCards({
  totalCount,
  overdueCount,
  dueSoonCount,
  normalCount,
  unenteredCount,
  warningDays,
  activeStatusFilter,
  onSelectStatusFilter,
}: SummaryCardsProps) {
  const cards: Array<{
    key: 'all' | InspectionStatus;
    title: string;
    count: number;
    subtitle: string;
    icon: typeof ClipboardList;
    countClass: string;
    iconBgClass: string;
    iconClass: string;
    activeRing: string;
  }> = [
    {
      key: 'all',
      title: '전체 점검 항목',
      count: totalCount,
      subtitle: unenteredCount > 0 ? `점검일 미입력 ${unenteredCount}건 포함` : '등록된 전체 시설 항목',
      icon: ClipboardList,
      countClass: 'text-[#8B4229]',
      iconBgClass: 'bg-[#F6E8DE]',
      iconClass: 'text-[#8B4229]',
      activeRing: 'border-[#8B4229] bg-[#FFF8F3]',
    },
    {
      key: 'overdue',
      title: '지연 항목',
      count: overdueCount,
      subtitle: '예정일 경과 · 확인 필요',
      icon: AlertCircle,
      countClass: 'text-[#B32D22]',
      iconBgClass: 'bg-[#FCECEB]',
      iconClass: 'text-[#B32D22]',
      activeRing: 'border-[#D16F67] bg-[#FFF7F6]',
    },
    {
      key: 'dueSoon',
      title: '임박 항목',
      count: dueSoonCount,
      subtitle: `예정일 ${warningDays}일 이내 도래`,
      icon: Clock,
      countClass: 'text-[#A3580D]',
      iconBgClass: 'bg-[#FEF4E2]',
      iconClass: 'text-[#A3580D]',
      activeRing: 'border-[#D9A24E] bg-[#FFFAF0]',
    },
    {
      key: 'normal',
      title: '정상 항목',
      count: normalCount,
      subtitle: `예정일 ${warningDays}일 초과 여유`,
      icon: CheckCircle2,
      countClass: 'text-[#236B3D]',
      iconBgClass: 'bg-[#EFF7EE]',
      iconClass: 'text-[#236B3D]',
      activeRing: 'border-[#63A377] bg-[#F7FBF6]',
    },
  ];

  return (
    <section aria-label="점검 현황 요약" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeStatusFilter === card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() =>
              onSelectStatusFilter(
                isActive && card.key !== 'all' ? 'all' : card.key
              )
            }
            className={`group flex flex-col justify-between rounded-xl border bg-[#FFFCF7]/95 p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229] ${
              isActive
                ? card.activeRing
                : 'border-[#E5D7C4] hover:border-[#CFB89D] hover:bg-[#FFF9F2]'
            }`}
            aria-pressed={isActive}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-[15.5px] font-semibold text-[#4E3D31]">{card.title}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBgClass}`}>
                <Icon className={`h-5 w-5 shrink-0 ${card.iconClass}`} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold tracking-tight tabular-nums ${card.countClass}`}>
                {card.count}
              </span>
              <span className="text-base font-medium text-[#877568]">건</span>
            </div>
            <p className="mt-2 text-[13.5px] text-[#6C5B4F]">{card.subtitle}</p>
          </button>
        );
      })}
    </section>
  );
}

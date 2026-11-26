import { ComputedInspectionItem } from '../types/inspection';
import { formatDaysRemaining, getStatusLabel } from '../utils/date';

interface PrintSheetProps {
  facilityName: string;
  todayStr: string;
  warningDays: number;
  items: ComputedInspectionItem[];
}

export function PrintSheet({ facilityName, todayStr, warningDays, items }: PrintSheetProps) {
  const overdueCount = items.filter((i) => i.status === 'overdue').length;
  const dueSoonCount = items.filter((i) => i.status === 'dueSoon').length;
  const normalCount = items.filter((i) => i.status === 'normal').length;
  const unenteredCount = items.filter((i) => i.status === 'unentered').length;

  return (
    <div className="hidden print-only">
      <div className="mb-4 border-b-2 border-slate-800 pb-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-600">{facilityName}</p>
            <h1 className="text-xl font-bold text-black">청사 시설 점검 일정 관리표</h1>
          </div>
          <div className="text-right text-xs text-slate-700 tabular-nums">
            <p>기준일(출력일): {todayStr}</p>
            <p>임박 기준: 예정일 {warningDays}일 이내</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-black tabular-nums">
          <span>전체: {items.length}건</span>
          <span>지연: {overdueCount}건</span>
          <span>임박: {dueSoonCount}건</span>
          <span>정상: {normalCount}건</span>
          <span>미입력: {unenteredCount}건</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: '4%' }}>순번</th>
            <th style={{ width: '9%' }}>점검 분야</th>
            <th style={{ width: '18%' }}>점검 명칭</th>
            <th style={{ width: '8%' }}>주기</th>
            <th style={{ width: '10%' }}>최근 점검일</th>
            <th style={{ width: '10%' }}>다음 예정일</th>
            <th style={{ width: '11%' }}>상태</th>
            <th style={{ width: '13%' }}>점검 업체/담당자</th>
            <th style={{ width: '17%' }}>근거 법령 · 비고</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '16px' }}>
                출력할 점검 항목이 없습니다.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td className="tabular-nums" style={{ textAlign: 'center' }}>
                  {idx + 1}
                </td>
                <td>{item.category}</td>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td className="tabular-nums" style={{ textAlign: 'center' }}>
                  {item.cycleMonths}개월
                </td>
                <td className="tabular-nums" style={{ textAlign: 'center' }}>
                  {item.lastInspectedDate || '-'}
                </td>
                <td className="tabular-nums" style={{ textAlign: 'center', fontWeight: 600 }}>
                  {item.nextDueDate || '-'}
                </td>
                <td className="tabular-nums">
                  <strong>{getStatusLabel(item.status)}</strong>
                  {item.daysRemaining !== null ? ` (${formatDaysRemaining(item.daysRemaining)})` : ''}
                </td>
                <td>{item.vendorOrManager || '-'}</td>
                <td>
                  {[item.legalBasis, item.note].filter(Boolean).join(' / ') || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="mt-3 text-[10px] text-slate-600">
        ※ 점검 주기는 반드시 관계 법령 및 시설 규모·용도별 기준을 확인하여 관리하시기 바랍니다.
      </p>
    </div>
  );
}

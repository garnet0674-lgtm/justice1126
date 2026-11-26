import { AlertCircle, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { InspectionStatus } from '../types/inspection';
import { getStatusLabel } from '../utils/date';

interface StatusLabelProps {
  status: InspectionStatus;
  compact?: boolean;
}

export function StatusLabel({ status, compact = false }: StatusLabelProps) {
  const label = getStatusLabel(status);

  const styles: Record<InspectionStatus, string> = {
    overdue: 'border-[#EBB8B4] bg-[#FCECEB] text-[#B32D22]',
    dueSoon: 'border-[#EAC68C] bg-[#FEF4E2] text-[#A3580D]',
    normal: 'border-[#B8D9B5] bg-[#EFF7EE] text-[#236B3D]',
    unentered: 'border-[#DCD0C0] bg-[#F3ECE2] text-[#66584B]',
  };

  const Icon =
    status === 'overdue'
      ? AlertCircle
      : status === 'dueSoon'
        ? Clock
        : status === 'normal'
          ? CheckCircle2
          : HelpCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold whitespace-nowrap shrink-0 ${
        compact ? 'px-2.5 py-0.5 text-[12.5px]' : 'px-3 py-1 text-[13.5px]'
      } ${styles[status]}`}
    >
      <Icon className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E231C]/45 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#E5D7C4] bg-[#FFFCF7] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#EDE2D4] px-6 py-4">
          <div className="flex items-center gap-2.5">
            {destructive && (
              <AlertTriangle className="h-5 w-5 shrink-0 text-[#B32D22]" aria-hidden="true" />
            )}
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#2E231C]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#877568] hover:bg-[#F3ECE2] hover:text-[#2E231C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-[#4E3D31]">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#EDE2D4] bg-[#F7EFE4]/60 px-6 py-4 rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg border border-[#D8C7B2] bg-[#FFFCF7] px-4 py-2 text-[15px] font-medium text-[#4E3D31] hover:bg-[#F3ECE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4229]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] rounded-lg px-5 py-2 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 ${
              destructive
                ? 'bg-[#B32D22] hover:bg-[#95241B] focus-visible:outline-[#B32D22]'
                : 'bg-[#8B4229] hover:bg-[#72341F] focus-visible:outline-[#8B4229]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, Info, AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ModalVariant = 'danger' | 'warning' | 'primary' | 'info' | 'success';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: ModalVariant;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  loading?: boolean;
  isLoading?: boolean;
  hideCancel?: boolean;
}

const VARIANT_STYLES: Record<ModalVariant, {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  confirmBtn: string;
  DefaultIcon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  danger: {
    iconBg: 'bg-[#CE1126]/12',
    iconBorder: 'border-[#CE1126]/30',
    iconColor: 'text-[#CE1126]',
    confirmBtn: 'bg-[#CE1126] hover:bg-[#b00f20] text-white shadow-lg shadow-[#CE1126]/20',
    DefaultIcon: Trash2,
  },
  warning: {
    iconBg: 'bg-[#F59E0B]/12',
    iconBorder: 'border-[#F59E0B]/30',
    iconColor: 'text-[#F59E0B]',
    confirmBtn: 'bg-[#F59E0B] hover:bg-[#d97706] text-white shadow-lg shadow-[#F59E0B]/20',
    DefaultIcon: AlertTriangle,
  },
  primary: {
    iconBg: 'bg-[#11428E]/15',
    iconBorder: 'border-[#11428E]/30',
    iconColor: 'text-[#3B82F6]',
    confirmBtn: 'bg-[#11428E] hover:bg-[#0d3472] text-white shadow-lg shadow-[#11428E]/25',
    DefaultIcon: Info,
  },
  info: {
    iconBg: 'bg-cyan-500/12',
    iconBorder: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    confirmBtn: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/25',
    DefaultIcon: AlertCircle,
  },
  success: {
    iconBg: 'bg-emerald-500/12',
    iconBorder: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
    DefaultIcon: CheckCircle2,
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'danger',
  icon: CustomIcon,
  loading,
  isLoading,
  hideCancel = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const finalMessage = message ?? description;
  const finalConfirmLabel = confirmLabel ?? confirmText ?? 'Confirm';
  const finalCancelLabel = cancelLabel ?? cancelText ?? 'Cancel';
  const finalLoading = loading ?? isLoading ?? false;

  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.danger;
  const IconToRender = CustomIcon || style.DefaultIcon;

  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !finalLoading) onClose();
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
        if (focusable.length < 2) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevActive?.focus?.();
    };
  }, [isOpen, onClose, finalLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !finalLoading) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle accent glow at top */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-[var(--accent-primary)]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        {!finalLoading && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        {/* Icon */}
        <div className={`flex items-center justify-center w-14 h-14 ${style.iconBg} border ${style.iconBorder} rounded-2xl mx-auto mb-4`}>
          <IconToRender size={26} className={style.iconColor} />
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-main)] text-center mb-2 tracking-tight">
          {title}
        </h3>

        {/* Description / Message */}
        <div className="text-[var(--text-muted)] text-xs sm:text-sm text-center mb-6 leading-relaxed">
          {finalMessage}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!hideCancel && (
            <button
              ref={cancelRef}
              onClick={onClose}
              disabled={finalLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] text-xs sm:text-sm font-bold hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
            >
              {finalCancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={finalLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${style.confirmBtn}`}
          >
            {finalLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>{finalConfirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

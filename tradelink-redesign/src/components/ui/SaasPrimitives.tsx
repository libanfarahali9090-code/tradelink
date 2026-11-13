import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';
import type { ToastMessage } from '../../types/tradelink';
import {
  DURATIONS,
  EASE_SAAS,
  drawerPanelMotion,
  modalBackdropMotion,
  modalPanelMotion,
} from '../../lib/motion';

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    prevRef.current = value;
    if (start === end) {
      setDisplay(end);
      return;
    }
    const duration = 380;
    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}

export type StatusTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'slate';

const TONE_VARS: Record<StatusTone, React.CSSProperties> = {
  emerald: {
    backgroundColor: 'var(--status-success-bg)',
    color: 'var(--status-success-fg)',
    borderColor: 'var(--status-success-bd)',
  },
  amber: {
    backgroundColor: 'var(--status-warn-bg)',
    color: 'var(--status-warn-fg)',
    borderColor: 'var(--status-warn-bd)',
  },
  rose: {
    backgroundColor: 'var(--status-danger-bg)',
    color: 'var(--status-danger-fg)',
    borderColor: 'var(--status-danger-bd)',
  },
  sky: {
    backgroundColor: 'var(--accent-subtle)',
    color: 'var(--accent-primary)',
    borderColor: 'var(--accent-border)',
  },
  indigo: {
    backgroundColor: 'var(--status-info-bg)',
    color: 'var(--status-info-fg)',
    borderColor: 'var(--status-info-bd)',
  },
  slate: {
    backgroundColor: 'var(--status-info-bg)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-hairline)',
  },
};

export function StatusTag({
  tone,
  label,
}: {
  tone: StatusTone;
  label: string;
}) {
  return (
    <motion.span
      key={`${tone}-${label}`}
      initial={{ opacity: 0.65, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATIONS.micro, ease: EASE_SAAS }}
      style={TONE_VARS[tone]}
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border whitespace-nowrap"
    >
      {label}
    </motion.span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-xl',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...modalBackdropMotion}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-backdrop backdrop-blur-[3px] no-print"
        >
          <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
          <motion.div
            {...modalPanelMotion}
            className={`relative z-10 w-full ${maxWidth} bg-surface border border-hairline rounded-[14px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-hairline">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-ink">
                  {title}
                </h2>
                {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-ink bg-hover transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...modalBackdropMotion}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex justify-end bg-backdrop backdrop-blur-[3px]"
        >
          <div className="flex-1 no-print" onClick={onClose} aria-hidden="true" />
          <motion.div
            {...drawerPanelMotion}
            className="w-full max-w-2xl bg-surface border-l border-hairline h-full flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-hairline no-print">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-ink truncate">
                  {title}
                </h2>
                {subtitle && <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted hover:text-ink bg-hover transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            style={{
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger-fg)',
            }}
            className="p-2 rounded-lg shrink-0"
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-sm text-muted leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium rounded-[10px] border border-hairline text-ink bg-hover transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-2 text-xs font-medium rounded-[10px] bg-danger text-on-solid transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ErrorBanner({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--status-danger-bg)',
        borderColor: 'var(--status-danger-bd)',
        color: 'var(--status-danger-fg)',
      }}
      className="px-4 py-3 rounded-[12px] border text-xs flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="min-w-0">
          {title && <div className="font-semibold">{title}</div>}
          <div className="break-words opacity-90">{message}</div>
        </div>
      </div>
      {onRetry && retryLabel && (
        <button
          type="button"
          onClick={onRetry}
          style={{ borderColor: 'var(--status-danger-bd)' }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium bg-surface text-ink bg-hover transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}

export function ToastHost({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] no-print pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: DURATIONS.dropdown, ease: EASE_SAAS }}
            className="pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-[12px] bg-surface border border-hairline shadow-xl"
          >
            {t.kind === 'success' && (
              <CheckCircle2
                style={{ color: 'var(--status-success-fg)' }}
                className="w-4 h-4 shrink-0 mt-0.5"
              />
            )}
            {t.kind === 'error' && (
              <AlertTriangle
                style={{ color: 'var(--status-danger-fg)' }}
                className="w-4 h-4 shrink-0 mt-0.5"
              />
            )}
            {t.kind === 'info' && (
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink">{t.title}</p>
              {t.detail && <p className="text-[11px] text-muted mt-0.5 break-words">{t.detail}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="text-muted hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-subtle" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-subtle" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-[10px] bg-subtle" />
          <div className="h-9 w-28 rounded-[10px] bg-subtle" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((k) => (
          <div
            key={k}
            className="bg-surface border border-hairline rounded-[14px] p-5 space-y-3"
          >
            <div className="h-3.5 w-24 rounded bg-subtle" />
            <div className="h-7 w-36 rounded bg-subtle" />
            <div className="h-3 w-28 rounded bg-subtle" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-surface border border-hairline rounded-[14px] p-5 h-72" />
        <div className="bg-surface border border-hairline rounded-[14px] p-5 h-72" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading records">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg bg-subtle" />
          <div className="h-3.5 w-72 max-w-full rounded-lg bg-subtle" />
        </div>
        <div className="h-9 w-32 rounded-[10px] bg-subtle" />
      </div>
      <div className="bg-surface border border-hairline rounded-[14px] overflow-hidden">
        <div className="h-11 bg-subtle border-b border-hairline" />
        <div className="divide-y divide-hairline">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4">
              <div className="h-3.5 w-32 rounded bg-subtle" />
              <div className="h-3.5 w-44 rounded bg-subtle hidden sm:block" />
              <div className="h-3.5 w-24 rounded bg-subtle" />
              <div className="h-5 w-16 rounded-md bg-subtle" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading grid">
      <div className="h-6 w-48 rounded-lg bg-subtle" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-hairline rounded-[14px] p-5 space-y-3"
          >
            <div className="h-4 w-36 rounded bg-subtle" />
            <div className="h-3 w-48 rounded bg-subtle" />
            <div className="h-8 w-full rounded-lg bg-subtle mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaginationBar({
  page,
  totalItems,
  pageSize,
  onPageChange,
  showingLabel = 'Showing',
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  showingLabel?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-hairline text-xs text-muted">
      <span className="tabular-nums">
        {showingLabel} {start}–{end} / {totalItems}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-hairline disabled:opacity-40 bg-hover text-ink transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2 tabular-nums font-medium text-ink">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-hairline disabled:opacity-40 bg-hover text-ink transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-hairline rounded-[14px] bg-surface">
      <div className="p-3 rounded-xl bg-subtle text-muted mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="text-xs text-muted max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-3.5 py-2 text-xs font-medium rounded-[10px] bg-accent text-on-accent transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function exportToCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

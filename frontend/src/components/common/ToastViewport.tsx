import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useUIStore, type ToastItem } from '@/stores/uiStore';

const toneStyles: Record<ToastItem['tone'], { icon: typeof Info; shell: string; iconTone: string }> = {
  success: {
    icon: CheckCircle2,
    shell: 'border-emerald-500/30 bg-[rgba(16,185,129,0.12)]',
    iconTone: 'text-emerald-300',
  },
  info: {
    icon: Info,
    shell: 'border-cyan-500/30 bg-[rgba(13,232,245,0.12)]',
    iconTone: 'text-cyan-300',
  },
  warning: {
    icon: AlertTriangle,
    shell: 'border-amber-500/30 bg-[rgba(245,158,11,0.12)]',
    iconTone: 'text-amber-300',
  },
  error: {
    icon: AlertTriangle,
    shell: 'border-red-500/30 bg-[rgba(239,68,68,0.12)]',
    iconTone: 'text-red-300',
  },
};

export default function ToastViewport() {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[10020] flex w-[min(92vw,22rem)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = toneStyles[toast.tone];
          const Icon = style.icon;
          return (
            <motion.article
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`pointer-events-auto glass ${style.shell} p-4`}
            >
              <div className="flex items-start gap-3">
                <span className={`rounded-lg border border-current/20 p-2 ${style.iconTone}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                    // signal
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{toast.title}</h3>
                  {toast.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{toast.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    {toast.actionLabel && toast.onAction && (
                      <button
                        type="button"
                        onClick={() => {
                          toast.onAction?.();
                          dismissToast(toast.id);
                        }}
                        className="button-secondary rounded-lg px-3 py-1.5 text-xs uppercase tracking-[0.16em]"
                      >
                        {toast.actionLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      className="button-ghost rounded-lg px-3 py-1.5 text-xs uppercase tracking-[0.16em]"
                    >
                      dismiss
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                  aria-label={`Dismiss ${toast.title}`}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

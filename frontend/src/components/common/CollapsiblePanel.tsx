import { useEffect, useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsiblePanelProps {
  eyebrow: string;
  title: string;
  description?: string;
  storageKey: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultExpanded?: boolean;
  headerClassName?: string;
  contentClassName?: string;
}

function readExpandedState(storageKey: string, defaultExpanded: boolean) {
  if (typeof window === 'undefined') return defaultExpanded;
  const stored = window.localStorage.getItem(storageKey);
  if (stored === null) return defaultExpanded;
  return stored === 'true';
}

export default function CollapsiblePanel({
  eyebrow,
  title,
  description,
  storageKey,
  children,
  actions,
  defaultExpanded = true,
  headerClassName,
  contentClassName,
}: CollapsiblePanelProps) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(() => readExpandedState(storageKey, defaultExpanded));

  useEffect(() => {
    setExpanded(readExpandedState(storageKey, defaultExpanded));
  }, [defaultExpanded, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, String(expanded));
  }, [expanded, storageKey]);

  return (
    <>
      <div
        className={cn(
          'flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between',
          headerClassName
        )}
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            {eyebrow}
          </p>
          <h2 className="panel-heading mt-1 text-lg">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {actions}
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="button-ghost inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.18em]"
            aria-label={`${expanded ? 'collapse' : 'expand'} ${title}`}
          >
            {expanded ? 'collapse' : 'expand'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn('overflow-hidden', contentClassName)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { FunnelPlus, RotateCcw } from 'lucide-react';
import CollapsiblePanel from '@/components/common/CollapsiblePanel';
import { cn } from '@/lib/utils';
import type {
  DashboardLabelItem,
  Label,
  Priority,
  TaskCompletionFilter,
  TaskFilterState,
} from '@/types';

type FilterLabel = Label | DashboardLabelItem;

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; tone: string }> = [
  { value: 'low', label: 'low', tone: 'rgba(34,197,94,0.18)' },
  { value: 'medium', label: 'medium', tone: 'rgba(245,158,11,0.18)' },
  { value: 'high', label: 'high', tone: 'rgba(249,115,22,0.18)' },
  { value: 'urgent', label: 'urgent', tone: 'rgba(239,68,68,0.18)' },
];

const COMPLETION_OPTIONS: Array<{
  value: TaskCompletionFilter;
  label: string;
  hint: string;
}> = [
  { value: 'all', label: 'all', hint: 'everything' },
  { value: 'open', label: 'open', hint: 'not in done' },
  { value: 'done', label: 'done', hint: 'done lane only' },
];

interface LabelFilterBarProps {
  labels: FilterLabel[];
  filters: TaskFilterState;
  title: string;
  hint: string;
  emptyText: string;
  testId?: string;
  storageKey?: string;
  onChange: (next: TaskFilterState) => void;
}

export default function LabelFilterBar({
  labels,
  filters,
  title,
  hint,
  emptyText,
  testId,
  storageKey = 'board-task-filters',
  onChange,
}: LabelFilterBarProps) {
  const hasFilters =
    filters.labelIds.length > 0 || filters.priorities.length > 0 || filters.completion !== 'all';

  const toggleLabel = (labelId: string) => {
    onChange({
      ...filters,
      labelIds: filters.labelIds.includes(labelId)
        ? filters.labelIds.filter((item) => item !== labelId)
        : [...filters.labelIds, labelId],
    });
  };

  const togglePriority = (priority: Priority) => {
    onChange({
      ...filters,
      priorities: filters.priorities.includes(priority)
        ? filters.priorities.filter((item) => item !== priority)
        : [...filters.priorities, priority],
    });
  };

  const setCompletion = (completion: TaskCompletionFilter) => {
    onChange({ ...filters, completion });
  };

  return (
    <section className="glass p-4" data-testid={testId}>
      <CollapsiblePanel
        eyebrow="// task filters"
        title={title}
        description={hint}
        storageKey={storageKey}
        contentClassName="mt-4"
        actions={
          hasFilters ? (
            <button
              type="button"
              onClick={() => onChange({ labelIds: [], priorities: [], completion: 'all' })}
              className="button-ghost inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.18em]"
            >
              <RotateCcw size={14} />
              clear filters
            </button>
          ) : null
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
          <div className="surface-subtle rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <FunnelPlus size={14} className="text-[var(--accent-primary)]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                labels
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {labels.length === 0 ? (
                <div className="surface-subtle px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {emptyText}
                </div>
              ) : (
                labels.map((label) => {
                  const isActive = filters.labelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        isActive ? 'shadow-[var(--glow-primary)]' : 'opacity-80 hover:opacity-100'
                      )}
                      style={{
                        backgroundColor: isActive ? `${label.color}24` : `${label.color}14`,
                        borderColor: isActive ? `${label.color}AA` : `${label.color}55`,
                        color: label.color,
                      }}
                      aria-pressed={isActive}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                      <span>{label.name}</span>
                      {'project_name' in label && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                          {label.project_name}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="surface-subtle rounded-2xl p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                priority
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((option) => {
                  const isActive = filters.priorities.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePriority(option.value)}
                      aria-label={`priority ${option.label}`}
                      className={cn(
                        'rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition',
                        isActive
                          ? 'border-[var(--accent-primary)] text-[var(--accent-gold)] shadow-[var(--glow-primary)]'
                          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--glass-border-hot)] hover:text-[var(--text-primary)]'
                      )}
                      style={{ backgroundColor: isActive ? option.tone : 'rgba(255,255,255,0.02)' }}
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="surface-subtle rounded-2xl p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                status
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {COMPLETION_OPTIONS.map((option) => {
                  const isActive = filters.completion === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCompletion(option.value)}
                      aria-label={`status ${option.label}`}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-left transition',
                        isActive
                          ? 'border-[var(--accent-primary)] bg-[rgba(212,82,10,0.12)] text-[var(--accent-gold)] shadow-[var(--glow-primary)]'
                          : 'border-[var(--glass-border)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)] hover:border-[var(--glass-border-hot)] hover:text-[var(--text-primary)]'
                      )}
                      aria-pressed={isActive}
                    >
                      <span className="block font-mono text-[11px] uppercase tracking-[0.18em]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] opacity-80">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CollapsiblePanel>
    </section>
  );
}

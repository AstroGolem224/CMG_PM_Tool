import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, Flame, Trash2 } from 'lucide-react';
import CollapsiblePanel from '@/components/common/CollapsiblePanel';
import ErrorBanner from '@/components/common/ErrorBanner';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import type { Column, Priority, Task } from '@/types';

interface BulkTaskActionsProps {
  projectId: string;
  tasks: Task[];
  columns: Column[];
  readOnly?: boolean;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export default function BulkTaskActions({
  projectId,
  tasks,
  columns,
  readOnly = false,
}: BulkTaskActionsProps) {
  const { bulkAction } = useTaskStore();
  const { pushToast, dismissToast } = useUIStore();
  const [targetColumnId, setTargetColumnId] = useState(columns[0]?.id ?? '');
  const [targetPriority, setTargetPriority] = useState<Priority>('high');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setTargetColumnId((current) => {
      if (!columns.length) return '';
      return columns.some((column) => column.id === current) ? current : columns[0].id;
    });
  }, [columns, projectId]);

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const count = taskIds.length;

  const runAction = async (operation: 'move' | 'priority' | 'delete') => {
    if (readOnly || count === 0) return;
    if (operation === 'delete' && !window.confirm(`Delete ${count} filtered task(s)?`)) return;

    if (operation === 'delete') {
      if (deleteTimerRef.current) {
        window.clearTimeout(deleteTimerRef.current);
      }

      const deleteToastId = pushToast(
        {
          tone: 'warning',
          title: `delete queued for ${count} task${count === 1 ? '' : 's'}`,
          description: 'the filtered slice will be deleted in 5 seconds unless you undo.',
          actionLabel: 'undo',
          onAction: () => {
            if (deleteTimerRef.current) {
              window.clearTimeout(deleteTimerRef.current);
              deleteTimerRef.current = null;
            }
            pushToast({
              tone: 'info',
              title: 'bulk delete cancelled',
              description: 'the filtered slice stayed intact.',
            });
          },
        },
        5000
      );

      deleteTimerRef.current = window.setTimeout(async () => {
        setRunning(true);
        setError(null);
        try {
          await bulkAction(projectId, { task_ids: taskIds, operation: 'delete' });
          dismissToast(deleteToastId);
          pushToast({
            tone: 'success',
            title: `deleted ${count} task${count === 1 ? '' : 's'}`,
            description: 'the filtered slice has been removed.',
          });
        } catch (err) {
          setError((err as Error).message || 'bulk action failed');
          pushToast({
            tone: 'error',
            title: 'bulk delete failed',
            description: (err as Error).message || 'the filtered slice could not be deleted.',
          });
        } finally {
          setRunning(false);
          deleteTimerRef.current = null;
        }
      }, 4500);
      return;
    }

    setRunning(true);
    setError(null);
    try {
      const updated = await bulkAction(projectId, {
        task_ids: taskIds,
        operation,
        column_id: operation === 'move' ? targetColumnId : undefined,
        priority: operation === 'priority' ? targetPriority : undefined,
      });
      pushToast({
        tone: 'success',
        title:
          operation === 'move'
            ? `moved ${updated} task${updated === 1 ? '' : 's'}`
            : `updated priority for ${updated} task${updated === 1 ? '' : 's'}`,
        description:
          operation === 'move'
            ? 'the current slice was moved to the selected lane.'
            : `the current slice now uses priority ${targetPriority}.`,
      });
    } catch (err) {
      setError((err as Error).message || 'bulk action failed');
      pushToast({
        tone: 'error',
        title: 'bulk action failed',
        description: (err as Error).message || 'the filtered slice could not be updated.',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="glass p-4" data-testid="bulk-task-actions">
      <CollapsiblePanel
        eyebrow="// bulk slice ops"
        title="Bulk Actions"
        description={`apply actions to the current filtered slice. active count: ${count}`}
        storageKey={`board:${projectId}:bulk-slice-ops`}
        contentClassName="mt-4"
      >
        <>
          {error && <ErrorBanner message={error} />}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface-subtle rounded-2xl p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                move slice
              </p>
              <select
                data-testid="bulk-move-select"
                value={targetColumnId}
                onChange={(event) => setTargetColumnId(event.target.value)}
                disabled={readOnly || running || columns.length === 0}
                className="control-shell mt-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
              >
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void runAction('move')}
                disabled={readOnly || running || count === 0 || !targetColumnId}
                className="button-primary mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                <ArrowRightLeft size={15} />
                move filtered tasks
              </button>
            </div>

            <div className="surface-subtle rounded-2xl p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                retune priority
              </p>
              <select
                data-testid="bulk-priority-select"
                value={targetPriority}
                onChange={(event) => setTargetPriority(event.target.value as Priority)}
                disabled={readOnly || running}
                className="control-shell mt-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void runAction('priority')}
                disabled={readOnly || running || count === 0}
                className="button-ghost mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                <Flame size={15} />
                update slice priority
              </button>
            </div>

            <div className="surface-subtle rounded-2xl p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                destructive
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                delete every task in the current filtered slice.
              </p>
              <button
                type="button"
                onClick={() => void runAction('delete')}
                disabled={readOnly || running || count === 0}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 disabled:opacity-50"
              >
                <Trash2 size={15} />
                delete filtered tasks
              </button>
            </div>
          </div>
        </>
      </CollapsiblePanel>
    </section>
  );
}

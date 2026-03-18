/** Modal dialog for quickly creating a new task in a column.
 *  Desktop: centered modal. Mobile (<md): bottom-sheet with drag handle. */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, X } from 'lucide-react';
import ErrorBanner from '@/components/common/ErrorBanner';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Priority, RecurrenceType } from '@/types';

interface AddTaskModalProps {
  columnId: string;
  onClose: () => void;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom_days', label: 'Custom (days)' },
];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AddTaskModal({ columnId, onClose }: AddTaskModalProps) {
  const { createTask, error } = useTaskStore();
  const { currentProject } = useProjectStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentProject) return;

    setLoading(true);
    try {
      await createTask({
        project_id: currentProject.id,
        column_id: columnId,
        title: title.trim(),
        description,
        priority,
        deadline: deadline || null,
        recurrence_type: recurrenceType,
        recurrence_interval: recurrenceType === 'custom_days' ? recurrenceInterval : 1,
        recurrence_days: recurrenceType === 'weekly' ? recurrenceDays.join(',') : '',
      });
      onClose();
    } catch {
      // Error is handled by the store
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {/* M6: items-end on mobile (bottom-sheet), items-center on md+ (centered modal) */}
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal / Bottom-Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative glass w-full max-w-none md:max-w-md rounded-t-2xl md:rounded-xl p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-modal-title"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* M6: Drag handle — mobile only */}
          <div className="flex justify-center mb-3 md:hidden">
            <span className="h-1 w-10 rounded-full bg-[var(--text-muted)]" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                // task injection
              </p>
              <h2 id="add-task-modal-title" className="panel-heading mt-1">New Task</h2>
            </div>
            <button
              onClick={onClose}
              className="button-ghost rounded-lg p-2"
              aria-label="Close new task dialog"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <ErrorBanner message={error} />}
            {/* Title */}
            <div>
              <label
                htmlFor="add-task-title"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
              >
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="add-task-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="add-task-description"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
              >
                Description
              </label>
              <textarea
                id="add-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className="control-shell w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Priority
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    aria-pressed={priority === p}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      priority === p
                        ? p === 'low'
                          ? 'bg-slate-500/30 text-slate-300 ring-1 ring-slate-500/40'
                          : p === 'medium'
                          ? 'bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/40'
                          : p === 'high'
                          ? 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-500/40'
                          : 'bg-red-500/30 text-red-300 ring-1 ring-red-500/40'
                        : 'button-ghost'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label
                htmlFor="add-task-deadline"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
              >
                Deadline
              </label>
              <input
                id="add-task-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none [color-scheme:dark]"
              />
            </div>

            {/* Recurrence */}
            <div>
              <label
                htmlFor="add-task-recurrence"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
              >
                <Repeat size={12} className="inline mr-1" />
                Recurrence
              </label>
              <select
                id="add-task-recurrence"
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none [color-scheme:dark]"
              >
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {recurrenceType === 'weekly' && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weekdays.map((day, index) => {
                    const dayValue = String(index + 1);
                    const selected = recurrenceDays.includes(dayValue);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setRecurrenceDays((current) =>
                            selected
                              ? current.filter((item) => item !== dayValue)
                              : [...current, dayValue].sort()
                          )
                        }
                        className={cn(
                          'rounded px-2 py-1 text-xs font-medium transition-colors',
                          selected ? 'bg-[var(--accent-primary)] text-white' : 'button-ghost'
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}

              {recurrenceType === 'custom_days' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">Every</span>
                  <input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="control-shell w-20 rounded-lg px-2 py-1 text-center text-sm outline-none"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">day(s)</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="button-ghost flex-1 rounded-lg py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || loading}
                className="button-primary flex-1 rounded-lg py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

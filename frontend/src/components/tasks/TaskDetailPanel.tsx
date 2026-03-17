/** Slide-in panel showing full task details with inline editing.
 *  Desktop: slides in from right. Mobile (<md): full-screen slide-up with back button. */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Trash2, Calendar, Repeat } from 'lucide-react';
import { cn, priorityColors, priorityLabels } from '@/lib/utils';
import ErrorBanner from '@/components/common/ErrorBanner';
import TaskLabels from './TaskLabels';
import TaskComments from './TaskComments';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { tasksApi } from '@/api/tasks';
import type { Priority, RecurrenceType, Task } from '@/types';

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom_days', label: 'Custom (days)' },
];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TaskDetailPanel() {
  const { selectedTask, setSelectedTask, replaceTask, updateTask, deleteTask, error } = useTaskStore();
  const { currentProject } = useProjectStore();
  const { taskDetailOpen, setTaskDetailOpen } = useUIStore();
  const selectedTaskId = selectedTask?.id ?? null;
  const readOnly = currentProject?.status === 'archived';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [fullTask, setFullTask] = useState<Task | null>(null);

  const fetchFullTask = useCallback(async () => {
    if (!selectedTaskId) return;
    try {
      const data = await tasksApi.get(selectedTaskId);
      setFullTask(data);
      replaceTask(data);
    } catch {
      setFullTask(selectedTask ?? null);
    }
  }, [replaceTask, selectedTask, selectedTaskId]);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description ?? '');
      setPriority(selectedTask.priority);
      setDeadline(selectedTask.deadline ?? '');
      void fetchFullTask();
    }
  }, [selectedTaskId]);

  const handleClose = () => {
    setTaskDetailOpen(false);
    setSelectedTask(null);
  };

  const handleSave = async () => {
    if (!selectedTask || readOnly) return;
    await updateTask(selectedTask.id, {
      title: title.trim(),
      description,
      priority,
      deadline: deadline || null,
    });
  };

  const handleDelete = async () => {
    if (!selectedTask || readOnly) return;
    if (!window.confirm(`Delete task "${selectedTask.title}"?`)) return;
    await deleteTask(selectedTask.id);
    handleClose();
  };

  const handleRefresh = () => {
    fetchFullTask();
  };

  const task = fullTask ?? selectedTask;

  return (
    <AnimatePresence>
      {taskDetailOpen && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9998]"
            onClick={handleClose}
          />

          {/* Panel — desktop: slide from right, mobile: slide from bottom full-screen */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            data-testid="task-detail-panel"
            className="fixed right-0 top-0 bottom-0 z-[9999] hidden md:flex w-full max-w-lg flex-col border-l border-[var(--glass-border)] glass shadow-2xl"
          >
            {/* Desktop header */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                  // task detail
                </p>
                <h2 className="panel-heading mt-1">Task Details</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={readOnly}
                  className="button-ghost rounded-lg p-2 text-[var(--neon-red)] disabled:opacity-40"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleClose}
                  className="button-ghost rounded-lg p-2"
                  aria-label="Close panel"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Desktop content */}
            <TaskDetailContent
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              priority={priority}
              setPriority={setPriority}
              deadline={deadline}
              setDeadline={setDeadline}
              task={task}
              selectedTask={selectedTask}
              readOnly={readOnly}
              error={error}
              onSave={handleSave}
              onRefresh={handleRefresh}
              onUpdate={updateTask}
            />

            {/* Footer save button */}
            <div className="border-t border-[var(--glass-border)] px-6 py-4">
              <button
                onClick={handleSave}
                disabled={readOnly}
                className="button-primary w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </motion.div>

          {/* M7: Mobile full-screen panel — slide from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex md:hidden flex-col glass"
          >
            {/* Mobile header with back button */}
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 rounded-lg p-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                aria-label="Back"
              >
                <ArrowLeft size={20} />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={readOnly}
                  className="button-ghost rounded-lg p-2 text-[var(--neon-red)] disabled:opacity-40"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Mobile content */}
            <TaskDetailContent
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              priority={priority}
              setPriority={setPriority}
              deadline={deadline}
              setDeadline={setDeadline}
              task={task}
              selectedTask={selectedTask}
              readOnly={readOnly}
              error={error}
              onSave={handleSave}
              onRefresh={handleRefresh}
              onUpdate={updateTask}
            />

            {/* Mobile footer */}
            <div
              className="border-t border-[var(--glass-border)] px-4 py-3"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <button
                onClick={handleSave}
                disabled={readOnly}
                className="button-primary w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Shared content between desktop and mobile panels */
function TaskDetailContent({
  title, setTitle, description, setDescription,
  priority, setPriority, deadline, setDeadline,
  task, selectedTask, readOnly, error,
  onSave, onRefresh, onUpdate,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  priority: Priority; setPriority: (v: Priority) => void;
  deadline: string; setDeadline: (v: string) => void;
  task: Task;
  selectedTask: Task | null;
  readOnly: boolean;
  error: string | null;
  onSave: () => void;
  onRefresh: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 md:px-6 py-5">
      {error && <ErrorBanner message={error} />}
      {readOnly && (
        <div className="surface-subtle rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
          archived project: task details are read-only until the project is restored.
        </div>
      )}
      {/* Title */}
      <div>
        <label
          htmlFor="task-title"
          className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
        >
          Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={onSave}
          disabled={readOnly}
          className="w-full border-b border-[var(--glass-border)] bg-transparent pb-1 text-lg font-semibold text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--glass-border-hot)] focus:border-[var(--accent-primary)]"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="task-description"
          className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
        >
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={onSave}
          placeholder="Add a description..."
          rows={4}
          disabled={readOnly}
          className="control-shell w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          Priority
        </label>
        <div className="flex gap-2">
          {priorities.map((p) => {
            const pStyle = priorityColors[p];
            return (
              <button
                key={p}
                onClick={() => {
                  if (readOnly) return;
                  setPriority(p);
                  if (selectedTask) {
                    onUpdate(selectedTask.id, { priority: p });
                  }
                }}
                disabled={readOnly}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  priority === p
                    ? `${pStyle.bg} ${pStyle.text} ring-1 ring-white/10`
                    : 'button-ghost'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', pStyle.dot)} />
                {priorityLabels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label
          htmlFor="task-deadline"
          className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
        >
          <Calendar size={12} className="inline mr-1" />
          Deadline
        </label>
        <input
          id="task-deadline"
          type="date"
          value={deadline}
          onChange={(e) => {
            if (readOnly) return;
            setDeadline(e.target.value);
            if (selectedTask) {
              onUpdate(selectedTask.id, { deadline: e.target.value || null });
            }
          }}
          disabled={readOnly}
          className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none [color-scheme:dark]"
        />
      </div>

      {/* Recurrence */}
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          <Repeat size={12} className="inline mr-1" />
          Recurrence
        </label>
        <select
          value={task.recurrence_type ?? 'none'}
          onChange={(e) => {
            if (readOnly || !selectedTask) return;
            const val = e.target.value as RecurrenceType;
            onUpdate(selectedTask.id, { recurrence_type: val, recurrence_interval: val === 'none' ? 1 : (task.recurrence_interval || 1) });
          }}
          disabled={readOnly}
          className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none [color-scheme:dark]"
        >
          {recurrenceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Weekly: day-of-week picker */}
        {(task.recurrence_type === 'weekly') && (
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {weekdays.map((day, i) => {
              const selected = (task.recurrence_days ?? '').split(',').includes(String(i + 1));
              return (
                <button
                  key={day}
                  disabled={readOnly}
                  onClick={() => {
                    if (readOnly || !selectedTask) return;
                    const current = (task.recurrence_days ?? '').split(',').filter(Boolean);
                    const dayStr = String(i + 1);
                    const next = selected
                      ? current.filter((d) => d !== dayStr)
                      : [...current, dayStr];
                    onUpdate(selectedTask.id, { recurrence_days: next.sort().join(',') });
                  }}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    selected
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'button-ghost'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom: interval input */}
        {(task.recurrence_type === 'custom_days') && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)]">Every</span>
            <input
              type="number"
              min={1}
              value={task.recurrence_interval ?? 1}
              onChange={(e) => {
                if (readOnly || !selectedTask) return;
                const val = Math.max(1, parseInt(e.target.value) || 1);
                onUpdate(selectedTask.id, { recurrence_interval: val });
              }}
              disabled={readOnly}
              className="control-shell w-20 rounded-lg px-2 py-1 text-sm outline-none text-center"
            />
            <span className="text-xs text-[var(--text-secondary)]">day(s)</span>
          </div>
        )}
      </div>

      {/* Labels */}
      {task && (
        <TaskLabels task={task} onUpdate={onRefresh} disabled={readOnly} />
      )}

      {/* Divider */}
      <div className="border-t border-[var(--glass-border)]" />

      {/* Comments */}
      {task && <TaskComments taskId={task.id} disabled={readOnly} />}
    </div>
  );
}

/** Slide-in panel showing full task details with inline editing */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar } from 'lucide-react';
import { cn, priorityColors, priorityLabels } from '@/lib/utils';
import ErrorBanner from '@/components/common/ErrorBanner';
import TaskLabels from './TaskLabels';
import TaskComments from './TaskComments';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { tasksApi } from '@/api/tasks';
import type { Priority, Task } from '@/types';

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

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
            className="fixed inset-0 bg-black/40 z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            data-testid="task-detail-panel"
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-lg flex-col border-l border-[var(--glass-border)] glass shadow-2xl"
          >
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
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
                  onBlur={handleSave}
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
                  onBlur={handleSave}
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
                            updateTask(selectedTask.id, { priority: p });
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
                      updateTask(selectedTask.id, { deadline: e.target.value || null });
                    }
                  }}
                  disabled={readOnly}
                  className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none [color-scheme:dark]"
                />
              </div>

              {/* Labels */}
              {task && (
                <TaskLabels task={task} onUpdate={handleRefresh} disabled={readOnly} />
              )}

              {/* Divider */}
              <div className="border-t border-[var(--glass-border)]" />

              {/* Comments */}
              {task && <TaskComments taskId={task.id} disabled={readOnly} />}
            </div>

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
        </>
      )}
    </AnimatePresence>
  );
}

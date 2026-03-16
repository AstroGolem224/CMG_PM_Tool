/** Modal dialog for quickly creating a new task in a column */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ErrorBanner from '@/components/common/ErrorBanner';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Priority } from '@/types';

interface AddTaskModalProps {
  columnId: string;
  onClose: () => void;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export default function AddTaskModal({ columnId, onClose }: AddTaskModalProps) {
  const { createTask, error } = useTaskStore();
  const { currentProject } = useProjectStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative glass w-full max-w-md p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                // task injection
              </p>
              <h2 className="panel-heading mt-1">New Task</h2>
            </div>
            <button
              onClick={onClose}
              className="button-ghost rounded-lg p-2"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <ErrorBanner message={error} />}
            {/* Title */}
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Title <span className="text-red-400">*</span>
              </label>
              <input
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
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Description
              </label>
              <textarea
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
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none [color-scheme:dark]"
              />
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

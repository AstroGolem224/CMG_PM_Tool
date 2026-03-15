/** Modal dialog for quickly creating a new task in a column */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import type { Priority } from '@/types';

interface AddTaskModalProps {
  columnId: string;
  onClose: () => void;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export default function AddTaskModal({ columnId, onClose }: AddTaskModalProps) {
  const { createTask } = useTaskStore();
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          className="relative glass rounded-xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">New Task</h2>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 resize-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
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
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 [color-scheme:dark]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || loading}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

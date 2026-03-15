/** Slide-in panel showing full task details with inline editing */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar } from 'lucide-react';
import { cn, priorityColors, priorityLabels } from '@/lib/utils';
import TaskLabels from './TaskLabels';
import TaskComments from './TaskComments';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { tasksApi } from '@/api/tasks';
import type { Priority, Task } from '@/types';

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export default function TaskDetailPanel() {
  const { selectedTask, setSelectedTask, updateTask, deleteTask } = useTaskStore();
  const { taskDetailOpen, setTaskDetailOpen } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [fullTask, setFullTask] = useState<Task | null>(null);

  const fetchFullTask = useCallback(async () => {
    if (!selectedTask) return;
    try {
      const data = await tasksApi.get(selectedTask.id);
      setFullTask(data);
    } catch {
      setFullTask(selectedTask);
    }
  }, [selectedTask]);

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description ?? '');
      setPriority(selectedTask.priority);
      setDeadline(selectedTask.deadline ?? '');
      fetchFullTask();
    }
  }, [selectedTask, fetchFullTask]);

  const handleClose = () => {
    setTaskDetailOpen(false);
    setSelectedTask(null);
  };

  const handleSave = async () => {
    if (!selectedTask) return;
    await updateTask(selectedTask.id, {
      title: title.trim(),
      description,
      priority,
      deadline: deadline || null,
    });
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg glass border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-gray-400">Task Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Delete task"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close panel"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  className="w-full bg-transparent text-lg font-semibold text-white border-b border-transparent hover:border-white/10 focus:border-primary-500 outline-none pb-1 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Add a description..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Priority</label>
                <div className="flex gap-2">
                  {priorities.map((p) => {
                    const pStyle = priorityColors[p];
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setPriority(p);
                          if (selectedTask) {
                            updateTask(selectedTask.id, { priority: p });
                          }
                        }}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          priority === p
                            ? `${pStyle.bg} ${pStyle.text} ring-1 ring-white/10`
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  <Calendar size={12} className="inline mr-1" />
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    if (selectedTask) {
                      updateTask(selectedTask.id, { deadline: e.target.value || null });
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 [color-scheme:dark]"
                />
              </div>

              {/* Labels */}
              {task && (
                <TaskLabels task={task} onUpdate={handleRefresh} />
              )}

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Comments */}
              {task && <TaskComments taskId={task.id} />}
            </div>

            {/* Footer save button */}
            <div className="px-6 py-4 border-t border-white/10">
              <button
                onClick={handleSave}
                className="w-full py-2 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
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

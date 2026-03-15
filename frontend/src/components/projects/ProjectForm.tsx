/** Create/Edit project dialog with name, description, and color picker */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { cn, colorPalette } from '@/lib/utils';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export default function ProjectForm() {
  const { createProject, updateProject } = useProjectStore();
  const { modalType, modalData, closeModal } = useUIStore();

  const isEditing = modalType === 'editProject';
  const existingProject = modalData as { id?: string; name?: string; description?: string; color?: string };

  const [name, setName] = useState(existingProject?.name ?? '');
  const [description, setDescription] = useState(existingProject?.description ?? '');
  const [color, setColor] = useState(existingProject?.color ?? '#6366f1');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (isEditing && existingProject?.id) {
        await updateProject(existingProject.id, { name: name.trim(), description, color });
      } else {
        await createProject({ name: name.trim(), description, color });
      }
      closeModal();
    } catch {
      // Error handled by store
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative glass rounded-xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? 'Edit Project' : 'New Project'}
            </h2>
            <button
              onClick={closeModal}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25"
                required
              />
            </div>

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

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all flex items-center justify-center',
                      color === c ? 'ring-2 ring-white/30 scale-110' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

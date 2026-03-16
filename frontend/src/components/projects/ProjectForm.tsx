/** Create/Edit project dialog with name, description, and color picker */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { cn, colorPalette } from '@/lib/utils';
import ErrorBanner from '@/components/common/ErrorBanner';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export default function ProjectForm() {
  const { createProject, updateProject, error } = useProjectStore();
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

  useEffect(() => {
    setName(existingProject?.name ?? '');
    setDescription(existingProject?.description ?? '');
    setColor(existingProject?.color ?? '#6366f1');
  }, [existingProject?.color, existingProject?.description, existingProject?.name]);

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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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
          className="relative glass w-full max-w-md p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                // project registry
              </p>
              <h2 className="panel-heading mt-1">
                {isEditing ? 'Edit Project' : 'New Project'}
              </h2>
            </div>
            <button
              onClick={closeModal}
              className="button-ghost rounded-lg p-2"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <ErrorBanner message={error} />}
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name..."
                className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none"
                required
              />
            </div>

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

            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
                      color === c ? 'ring-2 ring-[var(--accent-gold)] scale-110' : 'hover:scale-105'
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
                className="button-ghost flex-1 rounded-lg py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="button-primary flex-1 rounded-lg py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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

/** Project card with color strip, name, and description */
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Archive, FilePenLine, FolderKanban, RotateCcw, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const navigate = useNavigate();
  const { archiveProject, deleteProject, restoreProject } = useProjectStore();
  const { openModal } = useUIStore();

  const handleArchive = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!window.confirm(`Archive project "${project.name}"?`)) return;
    await archiveProject(project.id);
  };

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!window.confirm(`Delete project "${project.name}" and all related data?`)) return;
    await deleteProject(project.id);
  };

  const handleRestore = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    await restoreProject(project.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={() => navigate(`/projects/${project.id}`)}
      className="glass group cursor-pointer overflow-hidden transition-all hover:border-[var(--glass-border-hot)]"
    >
      {/* Color strip */}
      <div className="h-1.5" style={{ backgroundColor: project.color }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
            style={{ backgroundColor: `${project.color}20`, borderColor: `${project.color}55` }}
          >
            <FolderKanban size={20} style={{ color: project.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl uppercase tracking-[0.1em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-gold)]">
              {project.name}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {project.status === 'archived' ? 'Archived' : 'Active'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {project.status === 'active' ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openModal('editProject', project as unknown as Record<string, unknown>);
                  }}
                  className="button-ghost rounded-lg p-2"
                  aria-label={`Edit ${project.name}`}
                >
                  <FilePenLine size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  className="button-ghost rounded-lg p-2"
                  aria-label={`Archive ${project.name}`}
                >
                  <Archive size={14} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRestore}
                className="button-ghost rounded-lg p-2 text-emerald-300"
                aria-label={`Restore ${project.name}`}
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="button-ghost rounded-lg p-2 text-[var(--neon-red)]"
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {project.description && (
          <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
            {project.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

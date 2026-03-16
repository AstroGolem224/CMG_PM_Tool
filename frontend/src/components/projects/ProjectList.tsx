/** Grid of project cards with create button */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ErrorBanner from '@/components/common/ErrorBanner';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

type ProjectFilter = 'active' | 'archived' | 'all';
type ProjectSort = 'updated' | 'name';

export default function ProjectList() {
  const { projects, loading, error, fetchProjects } = useProjectStore();
  const { openModal } = useUIStore();
  const [filter, setFilter] = useState<ProjectFilter>('active');
  const [sortBy, setSortBy] = useState<ProjectSort>('updated');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (filter === 'all') return true;
      return project.status === filter;
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name);
      }
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });
  }, [filter, projects, sortBy]);

  const filterLabels: Record<ProjectFilter, string> = {
    active: 'active',
    archived: 'archived',
    all: 'all',
  };

  if (loading && projects.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 glass rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            // active roster
          </p>
          <h2 className="panel-heading mt-1 text-xl">Project Registry</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {visibleProjects.length} visible project{visibleProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => openModal('createProject')}
          className="button-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['active', 'archived', 'all'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition ${
                filter === value
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-void)] shadow-[var(--glow-primary)]'
                  : 'border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--glass-border-hot)] hover:text-[var(--text-primary)]'
              }`}
            >
              {filterLabels[value]}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          sort
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as ProjectSort)}
            className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)] outline-none"
          >
            <option value="updated">recently updated</option>
            <option value="name">name</option>
          </select>
        </label>
      </div>

      {visibleProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]"
        >
          <FolderOpen size={48} className="mb-4 text-[var(--text-muted)]" />
          <p className="font-display text-2xl uppercase tracking-[0.1em] text-[var(--text-primary)]">
            No matching projects
          </p>
          <p className="mt-1 text-sm">Try another filter or create a new project.</p>
          <button
            onClick={() => openModal('createProject')}
            className="button-primary mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Plus size={16} />
            Create Project
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

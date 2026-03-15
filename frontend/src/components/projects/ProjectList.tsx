/** Grid of project cards with create button */
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen } from 'lucide-react';
import ProjectCard from './ProjectCard';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export default function ProjectList() {
  const { projects, loading, fetchProjects } = useProjectStore();
  const { openModal } = useUIStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeProjects = projects.filter((p) => p.status === 'active');

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">All Projects</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => openModal('createProject')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {activeProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-gray-500"
        >
          <FolderOpen size={48} className="mb-4 text-gray-600" />
          <p className="text-lg font-medium text-gray-400">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started.</p>
          <button
            onClick={() => openModal('createProject')}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus size={16} />
            Create Project
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

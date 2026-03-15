/** Project card with color strip, name, and description */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={() => navigate(`/projects/${project.id}`)}
      className="glass rounded-xl overflow-hidden cursor-pointer group transition-all hover:border-white/20"
    >
      {/* Color strip */}
      <div className="h-1.5" style={{ backgroundColor: project.color }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${project.color}20` }}
          >
            <FolderKanban size={20} style={{ color: project.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {project.status === 'archived' ? 'Archived' : 'Active'}
            </p>
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

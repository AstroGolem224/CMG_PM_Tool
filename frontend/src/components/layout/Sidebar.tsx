/** Collapsible sidebar with project navigation and app links */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, fetchProjects } = useProjectStore();
  const { sidebarOpen, toggleSidebar, openModal } = useUIStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const activeProjects = projects.filter((p) => p.status === 'active');

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen glass border-r border-white/10 z-20 shrink-0"
    >
      {/* Logo & collapse toggle */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <FolderKanban size={18} className="text-white" />
              </div>
              <span className="font-semibold text-white text-sm">CMG PM Tool</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1 px-3 pt-4">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={20} />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto mt-6 px-3">
        <div className="flex items-center justify-between mb-2 px-1">
          {sidebarOpen && (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </span>
          )}
          <button
            onClick={() => openModal('createProject')}
            className="p-1 rounded text-gray-400 hover:text-primary-400 hover:bg-white/5 transition-colors"
            aria-label="New project"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {activeProjects.map((project) => {
            const isActive = location.pathname === `/projects/${project.id}`;
            return (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {project.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}

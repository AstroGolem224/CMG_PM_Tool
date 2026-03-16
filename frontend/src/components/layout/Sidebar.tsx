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
      className="glass relative z-20 flex h-screen shrink-0 flex-col border-r border-[var(--glass-border)]"
    >
      {/* Logo & collapse toggle */}
      <div className="flex h-20 items-center justify-between border-b border-[var(--glass-border)] px-4">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--glass-border-hot)] bg-[rgba(212,82,10,0.14)] shadow-[var(--glow-primary)]">
                <FolderKanban size={18} className="text-[var(--accent-primary)]" />
              </div>
              <div>
                <span className="block font-display text-xl uppercase tracking-[0.18em] text-[var(--accent-gold)]">
                  cmg prism
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  // build // forge // play
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
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
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[rgba(212,82,10,0.16)] text-[var(--accent-primary)] shadow-[inset_0_0_0_1px_var(--glass-border-hot)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              )}
            >
              <Icon size={20} />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em]"
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
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              project lanes
            </span>
          )}
          <button
            onClick={() => openModal('createProject')}
            className="rounded p-1 text-[var(--text-secondary)] transition hover:bg-white/5 hover:text-[var(--accent-primary)]"
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-[rgba(255,255,255,0.08)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
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
                      className="truncate font-medium"
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

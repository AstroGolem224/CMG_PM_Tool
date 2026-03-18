/** Top header bar with page title, breadcrumb, and search */
import { useLocation, useParams } from 'react-router-dom';
import { Flame, Menu, ScanSearch, Sparkles, Target, Zap } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

function getPageTitle(pathname: string, projectName?: string): { title: string; breadcrumb?: string } {
  if (pathname === '/') return { title: 'Dashboard' };
  if (pathname === '/projects') return { title: 'Projects' };
  if (pathname === '/settings') return { title: 'Settings' };
  if (pathname.startsWith('/projects/') && projectName) {
    return { title: projectName, breadcrumb: 'Projects' };
  }
  return { title: 'CMG PM Tool' };
}

export default function Header() {
  const location = useLocation();
  const { id } = useParams();
  const { currentProject, projects } = useProjectStore();
  const { sidebarOpen, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, theme, setTheme, boardViewContext } = useUIStore();

  const projectName = currentProject?.name ?? projects.find((p) => p.id === id)?.name;
  const { title, breadcrumb } = getPageTitle(location.pathname, projectName);

  return (
    <header className="glass relative z-10 flex h-14 md:h-20 shrink-0 items-center justify-between border-b border-[var(--glass-border)] px-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        {/* Mobile hamburger — only visible on <md */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-white/10 hover:text-[var(--text-primary)] md:hidden"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-controls="mobile-sidebar"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={22} />
        </button>
        {/* Desktop sidebar toggle — only when sidebar collapsed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden md:block rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-white/10 hover:text-[var(--text-primary)]"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {breadcrumb && (
              <>
                <span className="mono-label hidden sm:inline">{breadcrumb}</span>
                <span className="text-[var(--text-muted)] hidden sm:inline">/</span>
              </>
            )}
            <h1 className="font-display text-lg md:text-2xl uppercase tracking-[0.14em] text-[var(--text-primary)] truncate">
              {title}
            </h1>
          </div>
          <p className="mt-0.5 md:mt-1 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] hidden sm:block">
            // mission control // lane-aware project ops
          </p>
          {location.pathname.startsWith('/projects/') && boardViewContext.projectId === id && (
            <div className="mt-1 md:mt-2 flex flex-wrap gap-2 hidden md:flex">
              <span className="badge-shell inline-flex items-center gap-1 rounded-full px-2 py-1">
                <Target size={11} />
                active: {boardViewContext.activeViewName ?? 'manual'}
              </span>
              <span className="badge-shell inline-flex items-center gap-1 rounded-full px-2 py-1 text-[var(--accent-gold)]">
                <Sparkles size={11} />
                default: {boardViewContext.defaultViewName ?? 'none'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 md:gap-2 rounded-lg border border-[var(--glass-border)] bg-[rgba(12,18,20,0.55)] px-1.5 md:px-2 py-1.5 md:py-2">
          {(
            [
              { id: 'ember', icon: Flame, label: 'ember' },
              { id: 'neon', icon: Zap, label: 'neon' },
              { id: 'light', icon: ScanSearch, label: 'light' },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
              className={`rounded-md px-1.5 md:px-2 py-1 transition ${
                theme === id
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-void)] shadow-[var(--glow-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
              }`}
              aria-label={`Switch to ${label} theme`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <div className="hidden md:block rounded-lg border border-[var(--glass-border)] bg-[rgba(12,18,20,0.55)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          search queued
        </div>
      </div>
    </header>
  );
}

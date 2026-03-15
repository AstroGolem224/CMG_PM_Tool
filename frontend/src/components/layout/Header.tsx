/** Top header bar with page title, breadcrumb, and search */
import { useLocation, useParams } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
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
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const projectName = currentProject?.name ?? projects.find((p) => p.id === id)?.name;
  const { title, breadcrumb } = getPageTitle(location.pathname, projectName);

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-gray-950/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2">
          {breadcrumb && (
            <>
              <span className="text-gray-500 text-sm">{breadcrumb}</span>
              <span className="text-gray-600">/</span>
            </>
          )}
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </div>
      </div>

      {/* Search placeholder */}
      <div className="relative max-w-xs w-full">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-colors"
        />
      </div>
    </header>
  );
}

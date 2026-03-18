/** M3 — Bottom navigation bar for mobile, hidden on md+ */
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around glass border-t border-[var(--glass-border)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ icon: Icon, label, path }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            aria-label={`Open ${label}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 text-[10px] font-mono uppercase tracking-[0.16em] transition-colors',
              isActive
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)]'
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Root layout wrapping sidebar, header, and page content */
import { Outlet } from 'react-router-dom';
import Atmosphere from './Atmosphere';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

export default function MainLayout() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--bg-void)] text-[var(--text-primary)]">
      <Atmosphere />
      {/* Desktop sidebar — hidden on mobile, slide-over handled inside Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Mobile slide-over sidebar */}
      <Sidebar mobile />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto px-4 py-4 md:px-8 md:py-5 pb-20 md:pb-5">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

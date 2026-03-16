/** Root layout wrapping sidebar, header, and page content */
import { Outlet } from 'react-router-dom';
import Atmosphere from './Atmosphere';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--bg-void)] text-[var(--text-primary)]">
      <Atmosphere />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto px-6 py-5 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

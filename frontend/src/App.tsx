/** Root application component with routing and global modals */
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import ToastViewport from '@/components/common/ToastViewport';
import MainLayout from '@/components/layout/MainLayout';
import ProjectForm from '@/components/projects/ProjectForm';
import { useUIStore } from '@/stores/uiStore';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const KanbanPage = lazy(() => import('@/pages/KanbanPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-primary-400 animate-spin" />
    </div>
  );
}

export default function App() {
  const { modalType, theme } = useUIStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<KanbanPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>

      {/* Global modals */}
      <AnimatePresence>
        {(modalType === 'createProject' || modalType === 'editProject') && (
          <ProjectForm />
        )}
      </AnimatePresence>
      <ToastViewport />
    </BrowserRouter>
  );
}

/** Kanban board page for a specific project */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';

export default function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchProject, loading: projectLoading } = useProjectStore();
  const { fetchTasks, loading: taskLoading } = useTaskStore();

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchTasks(id);
    }
  }, [id, fetchProject, fetchTasks]);

  const loading = projectLoading || taskLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={32} className="text-primary-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <KanbanBoard />
      <TaskDetailPanel />
    </div>
  );
}

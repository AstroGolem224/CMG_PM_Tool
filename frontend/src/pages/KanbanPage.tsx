/** Kanban board page for a specific project */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, Plus } from 'lucide-react';
import { labelsApi } from '@/api/labels';
import LabelFilterBar from '@/components/common/LabelFilterBar';
import ErrorBanner from '@/components/common/ErrorBanner';
import BulkTaskActions from '@/components/kanban/BulkTaskActions';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import AddTaskModal from '@/components/kanban/AddTaskModal';
import ProjectLabelManager from '@/components/projects/ProjectLabelManager';
import ProjectViewManager from '@/components/projects/ProjectViewManager';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import { filterTasks } from '@/lib/taskFilters';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Label, TaskFilterState } from '@/types';

const defaultFilters: TaskFilterState = {
  labelIds: [],
  priorities: [],
  completion: 'all',
};

export default function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, columns, fetchProject, loading: projectLoading, error: projectError } = useProjectStore();
  const { tasks, fetchTasks, loading: taskLoading, error: taskError } = useTaskStore();
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [filters, setFilters] = useState<TaskFilterState>(defaultFilters);
  const [fabModalOpen, setFabModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setFilters(defaultFilters);
      void fetchProject(id);
      void fetchTasks(id);
    }
  }, [id, fetchProject, fetchTasks]);

  useEffect(() => {
    if (!id) return;

    labelsApi
      .listByProject(id)
      .then(setProjectLabels)
      .catch(() => setProjectLabels([]));
  }, [id]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      labelIds: current.labelIds.filter((labelId) => projectLabels.some((label) => label.id === labelId)),
    }));
  }, [projectLabels]);

  const loading = projectLoading || taskLoading;
  const readOnly = currentProject?.status === 'archived';
  const visibleTasks = filterTasks(tasks, filters, columns);

  // M8: First column id for FAB quick-add
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
  const firstColumnId = sortedColumns[0]?.id;

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
    <div className="space-y-4">
      {(projectError || taskError) && (
        <ErrorBanner message={projectError ?? taskError ?? 'Failed to load kanban data.'} />
      )}
      {readOnly && (
        <section className="glass border border-amber-500/20 bg-[rgba(245,158,11,0.08)] p-4">
          <div className="flex items-start gap-3">
            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300">
              <Lock size={16} />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300">
                // archived project
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                this board is read-only. filters and saved views still work, but edit flows are locked until you restore the project.
              </p>
            </div>
          </div>
        </section>
      )}
      {currentProject && (
        <>
          <LabelFilterBar
            testId="board-label-filter"
            labels={projectLabels}
            filters={filters}
            title="Board Slice"
            hint="focus the kanban lanes by label, priority and completion."
            emptyText="no project labels available"
            storageKey={`board:${currentProject.id}:task-filters`}
            onChange={setFilters}
          />
          <ProjectViewManager
            projectId={currentProject.id}
            filters={filters}
            onApply={setFilters}
            readOnly={readOnly}
          />
          <BulkTaskActions
            projectId={currentProject.id}
            tasks={visibleTasks}
            columns={columns}
            readOnly={readOnly}
          />
          <ProjectLabelManager
            projectId={currentProject.id}
            onLabelsChanged={setProjectLabels}
            readOnly={readOnly}
          />
        </>
      )}
      <KanbanBoard filters={filters} readOnly={readOnly} />
      <TaskDetailPanel />

      {/* M8: Floating Action Button — mobile only */}
      {!readOnly && firstColumnId && (
        <>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 0.3 }}
            onClick={() => setFabModalOpen(true)}
            className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full button-primary shadow-lg md:hidden"
            aria-label="Quick add task"
          >
            <Plus size={24} />
          </motion.button>
          {fabModalOpen && (
            <AddTaskModal
              columnId={firstColumnId}
              onClose={() => setFabModalOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

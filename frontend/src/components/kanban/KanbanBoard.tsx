/** Horizontal Kanban board with drag-and-drop powered by @dnd-kit */
import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { filterTasks } from '@/lib/taskFilters';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Column, Task, TaskFilterState } from '@/types';

interface KanbanBoardProps {
  filters: TaskFilterState;
  readOnly?: boolean;
}

export default function KanbanBoard({ filters, readOnly = false }: KanbanBoardProps) {
  const { columns, currentProject, createColumn, reorderColumns } = useProjectStore();
  const { tasks, moveTask, getTasksByColumn } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [creatingColumn, setCreatingColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const columnIds = useMemo(() => sortedColumns.map((c) => c.id), [sortedColumns]);
  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters, sortedColumns),
    [filters, sortedColumns, tasks]
  );
  const visibleTaskIds = useMemo(() => new Set(visibleTasks.map((task) => task.id)), [visibleTasks]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (readOnly) return;
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
        return;
      }
      const column = sortedColumns.find((item) => item.id === event.active.id);
      if (column) setActiveColumn(column);
    },
    [readOnly, tasks, sortedColumns]
  );

  const handleDragOver = useCallback(
    (_event: DragOverEvent) => {
      // Visual feedback is handled by dnd-kit automatically
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      setActiveColumn(null);
      if (readOnly) return;

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeTaskItem = tasks.find((t) => t.id === activeId);
      if (!activeTaskItem) {
        const activeColumnIndex = sortedColumns.findIndex((column) => column.id === activeId);
        const overColumnIndex = sortedColumns.findIndex((column) => column.id === overId);
        if (
          activeColumnIndex === -1 ||
          overColumnIndex === -1 ||
          activeColumnIndex === overColumnIndex ||
          !currentProject
        ) {
          return;
        }

        const reordered = [...columnIds];
        const [movedColumn] = reordered.splice(activeColumnIndex, 1);
        reordered.splice(overColumnIndex, 0, movedColumn);
        reorderColumns(currentProject.id, reordered);
        return;
      }

      // Determine target column: either a column id directly, or the column of the task we're over
      let targetColumnId: string;
      let targetPosition: number;

      const overColumn = sortedColumns.find((c) => c.id === overId);
      if (overColumn) {
        // Dropped on a column directly
        targetColumnId = overColumn.id;
        targetPosition = getTasksByColumn(overColumn.id).length;
      } else {
        // Dropped on another task
        const overTask = tasks.find((t) => t.id === overId);
        if (!overTask) return;
        targetColumnId = overTask.column_id;
        targetPosition = overTask.position;
      }

      if (activeTaskItem.column_id === targetColumnId && activeTaskItem.position === targetPosition) {
        return;
      }

      moveTask(activeId, { column_id: targetColumnId, position: targetPosition });
    },
    [readOnly, tasks, sortedColumns, moveTask, getTasksByColumn, currentProject, columnIds, reorderColumns]
  );

  const handleCreateColumn = async () => {
    if (!currentProject || !newColumnName.trim()) return;
    setCreatingColumn(true);
    try {
      await createColumn(currentProject.id, { name: newColumnName.trim() });
      setNewColumnName('');
      setShowAddColumn(false);
    } finally {
      setCreatingColumn(false);
    }
  };

  if (sortedColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No columns found. Create a project to get started.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 h-full overflow-x-auto pb-4">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {sortedColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={visibleTasks.filter((task) => task.column_id === column.id)}
              readOnly={readOnly}
            />
          ))}
        </SortableContext>
        {!readOnly && <div className="w-72 min-w-[288px] shrink-0">
          {showAddColumn ? (
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                // new column
              </p>
              <input
                value={newColumnName}
                onChange={(event) => setNewColumnName(event.target.value)}
                placeholder="column name"
                className="mt-3 w-full rounded-lg border border-[var(--glass-border-hot)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddColumn(false);
                    setNewColumnName('');
                  }}
                  className="flex-1 rounded-lg border border-[var(--glass-border)] px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--text-secondary)]"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateColumn}
                  disabled={!newColumnName.trim() || creatingColumn}
                  className="flex-1 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--bg-void)] disabled:opacity-50"
                >
                  {creatingColumn ? 'saving' : 'create'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddColumn(true)}
              className="group flex h-full min-h-[220px] w-full items-center justify-center rounded-xl border border-dashed border-[var(--glass-border-hot)] bg-[rgba(212,82,10,0.05)] p-6 text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-gold)]"
            >
              <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em]">
                <Plus size={16} className="text-[var(--accent-primary)] transition group-hover:rotate-90" />
                add column
              </span>
            </button>
          )}
        </div>}
      </div>

      <DragOverlay>
        {activeTask && visibleTaskIds.has(activeTask.id) && <KanbanCard task={activeTask} isOverlay />}
        {activeColumn && (
          <div className="glass w-72 rounded-xl border border-[var(--glass-border-hot)] p-4 shadow-[var(--glow-primary)]">
            <p className="font-display text-lg uppercase tracking-[0.14em] text-[var(--text-primary)]">
              {activeColumn.name}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

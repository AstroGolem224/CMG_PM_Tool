/** Horizontal Kanban board with drag-and-drop powered by @dnd-kit */
import { useCallback, useMemo } from 'react';
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
import { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';

export default function KanbanBoard() {
  const { columns } = useProjectStore();
  const { tasks, moveTask, getTasksByColumn } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  const columnIds = useMemo(() => sortedColumns.map((c) => c.id), [sortedColumns]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks]
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

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeTaskItem = tasks.find((t) => t.id === activeId);
      if (!activeTaskItem) return;

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
    [tasks, sortedColumns, moveTask, getTasksByColumn]
  );

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
            <KanbanColumn key={column.id} column={column} />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} isOverlay />}
      </DragOverlay>
    </DndContext>
  );
}

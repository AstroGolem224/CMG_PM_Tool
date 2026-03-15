/** Kanban column with droppable area and task list */
import { useMemo, useState, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import KanbanCard from './KanbanCard';
import AddTaskModal from './AddTaskModal';
import { useTaskStore } from '@/stores/taskStore';
import type { Column } from '@/types';

interface KanbanColumnProps {
  column: Column;
}

export default function KanbanColumn({ column }: KanbanColumnProps) {
  const { getTasksByColumn } = useTaskStore();
  const [showAddTask, setShowAddTask] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const columnTasks = useMemo(() => getTasksByColumn(column.id), [getTasksByColumn, column.id]);
  const taskIds = useMemo(() => columnTasks.map((t) => t.id), [columnTasks]);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const handleDoubleClick = useCallback(() => {
    setIsEditingName(true);
    setTimeout(() => nameRef.current?.focus(), 0);
  }, []);

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
  }, []);

  return (
    <div className="flex flex-col w-72 min-w-[288px] shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          {isEditingName ? (
            <input
              ref={nameRef}
              defaultValue={column.name}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
              className="bg-transparent text-white text-sm font-semibold border-b border-primary-500 outline-none px-1 py-0.5"
            />
          ) : (
            <h3
              onDoubleClick={handleDoubleClick}
              className="text-sm font-semibold text-white cursor-default select-none"
            >
              {column.name}
            </h3>
          )}
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="p-1 rounded text-gray-400 hover:text-primary-400 hover:bg-white/5 transition-colors"
          aria-label={`Add task to ${column.name}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Droppable task area */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 rounded-xl p-2 transition-colors min-h-[120px] ${
          isOver ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-white/[0.02]'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {columnTasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {columnTasks.length === 0 && !isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-20 text-gray-600 text-xs"
          >
            Drop tasks here
          </motion.div>
        )}
      </div>

      {/* Add task button at bottom */}
      <button
        onClick={() => setShowAddTask(true)}
        className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors text-sm"
      >
        <Plus size={14} />
        Add task
      </button>

      {/* Add task modal */}
      {showAddTask && (
        <AddTaskModal
          columnId={column.id}
          onClose={() => setShowAddTask(false)}
        />
      )}
    </div>
  );
}

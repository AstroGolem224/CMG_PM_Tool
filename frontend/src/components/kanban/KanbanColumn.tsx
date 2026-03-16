/** Kanban column with droppable area and task list */
import { useMemo, useState, useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCheck, GripVertical, PencilLine, Plus, Save, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import KanbanCard from './KanbanCard';
import AddTaskModal from './AddTaskModal';
import { useProjectStore } from '@/stores/projectStore';
import type { Column, Task } from '@/types';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  readOnly?: boolean;
}

export default function KanbanColumn({ column, tasks, readOnly = false }: KanbanColumnProps) {
  const { currentProject, updateColumn, deleteColumn } = useProjectStore();
  const [showAddTask, setShowAddTask] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(column.name);
  const nameRef = useRef<HTMLInputElement>(null);

  const columnTasks = useMemo(() => [...tasks].sort((a, b) => a.position - b.position), [tasks]);
  const taskIds = useMemo(() => columnTasks.map((t) => t.id), [columnTasks]);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDoubleClick = useCallback(() => {
    if (readOnly) return;
    setIsEditingName(true);
    setDraftName(column.name);
    setTimeout(() => nameRef.current?.focus(), 0);
  }, [column.name, readOnly]);

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false);
  }, []);

  const handleRename = async () => {
    if (!currentProject || !draftName.trim() || draftName.trim() === column.name) {
      setIsEditingName(false);
      setDraftName(column.name);
      return;
    }
    await updateColumn(currentProject.id, column.id, { name: draftName.trim() });
    setIsEditingName(false);
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    if (column.kind === 'done') {
      window.alert('move the done lane to another column before deleting this one');
      return;
    }
    if (columnTasks.length > 0) {
      window.alert('column must be empty before deletion');
      return;
    }
    if (!window.confirm(`Delete column "${column.name}"?`)) return;
    await deleteColumn(currentProject.id, column.id);
  };

  const handlePromoteDone = async () => {
    if (!currentProject || column.kind === 'done') return;
    await updateColumn(currentProject.id, column.id, { kind: 'done' });
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      data-testid={`kanban-column-${column.id}`}
      data-column-name={column.name}
      data-column-kind={column.kind}
      className={`bevel-panel flex w-72 min-w-[85vw] md:min-w-[288px] shrink-0 flex-col snap-center ${isDragging ? 'opacity-60' : ''}`}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={readOnly}
            className="rounded-lg p-1 text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Reorder ${column.name}`}
          >
            <GripVertical size={14} />
          </button>
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          {isEditingName ? (
            <div className="flex min-w-0 items-center gap-2">
              <input
                ref={nameRef}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleRename();
                  if (event.key === 'Escape') {
                    setDraftName(column.name);
                    setIsEditingName(false);
                  }
                }}
                className="min-w-0 bg-transparent text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--accent-primary)] outline-none px-1 py-0.5"
              />
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void handleRename()}
                className="rounded p-1 text-[var(--accent-primary)] transition hover:bg-white/5"
                aria-label={`Save ${column.name}`}
              >
                <Save size={13} />
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setDraftName(column.name);
                  setIsEditingName(false);
                }}
                className="rounded p-1 text-[var(--text-secondary)] transition hover:bg-white/5"
                aria-label={`Cancel rename ${column.name}`}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <h3
              onDoubleClick={handleDoubleClick}
              className="cursor-default select-none truncate font-display text-base uppercase tracking-[0.12em] text-[var(--text-primary)]"
            >
              {column.name}
            </h3>
          )}
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {columnTasks.length}
          </span>
          {column.kind === 'done' && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300">
              done lane
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {column.kind !== 'done' && (
            <button
              type="button"
              onClick={() => void handlePromoteDone()}
              disabled={readOnly}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-emerald-500/10 hover:text-emerald-300"
              aria-label={`Mark ${column.name} as done lane`}
            >
              <CheckCheck size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDoubleClick}
            disabled={readOnly}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Rename ${column.name}`}
          >
            <PencilLine size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={readOnly || column.kind === 'done'}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Delete ${column.name}`}
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            disabled={readOnly}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Add task to ${column.name}`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Droppable task area */}
      <div
        ref={setNodeRef}
        data-testid={`kanban-column-dropzone-${column.id}`}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl p-2 transition-colors ${
          isOver
            ? 'border border-[var(--glass-border-hot)] bg-[rgba(212,82,10,0.12)]'
            : 'border border-[var(--glass-border)] bg-[rgba(12,18,20,0.55)]'
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
            className="flex h-20 items-center justify-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]"
          >
            drop tasks here
          </motion.div>
        )}
      </div>

      {/* Add task button at bottom */}
      {!readOnly && (
        <button
          onClick={() => setShowAddTask(true)}
          className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--glass-border)] py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-gold)]"
        >
          <Plus size={14} />
          add task
        </button>
      )}

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

/** Draggable Kanban task card with priority badge and label dots */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, GripVertical } from 'lucide-react';
import { cn, priorityColors, formatDate, isOverdue, isUpcoming } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import type { Task } from '@/types';

interface KanbanCardProps {
  task: Task;
  isOverlay?: boolean;
}

export default function KanbanCard({ task, isOverlay = false }: KanbanCardProps) {
  const { setSelectedTask } = useTaskStore();
  const { setTaskDetailOpen } = useUIStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyle = priorityColors[task.priority];
  const overdue = isOverdue(task.deadline);
  const upcoming = isUpcoming(task.deadline);

  const handleClick = () => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={false}
      whileHover={isOverlay ? undefined : { scale: 1.02, y: -1 }}
      className={cn(
        'group glass rounded-lg p-3 cursor-pointer transition-all',
        isDragging && 'opacity-50',
        isOverlay && 'shadow-xl shadow-black/40 ring-2 ring-primary-500/40'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 rounded text-gray-600 opacity-0 group-hover:opacity-100 hover:text-gray-400 transition-opacity cursor-grab active:cursor-grabbing"
          aria-label="Drag task"
        >
          <GripVertical size={14} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-medium text-gray-200 mb-1.5 line-clamp-2">
            {task.title}
          </p>

          {/* Bottom row: priority + labels + deadline */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority badge */}
            <span
              className={cn(
                'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
                priorityStyle.bg,
                priorityStyle.text
              )}
            >
              {task.priority}
            </span>

            {/* Label dots */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex items-center gap-1">
                {task.labels.slice(0, 3).map((label) => (
                  <span
                    key={label.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                    title={label.name}
                  />
                ))}
                {task.labels.length > 3 && (
                  <span className="text-[10px] text-gray-500">+{task.labels.length - 3}</span>
                )}
              </div>
            )}

            {/* Deadline */}
            {task.deadline && (
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px] ml-auto',
                  overdue ? 'text-red-400' : upcoming ? 'text-amber-400' : 'text-gray-500'
                )}
              >
                <Calendar size={10} />
                {formatDate(task.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

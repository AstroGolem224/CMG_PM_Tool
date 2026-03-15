/** Label badges on a task with dropdown to add/remove */
import { useState, useEffect, useCallback } from 'react';
import { Plus, X as XIcon } from 'lucide-react';
import { labelsApi } from '@/api/labels';
import type { Label, Task } from '@/types';

interface TaskLabelsProps {
  task: Task;
  onUpdate: () => void;
}

export default function TaskLabels({ task, onUpdate }: TaskLabelsProps) {
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchLabels = useCallback(async () => {
    try {
      const labels = await labelsApi.listByProject(task.project_id);
      setProjectLabels(labels);
    } catch {
      // Silently fail for labels list
    }
  }, [task.project_id]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const assignedIds = new Set(task.labels?.map((l) => l.id) ?? []);
  const unassigned = projectLabels.filter((l) => !assignedIds.has(l.id));

  const handleAssign = async (labelId: string) => {
    try {
      await labelsApi.assignToTask(task.id, labelId);
      onUpdate();
    } catch {
      // Error handled elsewhere
    }
  };

  const handleRemove = async (labelId: string) => {
    try {
      await labelsApi.removeFromTask(task.id, labelId);
      onUpdate();
    } catch {
      // Error handled elsewhere
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">Labels</label>
      <div className="flex flex-wrap gap-2">
        {task.labels?.map((label) => (
          <span
            key={label.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: `${label.color}30`, color: label.color }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
            <button
              onClick={() => handleRemove(label.id)}
              className="ml-0.5 hover:opacity-70 transition-opacity"
              aria-label={`Remove ${label.name} label`}
            >
              <XIcon size={12} />
            </button>
          </span>
        ))}

        {/* Add label button */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Plus size={12} />
            Add
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 glass rounded-lg p-1 z-10 shadow-xl">
              {unassigned.length === 0 ? (
                <p className="text-xs text-gray-500 px-3 py-2">No labels available</p>
              ) : (
                unassigned.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      handleAssign(label.id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

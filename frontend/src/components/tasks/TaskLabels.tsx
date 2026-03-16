/** Label badges on a task with dropdown to add/remove */
import { useState, useEffect, useCallback } from 'react';
import { Plus, X as XIcon } from 'lucide-react';
import { labelsApi } from '@/api/labels';
import ErrorBanner from '@/components/common/ErrorBanner';
import type { Label, Task } from '@/types';

interface TaskLabelsProps {
  task: Task;
  onUpdate: () => void;
  disabled?: boolean;
}

export default function TaskLabels({ task, onUpdate, disabled = false }: TaskLabelsProps) {
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    try {
      const labels = await labelsApi.listByProject(task.project_id);
      setProjectLabels(labels);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [task.project_id]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    if (showDropdown) {
      void fetchLabels();
    }
  }, [fetchLabels, showDropdown]);

  const assignedIds = new Set(task.labels?.map((l) => l.id) ?? []);
  const unassigned = projectLabels.filter((l) => !assignedIds.has(l.id));

  const handleAssign = async (labelId: string) => {
    try {
      await labelsApi.assignToTask(task.id, labelId);
      setError(null);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRemove = async (labelId: string) => {
    try {
      await labelsApi.removeFromTask(task.id, labelId);
      setError(null);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
        Labels
      </label>
      {error && <ErrorBanner message={error} />}
      <div className="flex flex-wrap gap-2">
        {task.labels?.map((label) => (
          <span
            key={label.id}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${label.color}18`,
              color: label.color,
              borderColor: `${label.color}55`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
            <button
              onClick={() => handleRemove(label.id)}
              disabled={disabled}
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
            disabled={disabled}
            className="badge-shell flex items-center gap-1 rounded-full px-2.5 py-1"
          >
            <Plus size={12} />
            Add
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-full z-10 mt-1 w-48 glass p-1 shadow-xl">
              {unassigned.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No labels available</p>
              ) : (
                unassigned.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      handleAssign(label.id);
                      setShowDropdown(false);
                    }}
                    disabled={disabled}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-primary)] transition-colors hover:bg-white/10"
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

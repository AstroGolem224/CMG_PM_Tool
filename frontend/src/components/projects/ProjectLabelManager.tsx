import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, PencilLine, Plus, Save, Trash2, X } from 'lucide-react';
import { labelsApi } from '@/api/labels';
import ErrorBanner from '@/components/common/ErrorBanner';
import { colorPalette, cn } from '@/lib/utils';
import type { Label } from '@/types';

interface ProjectLabelManagerProps {
  projectId: string;
  onLabelsChanged?: (labels: Label[]) => void;
  readOnly?: boolean;
}

function sortLabels(labels: Label[]) {
  return [...labels].sort((left, right) => left.name.localeCompare(right.name));
}

export default function ProjectLabelManager({
  projectId,
  onLabelsChanged,
  readOnly = false,
}: ProjectLabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(colorPalette[2]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(colorPalette[0]);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await labelsApi.listByProject(projectId);
      const sorted = sortLabels(data);
      setLabels(sorted);
      onLabelsChanged?.(sorted);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchLabels();
  }, [fetchLabels]);

  const editingLabel = useMemo(
    () => labels.find((label) => label.id === editingId) ?? null,
    [editingId, labels]
  );

  const handleCreate = async () => {
    if (!draftName.trim()) return;
    setSaving(true);
    try {
      const created = await labelsApi.create({
        project_id: projectId,
        name: draftName.trim(),
        color: draftColor,
      });
      setLabels((current) => {
        const next = sortLabels([...current, created]);
        onLabelsChanged?.(next);
        return next;
      });
      setDraftName('');
      setDraftColor(colorPalette[2]);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = async () => {
    if (!editingLabel || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await labelsApi.update(editingLabel.id, {
        name: editName.trim(),
        color: editColor,
      });
      setLabels((current) => {
        const next = sortLabels(current.map((label) => (label.id === updated.id ? updated : label)));
        onLabelsChanged?.(next);
        return next;
      });
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (label: Label) => {
    if (!window.confirm(`Delete label "${label.name}"?`)) return;
    setSaving(true);
    try {
      await labelsApi.delete(label.id);
      setLabels((current) => {
        const next = current.filter((item) => item.id !== label.id);
        onLabelsChanged?.(next);
        return next;
      });
      if (editingId === label.id) setEditingId(null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="project-label-manager"
      className="glass p-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            // label forge
          </p>
          <h2 className="panel-heading mt-1 text-xl">Project Labels</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            create, rename and retire shared task labels.
          </p>
        </div>

        <div className="surface-subtle flex w-full max-w-xl flex-col gap-3 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              data-testid="project-label-create-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="label name"
              disabled={readOnly}
              className="control-shell rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={readOnly || !draftName.trim() || saving}
              className="button-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              Create Label
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {colorPalette.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDraftColor(color)}
                disabled={readOnly}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border transition',
                  draftColor === color
                    ? 'border-[var(--accent-gold)] ring-2 ring-[var(--glass-border-hot)]'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color} for new label`}
              >
                {draftColor === color && <Check size={14} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((item) => <div key={item} className="h-28 rounded-lg bg-white/5 animate-pulse" />)
        ) : labels.length === 0 ? (
          <div className="surface-subtle col-span-full p-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            no labels forged yet
          </div>
        ) : (
          labels.map((label) => {
            const isEditing = editingId === label.id;

            return (
              <div
                key={label.id}
                data-testid={`project-label-${label.id}`}
                className="surface-subtle flex flex-col gap-3 p-4"
              >
                {isEditing ? (
                  <>
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      placeholder="rename label"
                      disabled={readOnly}
                      className="control-shell rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          disabled={readOnly}
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-lg border transition',
                            editColor === color
                              ? 'border-[var(--accent-gold)] ring-2 ring-[var(--glass-border-hot)]'
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Select ${color} for ${label.name}`}
                        >
                          {editColor === color && <Check size={12} className="text-white" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveEdit()}
                        disabled={readOnly || !editName.trim() || saving}
                        className="button-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save size={14} />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="button-ghost flex items-center justify-center rounded-lg px-3 py-2"
                        aria-label={`Cancel editing ${label.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${label.color}18`,
                            borderColor: `${label.color}55`,
                            color: label.color,
                          }}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                          {label.name}
                        </span>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          project-wide label
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(label)}
                          disabled={readOnly}
                          className="button-ghost rounded-lg p-2"
                          aria-label={`Edit ${label.name}`}
                        >
                          <PencilLine size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(label)}
                          disabled={readOnly}
                          className="button-ghost rounded-lg p-2 text-[var(--neon-red)]"
                          aria-label={`Delete ${label.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.section>
  );
}

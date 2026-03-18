import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  PencilLine,
  Pin,
  PinOff,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { projectsApi } from '@/api/projects';
import CollapsiblePanel from '@/components/common/CollapsiblePanel';
import ErrorBanner from '@/components/common/ErrorBanner';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import type { ProjectView, TaskFilterState } from '@/types';

interface ProjectViewManagerProps {
  projectId: string;
  filters: TaskFilterState;
  onApply: (filters: TaskFilterState) => void;
  readOnly?: boolean;
}

const emptyFilters: TaskFilterState = {
  labelIds: [],
  priorities: [],
  completion: 'all',
};

function normalizeFilterState(filters: TaskFilterState): TaskFilterState {
  return {
    labelIds: [...filters.labelIds].sort(),
    priorities: [...filters.priorities].sort(),
    completion: filters.completion,
  };
}

function filtersEqual(left: TaskFilterState, right: TaskFilterState) {
  const normalizedLeft = normalizeFilterState(left);
  const normalizedRight = normalizeFilterState(right);
  return (
    normalizedLeft.completion === normalizedRight.completion &&
    normalizedLeft.labelIds.join('|') === normalizedRight.labelIds.join('|') &&
    normalizedLeft.priorities.join('|') === normalizedRight.priorities.join('|')
  );
}

function toFilterState(view: ProjectView): TaskFilterState {
  return normalizeFilterState({
    labelIds: view.label_ids,
    priorities: view.priorities,
    completion: view.completion,
  });
}

function sortViews(views: ProjectView[]) {
  return [...views].sort((left, right) => {
    if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;
    if (left.is_default !== right.is_default) return left.is_default ? -1 : 1;
    if (left.position !== right.position) return left.position - right.position;
    return right.updated_at.localeCompare(left.updated_at);
  });
}

function compactSummary(view: ProjectView) {
  return `${view.label_ids.length}l / ${view.priorities.length}p / ${view.completion}`;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function ProjectViewManager({
  projectId,
  filters,
  onApply,
  readOnly = false,
}: ProjectViewManagerProps) {
  const { pushToast, dismissToast, setBoardViewContext, clearBoardViewContext } = useUIStore();
  const [views, setViews] = useState<ProjectView[]>([]);
  const [draftName, setDraftName] = useState('');
  const [savePinned, setSavePinned] = useState(false);
  const [saveDefault, setSaveDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const bootstrappedProjectId = useRef<string | null>(null);
  const deleteTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      for (const timer of deleteTimers.current.values()) {
        window.clearTimeout(timer);
      }
      deleteTimers.current.clear();
      clearBoardViewContext();
    };
  }, [clearBoardViewContext]);

  useEffect(() => {
    bootstrappedProjectId.current = null;
    setSelectedViewId(null);
    setEditingId(null);
    setEditName('');
    setLoading(true);
    setError(null);

    projectsApi
      .listViews(projectId)
      .then((data) => {
        const sorted = sortViews(data);
        setViews(sorted);

        const defaultView = sorted.find((view) => view.is_default);
        if (
          defaultView &&
          bootstrappedProjectId.current !== projectId &&
          filtersEqual(filters, emptyFilters)
        ) {
          bootstrappedProjectId.current = projectId;
          setSelectedViewId(defaultView.id);
          onApply(toFilterState(defaultView));
          return;
        }

        setSelectedViewId((current) => (current && sorted.some((view) => view.id === current) ? current : null));
      })
      .catch(() => setError('saved views could not be loaded'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const activeViewId = useMemo(() => {
    if (selectedViewId && views.some((view) => view.id === selectedViewId)) {
      return selectedViewId;
    }
    const match = views.find((view) => filtersEqual(toFilterState(view), filters));
    return match?.id ?? null;
  }, [filters, selectedViewId, views]);

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) ?? null,
    [activeViewId, views]
  );

  useEffect(() => {
    const defaultView = views.find((view) => view.is_default) ?? null;
    setBoardViewContext({
      projectId,
      activeViewName: activeView?.name ?? null,
      defaultViewName: defaultView?.name ?? null,
    });
  }, [activeView, projectId, setBoardViewContext, views]);

  const pinnedViews = useMemo(
    () => views.filter((view) => view.is_pinned),
    [views]
  );

  const libraryViews = useMemo(
    () => views.filter((view) => !view.is_pinned),
    [views]
  );

  const saveCurrentView = async () => {
    if (!draftName.trim()) return;
    setError(null);
    try {
      const normalizedFilters = normalizeFilterState(filters);
      const view = await projectsApi.createView(projectId, {
        name: draftName.trim(),
        is_pinned: savePinned || saveDefault,
        is_default: saveDefault,
        label_ids: normalizedFilters.labelIds,
        priorities: normalizedFilters.priorities,
        completion: normalizedFilters.completion,
      });
      setViews((current) => sortViews([view, ...current.filter((item) => item.id !== view.id)]));
      setSelectedViewId(view.id);
      setDraftName('');
      setSavePinned(false);
      setSaveDefault(false);
      pushToast({
        tone: 'success',
        title: 'view saved',
        description: saveDefault
          ? `${view.name} is now the board default.`
          : `${view.name} was added to saved views.`,
      });
    } catch (err) {
      setError((err as Error).message || 'view could not be saved');
    }
  };

  const deleteView = async (viewId: string) => {
    if (readOnly) return;
    const queuedView = views.find((view) => view.id === viewId);
    if (!queuedView) return;

    setViews((current) => sortViews(current.filter((view) => view.id !== viewId)));
    setSelectedViewId((current) => (current === viewId ? null : current));
    setError(null);

    const toastId = pushToast(
      {
        tone: 'warning',
        title: `delete queued for ${queuedView.name}`,
        description: 'the view will be removed in 5 seconds unless you undo.',
        actionLabel: 'undo',
        onAction: () => {
          const timer = deleteTimers.current.get(queuedView.id);
          if (timer) {
            window.clearTimeout(timer);
            deleteTimers.current.delete(queuedView.id);
          }
          setViews((current) => sortViews([...current, queuedView]));
          pushToast({
            tone: 'info',
            title: 'view delete cancelled',
            description: `${queuedView.name} stayed in the library.`,
          });
        },
      },
      5000
    );

    const timerId = window.setTimeout(async () => {
      try {
        await projectsApi.deleteView(projectId, viewId);
        dismissToast(toastId);
        pushToast({
          tone: 'success',
          title: 'view deleted',
          description: `${queuedView.name} was removed from this board.`,
        });
      } catch (err) {
        setViews((current) => sortViews([...current, queuedView]));
        setError((err as Error).message || 'view could not be deleted');
        pushToast({
          tone: 'error',
          title: 'view delete failed',
          description: (err as Error).message || `${queuedView.name} could not be deleted.`,
        });
      } finally {
        deleteTimers.current.delete(queuedView.id);
      }
    }, 4500);

    deleteTimers.current.set(queuedView.id, timerId);
  };

  const startRename = (view: ProjectView) => {
    setEditingId(view.id);
    setEditName(view.name);
  };

  const saveRename = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      const updated = await projectsApi.updateView(projectId, editingId, { name: editName.trim() });
      setViews((current) => sortViews(current.map((view) => (view.id === updated.id ? updated : view))));
      setSelectedViewId(updated.id);
      setEditingId(null);
      setEditName('');
      setError(null);
      pushToast({
        tone: 'success',
        title: 'view renamed',
        description: `${updated.name} is ready.`,
      });
    } catch (err) {
      setError((err as Error).message || 'view could not be renamed');
    }
  };

  const overwriteActiveView = async () => {
    if (readOnly || !activeView) return;
    try {
      const normalizedFilters = normalizeFilterState(filters);
      const updated = await projectsApi.updateView(projectId, activeView.id, {
        label_ids: normalizedFilters.labelIds,
        priorities: normalizedFilters.priorities,
        completion: normalizedFilters.completion,
      });
      setViews((current) => sortViews(current.map((view) => (view.id === updated.id ? updated : view))));
      setSelectedViewId(updated.id);
      setError(null);
      pushToast({
        tone: 'success',
        title: 'view overwritten',
        description: `${updated.name} now matches the active filter slice.`,
      });
    } catch (err) {
      setError((err as Error).message || 'view could not be overwritten');
    }
  };

  const togglePinned = async (view: ProjectView) => {
    if (readOnly || view.is_default) return;
    try {
      const updated = await projectsApi.updateView(projectId, view.id, { is_pinned: !view.is_pinned });
      setViews((current) => sortViews(current.map((item) => (item.id === updated.id ? updated : item))));
      setError(null);
      pushToast({
        tone: 'success',
        title: updated.is_pinned ? 'view pinned' : 'view unpinned',
        description: `${updated.name} ${updated.is_pinned ? 'moved into' : 'left'} the pinned rail.`,
      });
    } catch (err) {
      setError((err as Error).message || 'view pin state could not be updated');
    }
  };

  const toggleDefault = async (view: ProjectView) => {
    if (readOnly) return;
    try {
      const updated = await projectsApi.updateView(projectId, view.id, {
        is_default: !view.is_default,
        is_pinned: true,
      });
      setViews((current) => sortViews(current.map((item) => (item.id === updated.id ? updated : item))));
      setSelectedViewId(updated.id);
      setError(null);
      pushToast({
        tone: 'success',
        title: updated.is_default ? 'default view set' : 'default view cleared',
        description: updated.is_default
          ? `${updated.name} now boots with the board.`
          : 'the board now opens without a forced preset.',
      });
    } catch (err) {
      setError((err as Error).message || 'default view could not be updated');
    }
  };

  const moveView = async (view: ProjectView, direction: -1 | 1) => {
    if (readOnly) return;
    const group = (view.is_pinned ? pinnedViews : libraryViews).map((item) => item.id);
    const currentIndex = group.indexOf(view.id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= group.length) return;

    const reorderedIds = moveItem(group, currentIndex, nextIndex);
    const reorderedViews = reorderedIds
      .map((id, index) => {
        const item = views.find((entry) => entry.id === id);
        return item ? { ...item, position: index } : null;
      })
      .filter((item): item is ProjectView => item !== null);

    setViews((current) => {
      const otherViews = current.filter((item) => item.is_pinned !== view.is_pinned);
      return sortViews([...otherViews, ...reorderedViews]);
    });

    try {
      await projectsApi.reorderViews(projectId, view.is_pinned, reorderedIds);
      pushToast({
        tone: 'success',
        title: 'view order updated',
        description: `${view.name} moved ${direction < 0 ? 'up' : 'down'} in the ${view.is_pinned ? 'pinned rail' : 'library'}.`,
      });
    } catch (err) {
      setError((err as Error).message || 'view order could not be updated');
      pushToast({
        tone: 'error',
        title: 'view order failed',
        description: (err as Error).message || 'the view order could not be saved.',
      });
      try {
        const data = await projectsApi.listViews(projectId);
        setViews(sortViews(data));
      } catch {
        // leave the error banner/toast as the user-visible signal
      }
    }
  };

  const renderViewCard = (view: ProjectView, featured = false, index = 0, groupSize = 1) => {
    const isActive = activeViewId === view.id;
    const isEditing = editingId === view.id;

    return (
      <article
        key={view.id}
        className={cn(
          featured ? 'glass p-4' : 'surface-subtle p-3',
          'space-y-3 border',
          isActive ? 'border-[var(--glass-border-hot)] shadow-[var(--glow-primary)]' : 'border-transparent'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  disabled={readOnly}
                  aria-label={`Rename ${view.name}`}
                  className="control-shell w-full rounded-lg px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => void saveRename()}
                  className="rounded-full p-2 text-[var(--accent-gold)]"
                  aria-label={`Save ${view.name}`}
                >
                  <Save size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setEditName('');
                  }}
                  className="rounded-full p-2 text-[var(--text-muted)]"
                  aria-label={`Cancel editing ${view.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedViewId(view.id);
                    onApply(toFilterState(view));
                  }}
                  aria-label={featured ? `Open pinned view ${view.name}` : view.name}
                  className="text-left"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    {featured ? '// pinned memory' : '// saved view'}
                  </p>
                  <h3 className="mt-1 truncate text-base font-semibold text-[var(--text-primary)]">
                    {view.name}
                  </h3>
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  {view.is_default && (
                    <span className="badge-shell inline-flex items-center gap-1 rounded-full px-2 py-1">
                      <Sparkles size={11} />
                      default
                    </span>
                  )}
                  {view.is_pinned && (
                    <span className="badge-shell inline-flex items-center gap-1 rounded-full px-2 py-1">
                      <Pin size={11} />
                      pinned
                    </span>
                  )}
                  <span className="badge-shell rounded-full px-2 py-1">{compactSummary(view)}</span>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void togglePinned(view)}
                disabled={readOnly || view.is_default}
                className="rounded-full p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:opacity-40"
                aria-label={view.is_pinned ? `Unpin view ${view.name}` : `Pin view ${view.name}`}
              >
                {view.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button
                type="button"
                onClick={() => void moveView(view, -1)}
                disabled={readOnly || index === 0}
                className="rounded-full p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:opacity-30"
                aria-label={`Move up view ${view.name}`}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => void moveView(view, 1)}
                disabled={readOnly || index === groupSize - 1}
                className="rounded-full p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)] disabled:opacity-30"
                aria-label={`Move down view ${view.name}`}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => void toggleDefault(view)}
                disabled={readOnly}
                className={cn(
                  'rounded-full p-2 transition',
                  view.is_default ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
                aria-label={view.is_default ? `Clear default ${view.name}` : `Set default ${view.name}`}
              >
                <Sparkles size={14} />
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => startRename(view)}
                  className="rounded-full p-2 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                  aria-label={`Rename view ${view.name}`}
                >
                  <PencilLine size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => void deleteView(view.id)}
                disabled={readOnly}
                className="rounded-full p-2 text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                aria-label={`Delete view ${view.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-secondary)]">
              {view.is_default
                ? 'loads automatically when this board opens'
                : 'manual memory for repeat board slices'}
            </p>
            {isActive && (
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-gold)]">
                active
              </span>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <section className="glass p-4">
      <CollapsiblePanel
        eyebrow="// saved views"
        title="Board Memories"
        description="pin the slices you reuse, and mark one default if this board should boot into a known state."
        storageKey={`board:${projectId}:saved-views`}
        contentClassName="mt-4"
      >
        <div className="grid gap-4">
          {error && <ErrorBanner message={error} />}
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
            <div className="bevel-panel p-4">
              <div className="flex flex-col gap-3">
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="view name"
                  disabled={readOnly}
                  className="control-shell rounded-lg px-3 py-2 text-sm outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSavePinned((current) => !current)}
                    disabled={readOnly}
                    aria-pressed={savePinned}
                    className={cn(
                      'button-ghost inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] disabled:opacity-50',
                      savePinned && 'border-[var(--glass-border-hot)] text-[var(--text-primary)]'
                    )}
                  >
                    <Pin size={13} />
                    pin on save
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSaveDefault((current) => {
                        const next = !current;
                        if (next) setSavePinned(true);
                        return next;
                      })
                    }
                    disabled={readOnly}
                    aria-pressed={saveDefault}
                    className={cn(
                      'button-ghost inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] disabled:opacity-50',
                      saveDefault && 'border-[var(--glass-border-hot)] text-[var(--accent-gold)]'
                    )}
                  >
                    <Sparkles size={13} />
                    load by default
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void saveCurrentView()}
                    disabled={readOnly || !draftName.trim()}
                    className="button-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <BookmarkPlus size={15} />
                    save current view
                  </button>
                  <button
                    type="button"
                    onClick={() => void overwriteActiveView()}
                    disabled={readOnly || !activeView}
                    className="button-secondary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <RefreshCcw size={15} />
                    overwrite active
                  </button>
                </div>
              </div>
            </div>

            <div className="surface-subtle p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                // status
              </p>
              <div className="mt-3 space-y-3 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <span>active memory</span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[var(--text-primary)]">
                    {activeView?.name ?? 'none'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>boot preset</span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[var(--accent-gold)]">
                    {views.find((view) => view.is_default)?.name ?? 'manual'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>pinned rail</span>
                  <span className="font-mono uppercase tracking-[0.18em] text-[var(--text-primary)]">
                    {pinnedViews.length}
                  </span>
                </div>
                <p className="border-t border-[var(--glass-border)] pt-3 text-xs leading-6 text-[var(--text-muted)]">
                  default views apply once when the board opens. pinned views stay at the top so recurring slices do not get buried.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="surface-subtle px-3 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                loading views
              </div>
            ) : views.length === 0 ? (
              <div className="surface-subtle px-3 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                no saved views yet
              </div>
            ) : (
              <>
                {pinnedViews.length > 0 && (
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                      // pinned rail
                    </p>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {pinnedViews.map((view, index) => renderViewCard(view, true, index, pinnedViews.length))}
                    </div>
                  </div>
                )}

                {libraryViews.length > 0 && (
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                      // library
                    </p>
                    <div className="mt-3 grid gap-3">
                      {libraryViews.map((view, index) => renderViewCard(view, false, index, libraryViews.length))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CollapsiblePanel>
    </section>
  );
}

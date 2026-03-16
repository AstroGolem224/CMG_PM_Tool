import type { Column, Task, TaskFilterState } from '@/types';

export function doneColumnIds(columns: Column[]) {
  return new Set(columns.filter((column) => column.kind === 'done').map((column) => column.id));
}

export function matchesTaskFilters(task: Task, filters: TaskFilterState, doneIds: Set<string>) {
  if (filters.labelIds.length > 0) {
    const taskLabelIds = new Set(task.labels?.map((label) => label.id) ?? []);
    if (!filters.labelIds.some((labelId) => taskLabelIds.has(labelId))) {
      return false;
    }
  }

  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
    return false;
  }

  if (filters.completion === 'done' && !doneIds.has(task.column_id)) {
    return false;
  }

  if (filters.completion === 'open' && doneIds.has(task.column_id)) {
    return false;
  }

  return true;
}

export function filterTasks(tasks: Task[], filters: TaskFilterState, columns: Column[]) {
  const doneIds = doneColumnIds(columns);
  return tasks.filter((task) => matchesTaskFilters(task, filters, doneIds));
}

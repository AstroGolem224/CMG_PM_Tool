/** Zustand store for task state management */
import { create } from 'zustand';
import type {
  BulkTaskActionPayload,
  CreateTaskPayload,
  MoveTaskPayload,
  Task,
  UpdateTaskPayload,
} from '@/types';
import { tasksApi } from '@/api/tasks';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;

  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (data: CreateTaskPayload) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskPayload) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, data: MoveTaskPayload) => Promise<void>;
  reorderTasks: (columnId: string, taskIds: string[]) => Promise<void>;
  bulkAction: (projectId: string, data: BulkTaskActionPayload) => Promise<number>;
  setSelectedTask: (task: Task | null) => void;
  replaceTask: (task: Task) => void;
  getTasksByColumn: (columnId: string) => Task[];

  /** Optimistically update task positions in local state */
  optimisticMove: (taskId: string, toColumnId: string, toPosition: number) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const tasks = await tasksApi.listByProject(projectId);
      set({ tasks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createTask: async (data) => {
    set({ error: null });
    try {
      const task = await tasksApi.create(data);
      set((state) => ({ tasks: [...state.tasks, task], error: null }));
      return task;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  updateTask: async (id, data) => {
    set({ error: null });
    try {
      const updated = await tasksApi.update(id, data);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        selectedTask: state.selectedTask?.id === id ? { ...state.selectedTask, ...updated } : state.selectedTask,
        error: null,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  deleteTask: async (id) => {
    set({ error: null });
    try {
      await tasksApi.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        error: null,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  moveTask: async (id, data) => {
    set({ error: null });
    get().optimisticMove(id, data.column_id, data.position);
    try {
      await tasksApi.move(id, data);
    } catch (e) {
      set({ error: (e as Error).message });
      // Refetch on failure to restore correct state
      const task = get().tasks.find((t) => t.id === id);
      if (task) {
        await get().fetchTasks(task.project_id);
      }
      throw e;
    }
  },

  reorderTasks: async (columnId, taskIds) => {
    set({ error: null });
    try {
      await tasksApi.reorder({ column_id: columnId, task_ids: taskIds });
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  bulkAction: async (projectId, data) => {
    set({ error: null });
    try {
      const result = await tasksApi.bulk(projectId, data);
      await get().fetchTasks(projectId);
      if (get().selectedTask && data.task_ids.includes(get().selectedTask!.id)) {
        set({ selectedTask: null });
      }
      return result.updated;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  setSelectedTask: (task) => set({ selectedTask: task }),

  replaceTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((item) => (item.id === task.id ? task : item)),
      selectedTask: state.selectedTask?.id === task.id ? task : state.selectedTask,
    })),

  getTasksByColumn: (columnId) => {
    return get()
      .tasks.filter((t) => t.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  },

  optimisticMove: (taskId, toColumnId, toPosition) => {
    set((state) => {
      const tasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, column_id: toColumnId, position: toPosition };
        }
        return t;
      });
      return { tasks };
    });
  },
}));

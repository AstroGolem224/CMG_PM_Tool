/** Zustand store for task state management */
import { create } from 'zustand';
import type { Task, CreateTaskPayload, UpdateTaskPayload, MoveTaskPayload } from '@/types';
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
  setSelectedTask: (task: Task | null) => void;
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
    const task = await tasksApi.create(data);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await tasksApi.update(id, data);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      selectedTask: state.selectedTask?.id === id ? { ...state.selectedTask, ...updated } : state.selectedTask,
    }));
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    }));
  },

  moveTask: async (id, data) => {
    get().optimisticMove(id, data.column_id, data.position);
    try {
      await tasksApi.move(id, data);
    } catch (e) {
      // Refetch on failure to restore correct state
      const task = get().tasks.find((t) => t.id === id);
      if (task) {
        await get().fetchTasks(task.project_id);
      }
    }
  },

  reorderTasks: async (columnId, taskIds) => {
    await tasksApi.reorder({ column_id: columnId, task_ids: taskIds });
  },

  setSelectedTask: (task) => set({ selectedTask: task }),

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

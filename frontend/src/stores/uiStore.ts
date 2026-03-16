/** Zustand store for UI state management */
import { create } from 'zustand';

type ModalType = 'createProject' | 'editProject' | 'addTask' | null;
export type ThemeMode = 'ember' | 'neon' | 'light';
export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface BoardViewContext {
  projectId: string | null;
  activeViewName: string | null;
  defaultViewName: string | null;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'ember';
  const stored = window.localStorage.getItem('cmg-theme');
  if (stored === 'ember' || stored === 'neon' || stored === 'light') {
    return stored;
  }
  return 'ember';
};

interface UIState {
  sidebarOpen: boolean;
  activeView: string;
  modalType: ModalType;
  modalData: Record<string, unknown>;
  taskDetailOpen: boolean;
  theme: ThemeMode;
  toasts: ToastItem[];
  boardViewContext: BoardViewContext;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setTaskDetailOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  pushToast: (toast: Omit<ToastItem, 'id'>, durationMs?: number) => string;
  dismissToast: (id: string) => void;
  setBoardViewContext: (context: BoardViewContext) => void;
  clearBoardViewContext: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeView: 'dashboard',
  modalType: null,
  modalData: {},
  taskDetailOpen: false,
  theme: getInitialTheme(),
  toasts: [],
  boardViewContext: {
    projectId: null,
    activeViewName: null,
    defaultViewName: null,
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
  openModal: (type, data = {}) => set({ modalType: type, modalData: data }),
  closeModal: () => set({ modalType: null, modalData: {} }),
  setTaskDetailOpen: (open) => set({ taskDetailOpen: open }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cmg-theme', theme);
    }
    set({ theme });
  },
  pushToast: (toast, durationMs = 4500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    if (durationMs > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        useUIStore.getState().dismissToast(id);
      }, durationMs);
    }
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  setBoardViewContext: (context) => set({ boardViewContext: context }),
  clearBoardViewContext: () =>
    set({
      boardViewContext: {
        projectId: null,
        activeViewName: null,
        defaultViewName: null,
      },
    }),
}));

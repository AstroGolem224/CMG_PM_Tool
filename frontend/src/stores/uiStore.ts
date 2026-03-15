/** Zustand store for UI state management */
import { create } from 'zustand';

type ModalType = 'createProject' | 'editProject' | 'addTask' | null;

interface UIState {
  sidebarOpen: boolean;
  activeView: string;
  modalType: ModalType;
  modalData: Record<string, unknown>;
  taskDetailOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setTaskDetailOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeView: 'dashboard',
  modalType: null,
  modalData: {},
  taskDetailOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
  openModal: (type, data = {}) => set({ modalType: type, modalData: data }),
  closeModal: () => set({ modalType: null, modalData: {} }),
  setTaskDetailOpen: (open) => set({ taskDetailOpen: open }),
}));

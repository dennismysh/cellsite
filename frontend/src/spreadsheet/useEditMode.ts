import { create } from "zustand";

interface EditModeState {
  enabled: boolean;
  toggle: () => void;
  set: (enabled: boolean) => void;
}

export const useEditMode = create<EditModeState>((set) => ({
  enabled: false,
  toggle: () => set((state) => ({ enabled: !state.enabled })),
  set: (enabled) => set({ enabled }),
}));

import { create } from "zustand";
import { DEFAULT_SHEET } from "@cellsite/shared";

interface CurrentSheetState {
  currentSheet: string;
  setCurrentSheet: (name: string) => void;
}

export const useCurrentSheet = create<CurrentSheetState>((set) => ({
  currentSheet: DEFAULT_SHEET,
  setCurrentSheet: (name) => set({ currentSheet: name }),
}));

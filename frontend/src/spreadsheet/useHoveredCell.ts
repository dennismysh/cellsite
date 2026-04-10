import { create } from "zustand";
import type { Cell } from "@cellsite/shared";

interface HoveredCellState {
  hovered: Cell | null;
  hoveredPosition: { row: number; col: number } | null;
  setHoveredCell: (cell: Cell | null) => void;
  setHoveredPosition: (pos: { row: number; col: number } | null) => void;
}

export const useHoveredCell = create<HoveredCellState>((set) => ({
  hovered: null,
  hoveredPosition: null,
  setHoveredCell: (hovered) => set({ hovered }),
  setHoveredPosition: (hoveredPosition) => set({ hoveredPosition }),
}));

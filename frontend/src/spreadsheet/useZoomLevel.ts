import { create } from "zustand";

export type ZoomPreset = "fit" | number;

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const DEFAULT_ZOOM: ZoomPreset = 1;

const STORAGE_KEY = "zoomLevel";

function isZoomPreset(value: unknown): value is ZoomPreset {
  if (value === "fit") return true;
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (ZOOM_LEVELS as readonly number[]).includes(value)
  );
}

function readStoredLevel(): ZoomPreset {
  if (typeof window === "undefined") return DEFAULT_ZOOM;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_ZOOM;
    if (raw === "fit") return "fit";
    const parsed = Number(raw);
    return isZoomPreset(parsed) ? parsed : DEFAULT_ZOOM;
  } catch {
    return DEFAULT_ZOOM;
  }
}

function writeStoredLevel(level: ZoomPreset) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      level === "fit" ? "fit" : String(level),
    );
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function nextPreset(current: ZoomPreset, direction: 1 | -1): number {
  const numeric = current === "fit" ? 1 : current;
  const idx = ZOOM_LEVELS.indexOf(numeric as (typeof ZOOM_LEVELS)[number]);
  if (idx === -1) return 1;
  const nextIdx = Math.max(
    0,
    Math.min(ZOOM_LEVELS.length - 1, idx + direction),
  );
  return ZOOM_LEVELS[nextIdx]!;
}

interface ZoomState {
  level: ZoomPreset;
  fitMultiplier: number;
  setLevel: (level: ZoomPreset) => void;
  setFitMultiplier: (m: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

export const useZoomLevel = create<ZoomState>((set, get) => ({
  level: readStoredLevel(),
  fitMultiplier: 1,
  setLevel: (level) => {
    writeStoredLevel(level);
    set({ level });
  },
  setFitMultiplier: (m) => {
    if (!Number.isFinite(m) || m <= 0) return;
    if (Math.abs(m - get().fitMultiplier) < 0.001) return;
    set({ fitMultiplier: m });
  },
  zoomIn: () => {
    const next = nextPreset(get().level, 1);
    writeStoredLevel(next);
    set({ level: next });
  },
  zoomOut: () => {
    const next = nextPreset(get().level, -1);
    writeStoredLevel(next);
    set({ level: next });
  },
  reset: () => {
    writeStoredLevel(1);
    set({ level: 1 });
  },
}));

export function effectiveZoom(state: ZoomState): number {
  return state.level === "fit" ? state.fitMultiplier : state.level;
}

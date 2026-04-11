import { ThemeToggle } from "../theme/ThemeToggle.js";
import { useEditMode } from "./useEditMode.js";
import {
  ZOOM_LEVELS,
  useZoomLevel,
  type ZoomPreset,
} from "./useZoomLevel.js";

const NAV_TABS = ["Home", "Content", "About", "Contact"] as const;

function parseZoomSelectValue(value: string): ZoomPreset {
  if (value === "fit") return "fit";
  const n = Number(value);
  return Number.isFinite(n) ? n : 1;
}

function zoomOptionLabel(level: number): string {
  return `${Math.round(level * 100)}%`;
}

export function Ribbon() {
  const editMode = useEditMode();
  const zoomLevel = useZoomLevel((s) => s.level);
  const setZoomLevel = useZoomLevel((s) => s.setLevel);
  const zoomIn = useZoomLevel((s) => s.zoomIn);
  const zoomOut = useZoomLevel((s) => s.zoomOut);

  const selectValue = zoomLevel === "fit" ? "fit" : String(zoomLevel);
  const stepButtonClass =
    "hidden sm:flex shrink-0 w-7 h-7 items-center justify-center rounded border border-border text-xs text-text-muted hover:text-text transition-colors";

  return (
    <header className="flex items-center gap-2 sm:gap-4 bg-surface border-b border-border px-2 sm:px-4 py-2 text-sm">
      <span className="font-jp font-semibold text-accent text-base shrink-0">
        セルサイト
      </span>
      <nav className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
        {NAV_TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`px-3 py-1 transition-colors ${
              i === 0
                ? "text-text border-b-2 border-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          className={stepButtonClass}
        >
          −
        </button>
        <select
          aria-label="Zoom level"
          value={selectValue}
          onChange={(e) => setZoomLevel(parseZoomSelectValue(e.target.value))}
          className="shrink-0 px-2 py-1 rounded border border-border bg-muted text-text-muted text-xs hover:text-text transition-colors"
        >
          <option value="fit">Fit</option>
          {ZOOM_LEVELS.map((level) => (
            <option key={level} value={String(level)}>
              {zoomOptionLabel(level)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          className={stepButtonClass}
        >
          +
        </button>
      </div>
      <ThemeToggle />
      <button
        type="button"
        onClick={editMode.toggle}
        className={`shrink-0 px-3 py-1 rounded border border-border text-xs transition-colors ${
          editMode.enabled
            ? "bg-accent text-base"
            : "bg-muted text-text-muted hover:text-text"
        }`}
      >
        {editMode.enabled ? "Exit Edit Mode" : "Edit"}
      </button>
    </header>
  );
}

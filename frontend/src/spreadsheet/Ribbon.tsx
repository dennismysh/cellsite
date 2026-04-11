import { ThemeToggle } from "../theme/ThemeToggle.js";
import { useEditMode } from "./useEditMode.js";

const NAV_TABS = ["Home", "Content", "About", "Contact"] as const;

export function Ribbon() {
  const editMode = useEditMode();

  return (
    <header className="flex items-center gap-4 bg-surface border-b border-border px-4 py-2 text-sm">
      <span className="font-jp font-semibold text-accent text-base">
        セルサイト
      </span>
      <nav className="flex gap-1 flex-1">
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
      <ThemeToggle />
      <button
        type="button"
        onClick={editMode.toggle}
        className={`px-3 py-1 rounded border border-border text-xs transition-colors ${
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

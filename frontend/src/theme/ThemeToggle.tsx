import { useThemeStore, type ThemeMode } from "./useThemeStore.js";

const LABELS: Record<ThemeMode, { icon: string; label: string }> = {
  light: { icon: "☀️", label: "Light" },
  dark: { icon: "🌙", label: "Dark" },
  system: { icon: "🖥️", label: "System" },
};

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const cycle = useThemeStore((s) => s.cycle);
  const { icon, label } = LABELS[mode];
  const description = `Theme: ${label}. Click to change.`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={description}
      title={description}
      className="shrink-0 px-3 py-1 rounded border border-border text-xs bg-muted text-text-muted hover:text-text transition-colors"
    >
      <span aria-hidden="true">{icon}</span> {label}
    </button>
  );
}

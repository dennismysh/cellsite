import { useHoveredCell } from "./useHoveredCell.js";
import { cellRef } from "./cellRef.js";

export function FormulaBar() {
  const { hovered, hoveredPosition } = useHoveredCell();
  const ref = hoveredPosition
    ? cellRef(hoveredPosition.row, hoveredPosition.col)
    : "—";

  const display = hovered
    ? `${hovered.title}${hovered.subtitleJa ? ` — ${hovered.subtitleJa}` : ""}`
    : "";

  return (
    <div className="flex items-center gap-2 bg-muted border-b border-border px-3 py-1 text-xs font-mono">
      <span className="inline-block min-w-[2.5rem] bg-surface border border-border rounded-sm px-2 py-[1px] text-accent text-center">
        {ref}
      </span>
      <span className="text-text-muted italic px-1">fx</span>
      <span className="text-text-muted flex-1 truncate">{display}</span>
    </div>
  );
}

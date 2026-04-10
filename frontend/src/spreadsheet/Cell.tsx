import type { Cell as CellData, CellType } from "@cellsite/shared";
import { useEditMode } from "./useEditMode.js";

interface CellProps {
  cell: CellData;
  onClick: (cell: CellData) => void;
  onHover: (cell: CellData | null) => void;
  onDoubleClick?: (cell: CellData) => void;
}

const ACCENT_CLASS: Record<CellType, string> = {
  blog: "text-accent-blog",
  gallery: "text-accent-gallery",
  audio: "text-accent-audio",
  document: "text-accent-document",
  presentation: "text-accent-presentation",
  external: "text-accent-external",
};

const GRADIENT_CLASS: Record<CellType, string> = {
  blog: "bg-gradient-to-br from-[rgb(var(--color-accent-blog)/0.08)] to-transparent",
  gallery: "bg-gradient-to-br from-[rgb(var(--color-accent-gallery)/0.08)] to-transparent",
  audio: "bg-gradient-to-br from-[rgb(var(--color-accent-audio)/0.08)] to-transparent",
  document: "bg-gradient-to-br from-[rgb(var(--color-accent-document)/0.08)] to-transparent",
  presentation: "bg-gradient-to-br from-[rgb(var(--color-accent-presentation)/0.08)] to-transparent",
  external: "bg-gradient-to-br from-[rgb(var(--color-accent-external)/0.08)] to-transparent",
};

export function Cell({ cell, onClick, onHover, onDoubleClick }: CellProps) {
  const editMode = useEditMode();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(cell)}
      onDoubleClick={() => onDoubleClick?.(cell)}
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick(cell);
      }}
      className={`
        border-r border-b border-border cursor-pointer
        flex flex-col items-center justify-center text-center
        px-2 py-3 min-h-[90px]
        ${GRADIENT_CLASS[cell.type]}
        ${editMode.enabled ? "outline-dashed outline-1 outline-accent/50" : ""}
        hover:brightness-110 transition-all
      `}
      style={{
        gridColumn: `span ${cell.colSpan}`,
        gridRow: `span ${cell.rowSpan}`,
      }}
      data-cell-id={cell.id}
    >
      <div className="text-xl mb-1 opacity-90">{cell.icon}</div>
      <div className={`font-medium ${ACCENT_CLASS[cell.type]}`}>
        {cell.title}
      </div>
      {cell.subtitleJa && (
        <div className="text-[10px] text-text-muted mt-0.5 font-jp">
          {cell.subtitleJa}
        </div>
      )}
    </div>
  );
}

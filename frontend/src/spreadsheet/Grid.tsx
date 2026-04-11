import type { Cell as CellData } from "@cellsite/shared";
import { Cell } from "./Cell.js";
import { colLetter } from "./cellRef.js";
import { useEditMode } from "./useEditMode.js";
import { effectiveZoom, useZoomLevel } from "./useZoomLevel.js";

interface GridProps {
  cells: CellData[];
  cols: number;
  rows: number;
  onCellClick: (cell: CellData) => void;
  onCellDoubleClick?: (cell: CellData) => void;
  onCellHover: (cell: CellData | null, pos: { row: number; col: number } | null) => void;
  onEmptyDoubleClick: (row: number, col: number) => void;
  onCellDragStart?: (cell: CellData) => void;
  onCellDragEnd?: () => void;
  onCellDropOnPosition?: (row: number, col: number) => void;
}

export function Grid({
  cells,
  cols,
  rows,
  onCellClick,
  onCellDoubleClick,
  onCellHover,
  onEmptyDoubleClick,
  onCellDragStart,
  onCellDragEnd,
  onCellDropOnPosition,
}: GridProps) {
  const editMode = useEditMode();
  const zoom = useZoomLevel(effectiveZoom);

  const occupied = new Map<string, CellData>();
  const topLeft = new Map<string, CellData>();
  for (const cell of cells) {
    topLeft.set(`${cell.row},${cell.col}`, cell);
    for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
      for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
        occupied.set(`${r},${c}`, cell);
      }
    }
  }

  // Use Math.floor for colMin so a fit-zoom multiplier computed from the
  // container width never rounds up and overflows the container.
  const colMin = Math.max(20, Math.floor(120 * zoom));
  const rowMin = Math.max(24, Math.round(90 * zoom));
  const gridTemplateColumns = `32px repeat(${cols}, minmax(${colMin}px, 1fr))`;

  const gridChildren: JSX.Element[] = [];

  gridChildren.push(
    <div
      key="corner"
      className="bg-surface border-r border-b border-border sticky top-0 left-0 z-20 h-7"
    />,
  );
  for (let c = 0; c < cols; c++) {
    gridChildren.push(
      <div
        key={`col-${c}`}
        role="columnheader"
        aria-label={`Column ${colLetter(c)}`}
        className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky top-0 z-10 h-7 flex items-center justify-center"
      >
        {colLetter(c)}
      </div>,
    );
  }

  for (let r = 0; r < rows; r++) {
    gridChildren.push(
      <div
        key={`rownum-${r}`}
        role="rowheader"
        aria-label={`Row ${r + 1}`}
        className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky left-0 z-10 flex items-center justify-center"
      >
        {r + 1}
      </div>,
    );

    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const occ = occupied.get(key);
      if (occ && topLeft.get(key) === occ) {
        gridChildren.push(
          <Cell
            key={`cell-${occ.id}`}
            cell={occ}
            onClick={onCellClick}
            onDoubleClick={onCellDoubleClick}
            onDragStart={onCellDragStart}
            onDragEnd={onCellDragEnd}
            onHover={(hoveredCell) =>
              onCellHover(
                hoveredCell,
                hoveredCell
                  ? { row: hoveredCell.row, col: hoveredCell.col }
                  : null,
              )
            }
          />,
        );
      } else if (!occ) {
        gridChildren.push(
          <div
            key={`empty-${r}-${c}`}
            className={`
              border-r border-b border-border bg-muted
              ${editMode.enabled ? "outline-dashed outline-1 outline-border cursor-cell" : ""}
            `}
            style={{ minHeight: rowMin }}
            onMouseEnter={() => onCellHover(null, { row: r, col: c })}
            onMouseLeave={() => onCellHover(null, null)}
            onDoubleClick={() => editMode.enabled && onEmptyDoubleClick(r, c)}
            onDragOver={(e) => {
              if (editMode.enabled) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (editMode.enabled) onCellDropOnPosition?.(r, c);
            }}
            data-row={r}
            data-col={c}
          />,
        );
      }
    }
  }

  return (
    <div
      className="grid min-w-max"
      style={{
        gridTemplateColumns,
        gridTemplateRows: "28px",
        gridAutoRows: `minmax(${rowMin}px, auto)`,
      }}
    >
      {gridChildren}
    </div>
  );
}

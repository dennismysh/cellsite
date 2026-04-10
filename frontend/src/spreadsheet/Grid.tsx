import type { Cell as CellData } from "@cellsite/shared";
import { Cell } from "./Cell.js";
import { colLetter } from "./cellRef.js";
import { useEditMode } from "./useEditMode.js";

interface GridProps {
  cells: CellData[];
  cols: number;
  rows: number;
  onCellClick: (cell: CellData) => void;
  onCellDoubleClick?: (cell: CellData) => void;
  onCellHover: (cell: CellData | null, pos: { row: number; col: number } | null) => void;
  onEmptyDoubleClick: (row: number, col: number) => void;
}

export function Grid({
  cells,
  cols,
  rows,
  onCellClick,
  onCellDoubleClick,
  onCellHover,
  onEmptyDoubleClick,
}: GridProps) {
  const editMode = useEditMode();

  // Build a map of (row,col) → cell to cover its full span
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

  const gridTemplateColumns = `32px repeat(${cols}, minmax(120px, 1fr))`;

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns,
          gridAutoRows: "minmax(90px, auto)",
        }}
      >
        {/* Empty corner */}
        <div className="bg-surface border-r border-b border-border sticky top-0 left-0 z-20 h-7" />

        {/* Column headers */}
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={`col-${c}`}
            className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky top-0 z-10 h-7 flex items-center justify-center"
          >
            {colLetter(c)}
          </div>
        ))}

        {/* Rows */}
        {Array.from({ length: rows }, (_, r) => (
          <RowContent
            key={`row-${r}`}
            row={r}
            cols={cols}
            occupied={occupied}
            topLeft={topLeft}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            onCellHover={onCellHover}
            onEmptyDoubleClick={onEmptyDoubleClick}
            editModeEnabled={editMode.enabled}
          />
        ))}
      </div>
    </div>
  );
}

interface RowContentProps {
  row: number;
  cols: number;
  occupied: Map<string, CellData>;
  topLeft: Map<string, CellData>;
  onCellClick: (cell: CellData) => void;
  onCellDoubleClick?: (cell: CellData) => void;
  onCellHover: (cell: CellData | null, pos: { row: number; col: number } | null) => void;
  onEmptyDoubleClick: (row: number, col: number) => void;
  editModeEnabled: boolean;
}

function RowContent({
  row,
  cols,
  occupied,
  topLeft,
  onCellClick,
  onCellDoubleClick,
  onCellHover,
  onEmptyDoubleClick,
  editModeEnabled,
}: RowContentProps) {
  const elements: JSX.Element[] = [];

  // Row number
  elements.push(
    <div
      key={`rownum-${row}`}
      className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky left-0 z-10 flex items-center justify-center"
    >
      {row + 1}
    </div>,
  );

  for (let c = 0; c < cols; c++) {
    const key = `${row},${c}`;
    const occ = occupied.get(key);
    if (occ && topLeft.get(key) === occ) {
      elements.push(
        <Cell
          key={`cell-${occ.id}`}
          cell={occ}
          onClick={onCellClick}
          onDoubleClick={onCellDoubleClick}
          onHover={(c) => onCellHover(c, { row, col: c?.col ?? 0 })}
        />,
      );
    } else if (!occ) {
      elements.push(
        <div
          key={`empty-${row}-${c}`}
          className={`
            border-r border-b border-border bg-muted min-h-[90px]
            ${editModeEnabled ? "outline-dashed outline-1 outline-border cursor-cell" : ""}
          `}
          onMouseEnter={() => onCellHover(null, { row, col: c })}
          onMouseLeave={() => onCellHover(null, null)}
          onDoubleClick={() => editModeEnabled && onEmptyDoubleClick(row, c)}
          data-row={row}
          data-col={c}
        />,
      );
    }
    // If occupied but not top-left, skip (already spanned)
  }

  return <>{elements}</>;
}

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
        style={{ gridTemplateColumns, gridAutoRows: "minmax(90px, auto)" }}
      >
        <div className="bg-surface border-r border-b border-border sticky top-0 left-0 z-20 h-7" />
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={`col-${c}`}
            className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky top-0 z-10 h-7 flex items-center justify-center"
          >
            {colLetter(c)}
          </div>
        ))}

        {Array.from({ length: rows }, (_, r) => {
          const elements: JSX.Element[] = [];
          elements.push(
            <div
              key={`rownum-${r}`}
              className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky left-0 z-10 flex items-center justify-center"
            >
              {r + 1}
            </div>,
          );

          for (let c = 0; c < cols; c++) {
            const key = `${r},${c}`;
            const occ = occupied.get(key);
            if (occ && topLeft.get(key) === occ) {
              elements.push(
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
              elements.push(
                <div
                  key={`empty-${r}-${c}`}
                  className={`
                    border-r border-b border-border bg-muted min-h-[90px]
                    ${editMode.enabled ? "outline-dashed outline-1 outline-border cursor-cell" : ""}
                  `}
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
          return <div key={`row-${r}`} style={{ display: "contents" }}>{elements}</div>;
        })}
      </div>
    </div>
  );
}

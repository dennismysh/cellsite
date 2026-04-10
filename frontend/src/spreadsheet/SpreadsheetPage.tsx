import { useQuery } from "@tanstack/react-query";
import { cellsApi } from "../lib/cells.js";
import { DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS } from "@cellsite/shared";
import { Ribbon } from "./Ribbon.js";
import { FormulaBar } from "./FormulaBar.js";
import { SheetTabs } from "./SheetTabs.js";
import { Grid } from "./Grid.js";
import { useHoveredCell } from "./useHoveredCell.js";
import type { Cell } from "@cellsite/shared";

export function SpreadsheetPage() {
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", "creative"],
    queryFn: () => cellsApi.list("creative"),
  });

  const handleCellClick = (cell: Cell) => {
    // Placeholder — expand-in-place comes in Task 23
    console.log("clicked cell", cell);
  };

  const handleCellHover = (
    cell: Cell | null,
    pos: { row: number; col: number } | null,
  ) => {
    setHoveredCell(cell);
    setHoveredPosition(pos);
  };

  const handleEmptyDoubleClick = (row: number, col: number) => {
    // Wired in Task 26
    console.log("empty double-click", row, col);
  };

  return (
    <div className="flex flex-col h-screen bg-base text-text">
      <Ribbon />
      <FormulaBar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading grid…
        </div>
      ) : (
        <Grid
          cells={cells}
          cols={DEFAULT_GRID_COLS}
          rows={DEFAULT_GRID_ROWS}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
          onEmptyDoubleClick={handleEmptyDoubleClick}
        />
      )}
      <SheetTabs />
    </div>
  );
}

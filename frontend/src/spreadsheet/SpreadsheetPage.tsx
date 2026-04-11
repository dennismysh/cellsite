import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { cellsApi } from "../lib/cells.js";
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
} from "@cellsite/shared";
import type { Cell, CellCreateInput } from "@cellsite/shared";
import { Ribbon } from "./Ribbon.js";
import { FormulaBar } from "./FormulaBar.js";
import { SheetTabs } from "./SheetTabs.js";
import { Grid } from "./Grid.js";
import { ExpandedCell } from "./ExpandedCell.js";
import { CellConfigPopover } from "../editors/CellConfigPopover.js";
import { useHoveredCell } from "./useHoveredCell.js";
import { useEditMode } from "./useEditMode.js";
import { useCurrentSheet } from "./useCurrentSheet.js";
import { useZoomLevel } from "./useZoomLevel.js";

// Matches the hard-coded values in Grid.tsx's grid template.
const ROW_HEADER_PX = 32;
const BASE_COL_PX = 120;
const MIN_FIT_MULTIPLIER = 0.25;

type PopoverState =
  | { mode: "create"; position: { row: number; col: number } }
  | { mode: "edit"; cell: Cell }
  | null;

function canDropAt(
  cells: Cell[],
  dragged: Cell,
  targetRow: number,
  targetCol: number,
): boolean {
  // All positions the dragged cell would occupy at the target
  for (let r = targetRow; r < targetRow + dragged.rowSpan; r++) {
    for (let c = targetCol; c < targetCol + dragged.colSpan; c++) {
      for (const other of cells) {
        if (other.id === dragged.id) continue;
        const otherEndRow = other.row + other.rowSpan - 1;
        const otherEndCol = other.col + other.colSpan - 1;
        if (
          r >= other.row &&
          r <= otherEndRow &&
          c >= other.col &&
          c <= otherEndCol
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

export function SpreadsheetPage() {
  const [expanded, setExpanded] = useState<Cell | null>(null);
  const [popover, setPopover] = useState<PopoverState>(null);
  const draggedCell = useRef<Cell | null>(null);
  const [scrollContainer, setScrollContainer] =
    useState<HTMLDivElement | null>(null);
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();
  const editMode = useEditMode();
  const currentSheet = useCurrentSheet((s) => s.currentSheet);
  const queryClient = useQueryClient();

  // Callback ref so we rewire the ResizeObserver whenever the scroll
  // container mounts or unmounts (e.g., while the grid toggles loading).
  const scrollContainerRef = useCallback((el: HTMLDivElement | null) => {
    setScrollContainer(el);
  }, []);

  // Keep the "fit" zoom multiplier in sync with the scroll container size
  // so that when level === "fit", all columns collapse to fit the viewport.
  useEffect(() => {
    if (!scrollContainer) return;
    const cols = DEFAULT_GRID_COLS;
    const update = () => {
      const width = scrollContainer.clientWidth;
      if (width <= 0) return;
      const raw = (width - ROW_HEADER_PX) / (cols * BASE_COL_PX);
      const clamped = Math.max(MIN_FIT_MULTIPLIER, Math.min(1, raw));
      useZoomLevel.getState().setFitMultiplier(clamped);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(scrollContainer);
    return () => observer.disconnect();
  }, [scrollContainer]);

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", currentSheet],
    queryFn: () => cellsApi.list(currentSheet),
  });

  const createMutation = useMutation({
    mutationFn: (input: CellCreateInput) =>
      cellsApi.create({ ...input, sheet: currentSheet }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", currentSheet] });
      setPopover(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CellCreateInput }) =>
      cellsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", currentSheet] });
      setPopover(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cellsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", currentSheet] });
      setPopover(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, row, col }: { id: string; row: number; col: number }) =>
      cellsApi.update(id, { row, col }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", currentSheet] });
    },
  });

  const handleCellClick = (cell: Cell) => {
    if (editMode.enabled) return;
    setExpanded(cell);
  };

  const handleCellDoubleClick = (cell: Cell) => {
    if (!editMode.enabled) return;
    setPopover({ mode: "edit", cell });
  };

  const handleEmptyDoubleClick = (row: number, col: number) => {
    if (!editMode.enabled) return;
    setPopover({ mode: "create", position: { row, col } });
  };

  const handleCellHover = (
    cell: Cell | null,
    pos: { row: number; col: number } | null,
  ) => {
    setHoveredCell(cell);
    setHoveredPosition(pos);
  };

  const handleOpen = (cell: Cell) => {
    if (cell.type === "external" && cell.externalUrl) {
      window.open(cell.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSave = (input: CellCreateInput) => {
    if (popover?.mode === "edit") {
      updateMutation.mutate({ id: popover.cell.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  const handleDelete = () => {
    if (popover?.mode === "edit") {
      deleteMutation.mutate(popover.cell.id);
    }
  };

  const handleDragStart = (cell: Cell) => {
    draggedCell.current = cell;
  };

  const handleDragEnd = () => {
    draggedCell.current = null;
  };

  const handleDropOnPosition = (row: number, col: number) => {
    const dragged = draggedCell.current;
    if (!dragged) return;
    if (!canDropAt(cells, dragged, row, col)) return;
    moveMutation.mutate({ id: dragged.id, row, col });
    draggedCell.current = null;
  };

  return (
    <div className="flex flex-col h-dvh bg-base text-text">
      <Ribbon />
      <FormulaBar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading grid…
        </div>
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-auto">
          <Grid
            key={currentSheet}
            cells={cells}
            cols={DEFAULT_GRID_COLS}
            rows={DEFAULT_GRID_ROWS}
            onCellClick={handleCellClick}
            onCellDoubleClick={handleCellDoubleClick}
            onCellHover={handleCellHover}
            onEmptyDoubleClick={handleEmptyDoubleClick}
            onCellDragStart={handleDragStart}
            onCellDragEnd={handleDragEnd}
            onCellDropOnPosition={handleDropOnPosition}
          />
        </div>
      )}
      <SheetTabs />
      {expanded && (
        <ExpandedCell
          cell={expanded}
          onClose={() => setExpanded(null)}
          onOpen={handleOpen}
        />
      )}
      {popover?.mode === "create" && (
        <CellConfigPopover
          position={popover.position}
          onSave={handleSave}
          onCancel={() => setPopover(null)}
        />
      )}
      {popover?.mode === "edit" && (
        <CellConfigPopover
          position={{ row: popover.cell.row, col: popover.cell.col }}
          cell={popover.cell}
          onSave={handleSave}
          onCancel={() => setPopover(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

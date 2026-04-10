import { useState } from "react";
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

type PopoverState =
  | { mode: "create"; position: { row: number; col: number } }
  | { mode: "edit"; cell: Cell }
  | null;

export function SpreadsheetPage() {
  const [expanded, setExpanded] = useState<Cell | null>(null);
  const [popover, setPopover] = useState<PopoverState>(null);
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();
  const editMode = useEditMode();
  const queryClient = useQueryClient();

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", "creative"],
    queryFn: () => cellsApi.list("creative"),
  });

  const createMutation = useMutation({
    mutationFn: (input: CellCreateInput) => cellsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CellCreateInput }) =>
      cellsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cellsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
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
          onCellDoubleClick={handleCellDoubleClick}
          onCellHover={handleCellHover}
          onEmptyDoubleClick={handleEmptyDoubleClick}
        />
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

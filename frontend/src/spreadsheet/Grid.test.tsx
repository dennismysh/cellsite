import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "./Grid.js";
import type { Cell } from "@cellsite/shared";

function makeCell(row: number, col: number, title: string): Cell {
  return {
    id: `cell-${row}-${col}`,
    sheet: "creative",
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
    type: "external",
    title,
    subtitleJa: null,
    icon: "⭐",
    targetId: null,
    targetTable: null,
    externalUrl: "https://example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Grid", () => {
  it("renders column headers A through J by default", () => {
    render(
      <Grid
        cells={[]}
        cols={10}
        rows={5}
        onCellClick={() => {}}
        onCellHover={() => {}}
        onEmptyDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders row numbers 1 through rows count", () => {
    render(
      <Grid
        cells={[]}
        cols={5}
        rows={3}
        onCellClick={() => {}}
        onCellHover={() => {}}
        onEmptyDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders configured cells", () => {
    const cells = [makeCell(0, 0, "Cell A1"), makeCell(1, 2, "Cell C2")];
    render(
      <Grid
        cells={cells}
        cols={5}
        rows={3}
        onCellClick={() => {}}
        onCellHover={() => {}}
        onEmptyDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText("Cell A1")).toBeInTheDocument();
    expect(screen.getByText("Cell C2")).toBeInTheDocument();
  });
});

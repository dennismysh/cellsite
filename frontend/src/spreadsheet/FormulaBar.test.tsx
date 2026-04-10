import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormulaBar } from "./FormulaBar.js";
import { useHoveredCell } from "./useHoveredCell.js";
import type { Cell } from "@cellsite/shared";

function makeCell(overrides: Partial<Cell> = {}): Cell {
  return {
    id: "c1",
    sheet: "creative",
    row: 1,
    col: 1,
    rowSpan: 1,
    colSpan: 1,
    type: "external",
    title: "Example",
    subtitleJa: "例",
    icon: "⭐",
    targetId: null,
    targetTable: null,
    externalUrl: "https://example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("FormulaBar", () => {
  beforeEach(() => {
    useHoveredCell.setState({ hovered: null, hoveredPosition: null });
  });

  it("shows empty state when no cell is hovered", () => {
    render(<FormulaBar />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the hovered cell's reference and title", () => {
    useHoveredCell.setState({
      hovered: makeCell({ row: 1, col: 1, title: "Example", subtitleJa: "例" }),
      hoveredPosition: { row: 1, col: 1 },
    });
    render(<FormulaBar />);
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText(/Example/)).toBeInTheDocument();
  });

  it("shows just the cell ref when hovering an empty position", () => {
    useHoveredCell.setState({
      hovered: null,
      hoveredPosition: { row: 2, col: 3 },
    });
    render(<FormulaBar />);
    expect(screen.getByText("D3")).toBeInTheDocument();
  });
});

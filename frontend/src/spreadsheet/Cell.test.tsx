import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cell } from "./Cell.js";
import { useEditMode } from "./useEditMode.js";
import type { Cell as CellType } from "@cellsite/shared";

function makeCell(overrides: Partial<CellType> = {}): CellType {
  return {
    id: "c1",
    sheet: "creative",
    row: 0,
    col: 0,
    rowSpan: 1,
    colSpan: 1,
    type: "external",
    title: "GitHub",
    subtitleJa: "コード",
    icon: "🐙",
    targetId: null,
    targetTable: null,
    externalUrl: "https://github.com/example",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Cell (read mode)", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
  });

  it("renders title, subtitle, and icon", () => {
    render(<Cell cell={makeCell()} onClick={() => {}} onHover={() => {}} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("コード")).toBeInTheDocument();
    expect(screen.getByText("🐙")).toBeInTheDocument();
  });

  it("calls onClick when clicked in read mode", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Cell cell={makeCell()} onClick={onClick} onHover={() => {}} />);
    await user.click(screen.getByText("GitHub"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("calls onHover with the cell on mouseEnter", async () => {
    const user = userEvent.setup();
    const onHover = vi.fn();
    render(<Cell cell={makeCell()} onClick={() => {}} onHover={onHover} />);
    await user.hover(screen.getByText("GitHub"));
    expect(onHover).toHaveBeenCalledWith(expect.objectContaining({ title: "GitHub" }));
  });
});

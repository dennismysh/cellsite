import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CellConfigPopover } from "./CellConfigPopover.js";

describe("CellConfigPopover", () => {
  it("renders the title, type dropdown, external url, and save/cancel", () => {
    render(
      <CellConfigPopover
        position={{ row: 0, col: 0 }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^type$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/external url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onSave with a valid external cell payload", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <CellConfigPopover
        position={{ row: 2, col: 3 }}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/^title$/i), "GitHub");
    await user.type(screen.getByLabelText(/japanese subtitle/i), "コード");
    await user.type(
      screen.getByLabelText(/external url/i),
      "https://github.com",
    );
    await user.selectOptions(screen.getByLabelText(/icon/i), "🐙");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        row: 2,
        col: 3,
        type: "external",
        title: "GitHub",
        subtitleJa: "コード",
        icon: "🐙",
        externalUrl: "https://github.com",
        rowSpan: 1,
        colSpan: 1,
      }),
    );
  });

  it("calls onCancel when cancel clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <CellConfigPopover
        position={{ row: 0, col: 0 }}
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders a delete button when editing an existing cell", () => {
    render(
      <CellConfigPopover
        position={{ row: 0, col: 0 }}
        cell={{
          id: "c1",
          sheet: "creative",
          row: 0,
          col: 0,
          rowSpan: 1,
          colSpan: 1,
          type: "external",
          title: "GitHub",
          subtitleJa: null,
          icon: "🐙",
          targetId: null,
          targetTable: null,
          externalUrl: "https://github.com",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});

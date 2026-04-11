import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Ribbon } from "./Ribbon.js";
import { useEditMode } from "./useEditMode.js";
import { useZoomLevel } from "./useZoomLevel.js";
import { useThemeStore } from "../theme/useThemeStore.js";

describe("Ribbon", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
    localStorage.clear();
    useThemeStore.setState({ mode: "system" });
    useZoomLevel.setState({ level: 1, fitMultiplier: 1 });
  });

  it("renders the site name in katakana", () => {
    render(<Ribbon />);
    expect(screen.getByText("セルサイト")).toBeInTheDocument();
  });

  it("renders nav tabs", () => {
    render(<Ribbon />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders a theme toggle", () => {
    render(<Ribbon />);
    expect(
      screen.getByRole("button", { name: /theme:/i }),
    ).toBeInTheDocument();
  });

  it("renders an edit mode toggle that toggles the store", async () => {
    const user = userEvent.setup();
    render(<Ribbon />);
    const button = screen.getByRole("button", { name: /edit/i });
    expect(useEditMode.getState().enabled).toBe(false);
    await user.click(button);
    expect(useEditMode.getState().enabled).toBe(true);
  });

  it("renders a zoom level select with a Fit option", () => {
    render(<Ribbon />);
    const select = screen.getByRole("combobox", { name: /zoom level/i });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fit" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100%" })).toBeInTheDocument();
  });

  it("selecting Fit updates the zoom store", async () => {
    const user = userEvent.setup();
    render(<Ribbon />);
    const select = screen.getByRole("combobox", { name: /zoom level/i });
    await user.selectOptions(select, "fit");
    expect(useZoomLevel.getState().level).toBe("fit");
  });

  it("zoom in button advances to the next preset", async () => {
    const user = userEvent.setup();
    render(<Ribbon />);
    expect(useZoomLevel.getState().level).toBe(1);
    await user.click(screen.getByRole("button", { name: /zoom in/i }));
    expect(useZoomLevel.getState().level).toBe(1.25);
  });

  it("zoom out button steps to the previous preset", async () => {
    const user = userEvent.setup();
    render(<Ribbon />);
    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    expect(useZoomLevel.getState().level).toBe(0.75);
  });
});

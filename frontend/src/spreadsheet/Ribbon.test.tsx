import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Ribbon } from "./Ribbon.js";
import { useEditMode } from "./useEditMode.js";
import { useThemeStore } from "../theme/useThemeStore.js";

describe("Ribbon", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
    localStorage.clear();
    useThemeStore.setState({ mode: "system" });
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
});

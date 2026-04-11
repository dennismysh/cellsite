import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle.js";
import { useThemeStore } from "./useThemeStore.js";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: "system" });
  });

  it("renders the current mode label", () => {
    useThemeStore.setState({ mode: "light" });
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: /theme: light/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Light");
  });

  it("cycles through modes on click", async () => {
    const user = userEvent.setup();
    useThemeStore.setState({ mode: "light" });
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(button).toHaveTextContent("Dark");

    await user.click(button);
    expect(useThemeStore.getState().mode).toBe("system");
    expect(button).toHaveTextContent("System");

    await user.click(button);
    expect(useThemeStore.getState().mode).toBe("light");
    expect(button).toHaveTextContent("Light");
  });

  it("has an accessible name describing the action", () => {
    useThemeStore.setState({ mode: "dark" });
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName(/theme: dark\. click to change\./i);
  });
});

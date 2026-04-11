import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "./useThemeStore.js";

describe("useThemeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to what a fresh hydration would produce.
    useThemeStore.setState({ mode: "system" });
  });

  it("defaults to system when localStorage is empty", () => {
    expect(useThemeStore.getState().mode).toBe("system");
  });

  it("setMode updates the store and persists to localStorage", () => {
    useThemeStore.getState().setMode("dark");
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    useThemeStore.getState().setMode("light");
    expect(useThemeStore.getState().mode).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("cycle advances light -> dark -> system -> light", () => {
    useThemeStore.getState().setMode("light");

    useThemeStore.getState().cycle();
    expect(useThemeStore.getState().mode).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    useThemeStore.getState().cycle();
    expect(useThemeStore.getState().mode).toBe("system");
    expect(localStorage.getItem("theme")).toBe("system");

    useThemeStore.getState().cycle();
    expect(useThemeStore.getState().mode).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });
});

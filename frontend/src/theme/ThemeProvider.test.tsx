import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider.js";
import { useThemeStore } from "./useThemeStore.js";

type Listener = (event: { matches: boolean }) => void;

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, cb: Listener) => {
      listeners.add(cb);
    },
    removeEventListener: (_type: string, cb: Listener) => {
      listeners.delete(cb);
    },
    dispatchEvent: () => false,
  };
  window.matchMedia = () => mql as unknown as MediaQueryList;
  return {
    setMatches(next: boolean) {
      mql.matches = next;
      listeners.forEach((cb) => cb({ matches: next }));
    },
  };
}

describe("ThemeProvider", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: "system" });
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders children", () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider>
        <div>child content</div>
      </ThemeProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("sets data-theme on the document element", () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    const theme = document.documentElement.getAttribute("data-theme");
    expect(theme === "light" || theme === "dark").toBe(true);
  });

  it("applies 'light' when mode is explicitly set to light regardless of system", () => {
    mockMatchMedia(true); // system prefers dark
    useThemeStore.setState({ mode: "light" });
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("applies 'dark' when mode is explicitly set to dark regardless of system", () => {
    mockMatchMedia(false); // system prefers light
    useThemeStore.setState({ mode: "dark" });
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("follows system preference when mode is 'system'", () => {
    mockMatchMedia(true);
    useThemeStore.setState({ mode: "system" });
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("reacts to system changes when mode is 'system'", () => {
    const media = mockMatchMedia(false);
    useThemeStore.setState({ mode: "system" });
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      media.setMatches(true);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("updates data-theme when the store mode changes", () => {
    mockMatchMedia(false);
    useThemeStore.setState({ mode: "light" });
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      useThemeStore.setState({ mode: "dark" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library's auto-cleanup relies on vitest globals (afterEach
// on globalThis). This project uses `globals: false`, so wire cleanup manually.
afterEach(() => {
  cleanup();
});

// jsdom does not implement window.matchMedia; provide a minimal polyfill
// so that components which read prefers-color-scheme can render in tests.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

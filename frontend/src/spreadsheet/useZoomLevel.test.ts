import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_ZOOM,
  ZOOM_LEVELS,
  effectiveZoom,
  useZoomLevel,
} from "./useZoomLevel.js";

describe("useZoomLevel", () => {
  beforeEach(() => {
    localStorage.clear();
    useZoomLevel.setState({ level: DEFAULT_ZOOM, fitMultiplier: 1 });
  });

  it("starts at 100% by default", () => {
    expect(useZoomLevel.getState().level).toBe(1);
  });

  it("setLevel persists the value to localStorage", () => {
    useZoomLevel.getState().setLevel(1.5);
    expect(useZoomLevel.getState().level).toBe(1.5);
    expect(localStorage.getItem("zoomLevel")).toBe("1.5");
  });

  it("setLevel persists 'fit' as a string", () => {
    useZoomLevel.getState().setLevel("fit");
    expect(useZoomLevel.getState().level).toBe("fit");
    expect(localStorage.getItem("zoomLevel")).toBe("fit");
  });

  it("zoomIn advances to the next preset", () => {
    useZoomLevel.getState().setLevel(1);
    useZoomLevel.getState().zoomIn();
    expect(useZoomLevel.getState().level).toBe(1.25);
  });

  it("zoomOut goes to the previous preset", () => {
    useZoomLevel.getState().setLevel(1);
    useZoomLevel.getState().zoomOut();
    expect(useZoomLevel.getState().level).toBe(0.75);
  });

  it("zoomIn clamps at the top of the preset ladder", () => {
    const top = ZOOM_LEVELS[ZOOM_LEVELS.length - 1]!;
    useZoomLevel.getState().setLevel(top);
    useZoomLevel.getState().zoomIn();
    expect(useZoomLevel.getState().level).toBe(top);
  });

  it("zoomOut clamps at the bottom of the preset ladder", () => {
    const bottom = ZOOM_LEVELS[0]!;
    useZoomLevel.getState().setLevel(bottom);
    useZoomLevel.getState().zoomOut();
    expect(useZoomLevel.getState().level).toBe(bottom);
  });

  it("zoomIn from 'fit' leaves fit mode at a sensible preset", () => {
    useZoomLevel.getState().setLevel("fit");
    useZoomLevel.getState().zoomIn();
    expect(useZoomLevel.getState().level).toBe(1.25);
  });

  it("effectiveZoom returns fitMultiplier when level is 'fit'", () => {
    useZoomLevel.setState({ level: "fit", fitMultiplier: 0.4 });
    expect(effectiveZoom(useZoomLevel.getState())).toBe(0.4);
  });

  it("effectiveZoom returns the numeric level otherwise", () => {
    useZoomLevel.setState({ level: 1.5, fitMultiplier: 0.4 });
    expect(effectiveZoom(useZoomLevel.getState())).toBe(1.5);
  });

  it("setFitMultiplier ignores non-positive values", () => {
    useZoomLevel.setState({ level: "fit", fitMultiplier: 0.5 });
    useZoomLevel.getState().setFitMultiplier(0);
    useZoomLevel.getState().setFitMultiplier(-1);
    useZoomLevel.getState().setFitMultiplier(Number.NaN);
    expect(useZoomLevel.getState().fitMultiplier).toBe(0.5);
  });

  it("reset returns to 100% and persists", () => {
    useZoomLevel.getState().setLevel(2);
    useZoomLevel.getState().reset();
    expect(useZoomLevel.getState().level).toBe(1);
    expect(localStorage.getItem("zoomLevel")).toBe("1");
  });
});

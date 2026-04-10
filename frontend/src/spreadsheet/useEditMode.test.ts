import { describe, it, expect, beforeEach } from "vitest";
import { useEditMode } from "./useEditMode.js";

describe("useEditMode", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
  });

  it("starts disabled", () => {
    expect(useEditMode.getState().enabled).toBe(false);
  });

  it("toggles on", () => {
    useEditMode.getState().toggle();
    expect(useEditMode.getState().enabled).toBe(true);
  });

  it("toggles off", () => {
    useEditMode.getState().toggle();
    useEditMode.getState().toggle();
    expect(useEditMode.getState().enabled).toBe(false);
  });
});

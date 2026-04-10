import { describe, it, expect } from "vitest";
import { colLetter, cellRef } from "./cellRef.js";

describe("cellRef", () => {
  it("colLetter returns A for col 0", () => {
    expect(colLetter(0)).toBe("A");
  });

  it("colLetter returns Z for col 25", () => {
    expect(colLetter(25)).toBe("Z");
  });

  it("colLetter returns AA for col 26", () => {
    expect(colLetter(26)).toBe("AA");
  });

  it("cellRef formats row+col as spreadsheet-style", () => {
    expect(cellRef(0, 0)).toBe("A1");
    expect(cellRef(1, 1)).toBe("B2");
    expect(cellRef(9, 2)).toBe("C10");
  });
});

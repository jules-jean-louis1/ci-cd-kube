import { describe, it, expect } from "vitest";
import { parseBoolean, safeParseInt, isNonEmptyString } from "../../src/utils/utils.js";

describe("utils.parseBoolean", () => {
  it("parses true/false strings and booleans", () => {
    expect(parseBoolean(true)).toBe(true);
    expect(parseBoolean(false)).toBe(false);
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("FALSE")).toBe(false);
    expect(parseBoolean(" foo ")).toBe(null);
  });
});

describe("utils.safeParseInt", () => {
  it("parses numbers and numeric strings, rejects others", () => {
    expect(safeParseInt(5)).toBe(5);
    expect(safeParseInt("10")).toBe(10);
    expect(safeParseInt("10px")).toBe(null);
    expect(safeParseInt("abc")).toBe(null);
  });
});

describe("utils.isNonEmptyString", () => {
  it("returns true for non-empty strings", () => {
    expect(isNonEmptyString("a")).toBe(true);
    expect(isNonEmptyString("   ")).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});

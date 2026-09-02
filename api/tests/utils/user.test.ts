import { describe, it, expect } from "vitest";
import { canDeleteUser, canDeleteDoctor } from "../../src/utils/user.js";

describe("user utils", () => {
  it("canDeleteUser returns true only for admin", () => {
    expect(canDeleteUser("admin")).toBe(true);
    expect(canDeleteUser("patient")).toBe(false);
  });

  it("canDeleteDoctor behaves correctly", () => {
    expect(canDeleteDoctor("admin", "1", "2")).toBe(true);
    expect(canDeleteDoctor("medecin", "1", "1")).toBe(true);
    expect(canDeleteDoctor("medecin", "1", "2")).toBe(false);
  });
});

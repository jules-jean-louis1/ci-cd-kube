import { describe, it, expect } from "vitest";
import { canDeleteUser, canDeleteDoctor, USER_ROLE } from "../../src/utils/user.js";

describe("user utils", () => {
  it("canDeleteUser returns true only for admin", () => {
    expect(canDeleteUser(USER_ROLE.ADMIN)).toBe(true);
    expect(canDeleteUser(USER_ROLE.PATIENT)).toBe(false);
  });

  it("canDeleteDoctor behaves correctly", () => {
    expect(canDeleteDoctor(USER_ROLE.ADMIN, "1", "2")).toBe(true);
    expect(canDeleteDoctor(USER_ROLE.DOCTOR, "1", "1")).toBe(true);
    expect(canDeleteDoctor(USER_ROLE.DOCTOR, "1", "2")).toBe(false);
  });
});

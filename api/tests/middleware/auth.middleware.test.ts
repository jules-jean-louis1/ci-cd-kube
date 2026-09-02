import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("hono/jwt", () => ({
  verify: vi.fn(),
}));

import { auth } from "../../src/middleware/auth.middleware.js";
import { verify } from "hono/jwt";

describe("auth middleware", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when Authorization header missing", async () => {
    let response: any = null;
    const c: any = {
      req: { header: () => undefined },
      json: (body: any, status: number) => {
        response = { body, status };
        return response;
      },
      set: () => {},
    };

    const handler = auth();
    await handler(c, async () => {});

    expect(response).toEqual({ body: { message: "Missing Token" }, status: 401 });
  });

  it("returns 401 when token is invalid", async () => {
    (verify as any).mockImplementation(() => {
      throw new Error("invalid");
    });

    let response: any = null;
    const c: any = {
      req: { header: () => "Bearer badtoken" },
      json: (body: any, status: number) => {
        response = { body, status };
        return response;
      },
      set: () => {},
    };

    const handler = auth();
    await handler(c, async () => {});

    expect(response).toEqual({ body: { message: "Invalid or expired token" }, status: 401 });
  });

  it("forbids when role not allowed", async () => {
    (verify as any).mockResolvedValue({ userId: "1", firstname: "a", lastname: "b", role: "user", exp: 0 });

    let response: any = null;
    const c: any = {
      req: { header: () => "Bearer goodtoken" },
      json: (body: any, status: number) => {
        response = { body, status };
        return response;
      },
      set: () => {},
    };

    const handler = auth("admin");
    await handler(c, async () => {});

    expect(response).toEqual({ body: { message: "Forbidden" }, status: 403 });
  });

  it("sets user and calls next on success", async () => {
    (verify as any).mockResolvedValue({ userId: "1", firstname: "a", lastname: "b", role: "user", exp: 0 });

    const c: any = {
      req: { header: () => "Bearer goodtoken" },
      json: () => {},
      set: vi.fn(),
    };

    let called = false;
    const handler = auth();
    await handler(c, async () => {
      called = true;
    });

    expect(called).toBe(true);
    expect(c.set).toHaveBeenCalled();
  });
});

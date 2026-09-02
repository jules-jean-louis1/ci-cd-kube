import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimit } from "../../src/middleware/rateLimit.middleware.js";

describe("rateLimit middleware", () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it("allows requests under the limit", async () => {
    const mw = rateLimit({ limit: 2, windowMs: 10000 });
    const c: any = {
      req: { header: (n: string) => "1.2.3.4" },
      json: () => {},
    };
    let called = 0;
    await mw(c, async () => {
      called += 1;
    });
    await mw(c, async () => {
      called += 1;
    });
    expect(called).toBe(2);
  });

  it("blocks when over the limit", async () => {
    const mw = rateLimit({ limit: 1, windowMs: 10000 });
    const c: any = {
      req: { header: (n: string) => "1.2.3.4" },
      json: (body: any, status: number, headers?: any) => ({ body, status, headers }),
    };

    let called = 0;
    await mw(c, async () => {
      called += 1;
    });
    const res = await mw(c, async () => {
      called += 1;
    });

    expect(called).toBe(1);
    expect(res).toHaveProperty("status", 429);
  });
});

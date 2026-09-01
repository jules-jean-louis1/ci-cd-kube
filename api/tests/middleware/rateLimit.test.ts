import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimit, resetRateLimit } from "../../src/middleware/rateLimit.middleware.js";

/**
 * Tests du middleware de rate limiting (stratégie fenêtre glissante).
 *
 * Le middleware est testé isolément sur une app Hono minimale : pas de base de
 * données, pas d'authentification, pas de contrôleur — seul le comportement du
 * middleware est en cause si un test échoue. Cela permet aussi d'utiliser des
 * seuils courts (3 requêtes / 100 ms) pour vérifier le glissement de la fenêtre,
 * impraticable avec les seuils réels de production (5 requêtes / 15 min).
 */
describe("Middleware rateLimit (fenêtre glissante)", () => {
  // Le compteur est un état global au module : on repart d'une table vide
  // avant chaque test pour garantir leur isolation.
  beforeEach(() => {
    resetRateLimit();
  });

  const buildApp = (limit: number, windowMs: number) => {
    const app = new Hono();
    app.get("/test", rateLimit({ limit, windowMs }), (c) => c.text("OK"));
    return app;
  };

  it("should allow requests below the limit", async () => {
    const app = buildApp(3, 60_000);

    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test", {
        headers: { "x-forwarded-for": "10.0.0.1" },
      });
      expect(res.status).toBe(200);
    }
  });

  it("should return 429 once the limit is exceeded", async () => {
    const app = buildApp(3, 60_000);

    for (let i = 0; i < 3; i++) {
      await app.request("/test", { headers: { "x-forwarded-for": "10.0.0.2" } });
    }

    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.message).toBe("Too many requests, please try again later");
  });

  it("should expose a Retry-After header when blocking", async () => {
    const app = buildApp(1, 60_000);

    await app.request("/test", { headers: { "x-forwarded-for": "10.0.0.3" } });
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.3" },
    });

    expect(res.status).toBe(429);
    const retryAfter = Number(res.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("should track each client IP independently", async () => {
    const app = buildApp(2, 60_000);

    // On sature le quota de la première IP.
    await app.request("/test", { headers: { "x-forwarded-for": "10.0.0.4" } });
    await app.request("/test", { headers: { "x-forwarded-for": "10.0.0.4" } });
    const blocked = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.4" },
    });
    expect(blocked.status).toBe(429);

    // Une autre IP dispose toujours de son propre quota.
    const other = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.5" },
    });
    expect(other.status).toBe(200);
  });

  it("should allow requests again once the window has slid past", async () => {
    const app = buildApp(2, 100);

    await app.request("/test", { headers: { "x-forwarded-for": "10.0.0.6" } });
    await app.request("/test", { headers: { "x-forwarded-for": "10.0.0.6" } });
    const blocked = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.6" },
    });
    expect(blocked.status).toBe(429);

    // Au-delà de la fenêtre, les anciens hits sortent du décompte.
    await new Promise((resolve) => setTimeout(resolve, 150));

    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.6" },
    });
    expect(res.status).toBe(200);
  });

  it("should keep only the first IP of a x-forwarded-for chain", async () => {
    const app = buildApp(1, 60_000);

    await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.7, 192.168.1.1, 172.16.0.1" },
    });

    // Même client réel (10.0.0.7), chaîne de proxies différente : doit être bloqué.
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "10.0.0.7, 203.0.113.9" },
    });

    expect(res.status).toBe(429);
  });
});

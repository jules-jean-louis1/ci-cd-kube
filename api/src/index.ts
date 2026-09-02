import { Hono } from "hono";
import { serve } from "@hono/node-server";
import * as AuthController from "./modules/auth/auth.controller.js";
import * as TasksController from "./modules/tasks/tasks.controller.js";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { USER_ROLE } from "./utils/user.js";
import { auth } from "./middleware/auth.middleware.js";
import { rateLimit } from "./middleware/rateLimit.middleware.js";
import { createMiddleware } from "hono/factory";
import { swaggerUI } from "@hono/swagger-ui";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const app = new Hono();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerYaml = readFileSync(path.resolve(__dirname, "../swagger.yaml"), "utf-8");
app.use(logger());
// Headers de sécurité HTTP (OWASP A05). X-Content-Type-Options, X-Frame-Options et
// Strict-Transport-Security sont déjà activés par défaut par ce middleware.
// La CSP autorise cdn.jsdelivr.net, utilisé par la Swagger UI (/docs) pour ses assets.
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' nécessaire : la Swagger UI (@hono/swagger-ui) injecte son
      // script d'initialisation en inline, pas de nonce/hash disponible côté lib.
      // Accepté car /docs ne sert que de la documentation publique, aucune donnée sensible.
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
    },
  }),
);
app.get("/", (c) => c.text("OK"));

// Documentation API (Swagger/OpenAPI) — publique, pas d'authentification requise.
app.get("/swagger.yaml", (c) => c.text(swaggerYaml, 200, { "Content-Type": "application/yaml" }));
app.get("/docs", swaggerUI({ url: "/swagger.yaml" }));

// Auth
// Rate limiting (OWASP A04) : fenêtre glissante de 5 requêtes / 15 min par IP sur
// les endpoints sensibles, pour limiter le brute force sur les mots de passe et la
// création massive de comptes. Désactivé en environnement de test : la suite
// d'intégration enchaîne de nombreux register/login depuis la même origine, et le
// middleware est couvert par son propre fichier de test dédié.
const authRateLimit =
  process.env.NODE_ENV === "test"
    ? createMiddleware(async (_c, next) => next())
    : rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 });

app.post("/auth/register", authRateLimit, async (c) => {
  return AuthController.register(c);
});

app.post("/auth/login", authRateLimit, async (c) => {
  return AuthController.login(c);
});

app.get("/auth/logout", async (c) => {
  return AuthController.logout(c);
});

app.get("/auth/refresh", async (c) => {
  return AuthController.refreshToken(c);
});

// Protect routes
// Tasks (Task manager)
app.post("/tasks", auth(), async (c) => TasksController.createTask(c));
app.get("/tasks", auth(), async (c) => TasksController.getTasks(c));
app.get("/tasks/:id", auth(), async (c) => TasksController.getTask(c));
app.patch("/tasks/:id", auth(), async (c) => TasksController.updateTask(c));
app.delete("/tasks/:id", auth(), async (c) => TasksController.deleteTask(c));

export default app;

if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port: 3000 });
}

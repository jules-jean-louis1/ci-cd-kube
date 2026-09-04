import { Hono } from "hono";
import { serve } from "@hono/node-server";
import * as AuthController from "./modules/auth/auth.controller.js";
import * as TasksController from "./modules/tasks/tasks.controller.js";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./middleware/auth.middleware.js";
import { rateLimit } from "./middleware/rateLimit.middleware.js";
import { createMiddleware } from "hono/factory";
import { swaggerUI } from "@hono/swagger-ui";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { html } from "hono/html";

const app = new Hono();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerYaml = readFileSync(path.resolve(__dirname, "../swagger.yaml"), "utf-8");
app.use(logger());

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
    },
  }),
);

app.get("/health", (c) => c.json({ status: "OK" }, 200));
app.get("/", (c) =>
  c.html(html`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Taskmanager API</title>
      </head>
      <body>
        Hello!
      </body>
    </html>
  `),
);

// Documentation API (Swagger/OpenAPI) — publique, pas d'authentification requise.
app.get("/swagger.yaml", (c) => c.text(swaggerYaml, 200, { "Content-Type": "application/yaml" }));
app.get("/docs", swaggerUI({ url: "/swagger.yaml" }));

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

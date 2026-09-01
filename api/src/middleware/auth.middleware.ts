import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

type JwtPayload = {
  userId: string;
  firstname: string;
  lastname: string;
  role: string;
  exp: number;
};

/**
 * Auth Middleware
 * * Secures routes by verifying the Bearer JWT token in the `Authorization` header.
 * Optionally restricts access to specific user roles.
 * * @param {string | string[]} [allowedRoles] - Single role or array of roles allowed to access the route. If omitted, any authenticated user can access it.
 * * @returns {MiddlewareHandler} Hono middleware that:
 * - Verifies the token and injects the decoded payload into the context variable `user` (`c.get('user')`).
 * - Returns `401 Unauthorized` if the token is missing, invalid, or expired.
 * - Returns `403 Forbidden` if the user's role does not match the allowed roles.
 * * @example
 * // 1. Allow any authenticated user
 * app.get("/profile", auth(), (c) => { ... })
 */

export const auth = (allowedRoles?: string | string[]) =>
  createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return c.json({ message: "Missing Token" }, 401);
    const token = authHeader.slice(7);
    try {
      const payload = (await verify(token, process.env.JWT_SECRET!, "HS256")) as JwtPayload;

      if (allowedRoles) {
        if (Array.isArray(allowedRoles)) {
          const allowed = allowedRoles.includes(payload.role);
          if (!allowed) {
            return c.json({ message: "Forbidden" }, 403);
          }
        } else {
          if (allowedRoles !== payload.role) {
            return c.json({ message: "Forbidden" }, 403);
          }
        }
      }
      c.set("user", payload);
      await next();
    } catch {
      return c.json({ message: "Invalid or expired token" }, 401);
    }
  });

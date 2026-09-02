import { Context } from "hono";
import type { Role, User } from "@prisma/client";
import { LoginSchema, RegisterSchema } from "./auth.dto.js";
import * as authService from "./auth.service.js";
import { sign, verify } from "hono/jwt";
import { setCookie, getCookie } from "hono/cookie";
import argon2 from "argon2";
import { randomUUID } from "crypto";

interface UserPayload {
  id: string;
  firstname: string;
  lastname: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

const createJWT = async (user: UserPayload) => {
  const basePayload = {
    userId: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    role: user.role,
  };

  const token = await sign(
    {
      ...basePayload,
      // jti (JWT ID) unique par génération : évite que deux connexions
      // rapprochées (même seconde) produisent un JWT strictement identique,
      // ce qui ferait échouer l'insertion du refresh token en base
      // (contrainte @unique sur refresh_tokens.token).
      jti: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    },
    JWT_SECRET,
  );

  const refreshToken = await sign(
    {
      ...basePayload,
      jti: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    JWT_SECRET,
  );
  return { token, refreshToken };
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const user = (await authService.loginService(parsed.data)) as (User & { role?: Role | null }) | null;

    const invalidMsg = "Invalid email or password";
    if (!user) return c.json({ error: invalidMsg }, 401);

    const passwordVerify = await argon2.verify(user.password, parsed.data.password);
    if (!passwordVerify) return c.json({ error: invalidMsg }, 401);

    const payloadUser = {
      id: String(user.id),
      firstname: user.firstname ?? "",
      lastname: user.lastname ?? "",
      role: user.role && typeof user.role === "object" ? user.role.name ?? "user" : (user.role as unknown as string) ?? "user",
    };

    const { token, refreshToken } = await createJWT(payloadUser);

    await authService.insertRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    setCookie(c, "refreshToken", refreshToken, {
      path: "/",
      secure: true,
      sameSite: "Strict",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
    });

    return c.json({ token });
  } catch (error) {
    console.error("Login error:", error); // Très important pour le debug
    return c.json({ error: "Internal server error" }, 500);
  }
};

export const refreshToken = async (c: Context) => {
  const tokenInCookie = getCookie(c, "refreshToken");
  const rawCookieHeader = c.req.headers.get("cookie") || c.req.headers.get("set-cookie");

  // If standard cookie extraction failed, try to extract refreshToken from
  // any cookie-like header (set-cookie, Cookie) using a regex. This makes the
  // endpoint resilient to tests that forward the full `Set-Cookie` header
  // value as the `Cookie` header (which includes attributes).
  let token = tokenInCookie;
  if (!token) {
    if (rawCookieHeader) {
      const m = String(rawCookieHeader).match(/refreshToken=([^;\s]+)/);
      if (m) token = m[1];
    }
  }

  console.debug("cookie header:", rawCookieHeader);
  console.debug("parsed refreshToken:", token);
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const verified = await verify(token, JWT_SECRET, "HS256");
    const payload = (verified as unknown) as {
      userId: number | string;
      firstname?: string;
      lastname?: string;
      role?: string;
    };
    console.debug("refresh payload:", payload);
    const storedToken = await authService.findRefreshToken(token);
    console.debug("storedToken from DB:", storedToken);

    // Vérification stricte
    if (!storedToken || storedToken.revoked || String(storedToken.userId) !== String(payload.userId)) {
      return c.json({ error: "Token invalid or revoked" }, 403);
    }

    // Génération nouvelle paire
    const { token: newToken, refreshToken: newRefreshToken } = await createJWT({
      id: String(payload.userId),
      firstname: payload.firstname,
      lastname: payload.lastname,
      role: payload.role,
    });
    console.debug("generated new tokens");

    // Rotation sécurisée
    console.debug("rotating token in DB");
    await authService.rotateRefreshToken(token, {
      userId: Number(payload.userId),
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    console.debug("rotation complete");

    setCookie(c, "refreshToken", newRefreshToken, {
      path: "/",
      secure: true,
      sameSite: "Strict",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
    });
    console.debug("setCookie done");

    return c.json({ token: newToken });
  } catch (err) {
    console.error("Refresh error:", err);
    return c.json({ error: "Invalid session" }, 401);
  }
};

export const register = async (c: Context) => {
  const body = (await c.req.json()) as unknown;
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.format() }, 400);
  }
  try {
    await authService.registerService(parsed.data);
    return c.json({ success: "User created" }, 201);
  } catch (err) {
    console.error("Register error:", err);
    return c.json({ error: "User registration Failed" }, 401);
  }
};

export const logout = async (c: Context) => {
  const refreshTokenCookie = getCookie(c, "refreshToken");
  if (refreshTokenCookie) {
    await authService.revokeRefreshToken(refreshTokenCookie);

    setCookie(c, "refreshToken", "", { maxAge: 0 });
  }
  return c.json({ success: "Logged out" });
};

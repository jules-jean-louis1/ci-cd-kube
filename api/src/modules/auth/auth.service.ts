// Avoid importing Prisma model types here to prevent type resolution issues during CI/typecheck
import { LoginInput, RegisterInput } from "./auth.dto.js";
import * as argon2 from "argon2";
import { prisma } from "../../utils/prisma.js";

/**
 * Crée un nouveau compte utilisateur suite à une inscription publique.
 * Le rôle est forcé à "patient" côté serveur : l'endpoint /auth/register
 * ne doit jamais permettre à un client de s'auto-attribuer un rôle
 * admin ou medecin (faille de type "mass assignment" / élévation de privilèges).
 * La création de comptes admin/medecin passera par un endpoint protégé dédié.
 */
export const registerService = async (data: RegisterInput): Promise<unknown> => {
  // Hash du mot de passe avant stockage — jamais de mot de passe en clair en base.
  const hashed = await argon2.hash(data.password);

  // Résoudre l'id du rôle 'patient' et connecter la relation proprement
  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      role: {
        connectOrCreate: {
          where: { name: "patient" },
          create: { name: "patient" },
        },
      },
    },
  });
};

/**
 * Récupère un utilisateur par email pour vérifier ses identifiants au login.
 * Le contrôleur se charge ensuite de comparer le mot de passe avec argon2.
 */
export const loginService = async (data: LoginInput): Promise<unknown | null> => {
  return await prisma.user.findUnique({ where: { email: data.email }, include: { role: true } });
};

/**
 * Enregistre un nouveau refresh token en base, associé à un utilisateur,
 * avec sa date d'expiration. Utilisé après un login réussi.
 */
export const insertRefreshToken = async (data: {
  userId: number;
  token: string;
  expiresAt: Date;
}): Promise<unknown> => {
  return await prisma.refreshToken.create({
    data: {
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    },
  });
};

/**
 * Recherche un refresh token existant à partir de sa valeur brute.
 * Sert à vérifier qu'un token présenté par le client est bien connu et valide.
 */
export const findRefreshToken = async (token: string): Promise<unknown | null> => {
  return await prisma.refreshToken.findUnique({ where: { token } });
};

/**
 * Marque un refresh token comme révoqué (ex. lors d'un logout).
 * Un token révoqué ne peut plus être utilisé pour obtenir un nouvel access token.
 */
export const revokeRefreshToken = async (token: string): Promise<unknown> => {
  return await prisma.refreshToken.update({ where: { token }, data: { revoked: true } });
};

/**
 * Rotation du refresh token : révoque l'ancien et en crée un nouveau,
 * dans une transaction pour garantir qu'on ne se retrouve jamais avec
 * un ancien token révoqué sans nouveau token valide (ou l'inverse).
 */
export const rotateRefreshToken = async (
  oldToken: string,
  newData: { userId: number; token: string; expiresAt: Date },
) => {
  return await prisma.$transaction(async (tx) => {
    // Use updateMany to avoid throwing if the token was already removed
    await tx.refreshToken.updateMany({ where: { token: oldToken }, data: { revoked: true } });

    return await tx.refreshToken.create({
      data: { userId: newData.userId, token: newData.token, expiresAt: newData.expiresAt },
    });
  });
};

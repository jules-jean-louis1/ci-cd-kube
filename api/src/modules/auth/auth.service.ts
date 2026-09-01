import { refresh_tokens, users } from "@prisma/client";
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
export const registerService = async (data: RegisterInput): Promise<users> => {
  // Hash du mot de passe avant stockage — jamais de mot de passe en clair en base.
  const hashed = await argon2.hash(data.password);

  return await prisma.users.create({
    data: {
      email: data.email,
      password_hash: hashed,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      date_of_birth: new Date(data.date_of_birth),
      role: "patient", // valeur figée, jamais lue depuis l'input client
    },
  });
};

/**
 * Récupère un utilisateur par email pour vérifier ses identifiants au login.
 * Le contrôleur se charge ensuite de comparer le mot de passe avec argon2.
 */
export const loginService = async (data: LoginInput): Promise<users | null> => {
  return await prisma.users.findUnique({ where: { email: data.email } });
};

/**
 * Enregistre un nouveau refresh token en base, associé à un utilisateur,
 * avec sa date d'expiration. Utilisé après un login réussi.
 */
export const insertRefreshToken = async (data: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<refresh_tokens> => {
  return await prisma.refresh_tokens.create({
    data: {
      user_id: data.userId,
      token: data.token,
      expires_at: data.expiresAt,
    },
  });
};

/**
 * Recherche un refresh token existant à partir de sa valeur brute.
 * Sert à vérifier qu'un token présenté par le client est bien connu et valide.
 */
export const findRefreshToken = async (token: string): Promise<refresh_tokens | null> => {
  return await prisma.refresh_tokens.findUnique({ where: { token } });
};

/**
 * Marque un refresh token comme révoqué (ex. lors d'un logout).
 * Un token révoqué ne peut plus être utilisé pour obtenir un nouvel access token.
 */
export const revokeRefreshToken = async (token: string): Promise<refresh_tokens> => {
  return await prisma.refresh_tokens.update({
    where: { token },
    data: { revoked: true },
  });
};

/**
 * Rotation du refresh token : révoque l'ancien et en crée un nouveau,
 * dans une transaction pour garantir qu'on ne se retrouve jamais avec
 * un ancien token révoqué sans nouveau token valide (ou l'inverse).
 */
export const rotateRefreshToken = async (
  oldToken: string,
  newData: { userId: string; token: string; expiresAt: Date },
) => {
  return await prisma.$transaction(async (tx) => {
    await tx.refresh_tokens.update({
      where: { token: oldToken },
      data: { revoked: true },
    });

    return await tx.refresh_tokens.create({
      data: {
        user_id: newData.userId,
        token: newData.token,
        expires_at: newData.expiresAt,
      },
    });
  });
};

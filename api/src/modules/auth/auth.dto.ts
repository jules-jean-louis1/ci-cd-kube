import z from "zod";

/**
 * Schéma de validation pour l'inscription publique (POST /auth/register).
 *
 * Important : pas de champ "role" ici volontairement. Le rôle d'un compte
 * créé via cet endpoint est toujours "patient", forcé côté serveur dans
 * authService.registerService. Un client ne doit jamais pouvoir choisir
 * son propre rôle (risque d'élévation de privilèges vers admin/medecin).
 */
export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(12), // 12 caractères min. — cohérent avec les mots de passe utilisés dans les tests
  firstname: z.string(),
  lastname: z.string(),
  phone: z.string(),
  date_of_birth: z.coerce.date({
    error: () => ({ message: "Format de date invalide (attendu: YYYY-MM-DD)" }),
  }),
});

/**
 * Schéma de validation pour la connexion (POST /auth/login).
 * Juste email + mot de passe, pas d'autre donnée nécessaire.
 */
export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(12),
});

// Types TypeScript déduits automatiquement des schémas Zod ci-dessus.
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// Type pour le refresh token, non géré par Zod (pas de body à valider ici,
// le token vient d'un cookie httpOnly).
export type RefreshTokenInput = {
  token: string;
};

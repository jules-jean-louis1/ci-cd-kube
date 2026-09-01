import z from "zod";

/**
 * Valide le paramètre :id des routes /patients/:id — doit être un UUID.
 * Évite d'envoyer une requête Prisma avec un id manifestement invalide.
 */
export const PatientIdParamSchema = z.object({
  id: z.uuid(),
});

/**
 * Schéma de validation pour PATCH /patients/:id.
 * Tous les champs sont optionnels (modification partielle) — l'admin ne
 * renseigne que ce qu'il veut changer. Pas de "password" ni "role" ici :
 * hors périmètre de cette US (CRUD sur les infos personnelles du patient).
 * .refine() empêche un body vide (au moins un champ à modifier).
 */
export const UpdatePatientSchema = z
  .object({
    email: z.email(),
    firstname: z.string(),
    lastname: z.string(),
    phone: z.string(),
    date_of_birth: z.coerce.date({
      error: () => ({ message: "Format de date invalide (attendu: YYYY-MM-DD)" }),
    }),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Au moins un champ doit être renseigné pour la modification",
  });

/**
 * Schéma de validation pour GET /patients?name=&email= (US-03).
 * Les deux paramètres sont optionnels individuellement, mais au moins
 * l'un des deux doit être fourni — sinon on autoriserait un dump complet
 * de tous les patients d'un simple GET /patients sans rien préciser.
 */
export const SearchPatientsQuerySchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().min(1).optional(),
  })
  .refine((data) => data.name || data.email, {
    message: "Au moins un des paramètres 'name' ou 'email' doit être fourni",
  });

export type PatientIdParam = z.infer<typeof PatientIdParamSchema>;
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
export type SearchPatientsQuery = z.infer<typeof SearchPatientsQuerySchema>;

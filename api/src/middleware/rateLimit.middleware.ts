import { createMiddleware } from "hono/factory";
import { getConnInfo } from "@hono/node-server/conninfo";

type RateLimitOptions = {
  /** Nombre maximum de requêtes autorisées dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre glissante, en millisecondes. */
  windowMs: number;
};

/**
 * Stockage en mémoire des horodatages de requêtes, indexé par clé client (IP).
 *
 * Limites assumées (documentées dans le rapport OWASP, A04) :
 * - remis à zéro au redémarrage du process ;
 * - non partagé entre plusieurs instances de l'API (en production, un store
 *   externe type Redis serait nécessaire).
 */
const hits = new Map<string, number[]>();

/**
 * Identifie le client à l'origine de la requête.
 *
 * On privilégie `x-forwarded-for` (en-tête posé par un reverse proxy, et seul
 * moyen d'identifier le client réel derrière un proxy). À défaut, on lit l'IP
 * de la connexion TCP. Le fallback "unknown" couvre les appels sans socket
 * réseau réelle (ex. `app.request()` dans les tests).
 */
const getClientKey = (c: Parameters<Parameters<typeof createMiddleware>[0]>[0]): string => {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
};

/**
 * Rate limiting — stratégie fenêtre glissante (sliding window).
 *
 * À chaque requête, on ne conserve que les horodatages tombant dans les
 * `windowMs` dernières millisecondes. Si leur nombre atteint `limit`, la
 * requête est rejetée en 429 sans jamais atteindre le contrôleur (donc sans
 * requête en base ni vérification de mot de passe) — c'est ce qui protège
 * réellement du brute force.
 *
 * Contrairement à une fenêtre fixe, il n'y a pas de remise à zéro à intervalle
 * régulier qu'un attaquant pourrait exploiter en envoyant deux rafales de part
 * et d'autre de la limite.
 *
 * @example
 * app.post("/auth/login", rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 }), handler)
 */
export const rateLimit = ({ limit, windowMs }: RateLimitOptions) =>
  createMiddleware(async (c, next) => {
    const key = getClientKey(c);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Fenêtre glissante : on ne garde que les hits encore dans la fenêtre.
    const recentHits = (hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (recentHits.length >= limit) {
      const oldestHit = recentHits[0];
      const retryAfterSeconds = Math.ceil((oldestHit + windowMs - now) / 1000);

      hits.set(key, recentHits);
      return c.json({ message: "Too many requests, please try again later" }, 429, {
        "Retry-After": String(retryAfterSeconds),
      });
    }

    recentHits.push(now);
    hits.set(key, recentHits);

    await next();
  });

/**
 * Vide le stockage. Réservé aux tests, pour garantir leur isolation
 * (le compteur est un état global partagé entre les fichiers de test).
 */
export const resetRateLimit = () => hits.clear();

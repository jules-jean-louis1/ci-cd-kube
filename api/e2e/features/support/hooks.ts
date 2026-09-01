import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import { serve } from "@hono/node-server";
import { prisma } from "../../../src/utils/prisma.js";

let server: ReturnType<typeof serve> | undefined;
let baseUrl = "";

/**
 * URL de base du serveur de test, port inclus.
 * Les définitions d'étapes l'utilisent pour construire leurs requêtes :
 * elles ne connaissent que HTTP, jamais l'application Hono directement.
 */
export const getBaseUrl = (): string => {
  if (!baseUrl) throw new Error("Le serveur de test n'est pas démarré");
  return baseUrl;
};

BeforeAll({ timeout: 30_000 }, async () => {
  // NODE_ENV doit être posé AVANT le chargement de src/index.ts : ce module
  // démarre son propre serveur sur le port 3000 si NODE_ENV n'est pas "test",
  // et active le rate limiting sur /auth/*. L'import dynamique garantit cet
  // ordre, contrairement à un import statique évalué au chargement du module.
  process.env.NODE_ENV = "test";
  const { default: app } = await import("../../../src/index.js");

  // Port 0 : le système attribue un port libre. Évite le conflit avec le
  // conteneur Docker qui occupe déjà le 3000.
  await new Promise<void>((resolve) => {
    server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      baseUrl = `http://127.0.0.1:${info.port}`;
      resolve();
    });
  });
});

AfterAll({ timeout: 30_000 }, async () => {
  // Sans fermeture explicite, la socket reste ouverte et le processus Node
  // ne se termine jamais : les tests "passent" mais la commande reste bloquée.
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
  }
  // Même logique pour le pool de connexions Prisma.
  await prisma.$disconnect();
});

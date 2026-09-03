# ci-cd-kube

## CI/CD

Le workflow GitHub Actions se déclenche sur les push vers `main`, les tags Git
et les pull requests vers `main`. Il exécute les contrôles de qualité, les tests
Vitest et les tests E2E Cucumber avant toute publication Docker.

Sur `main`, l'image Docker est publiée avec le tag `dev`. Sur un tag Git, elle
est publiée avec `prod-<tag>` et `latest`.

### Secrets GitHub requis

- `DOCKERHUB_USERNAME` : nom du compte Docker Hub.
- `DOCKERHUB_TOKEN` : token d'accès Docker Hub.
- `GOOGLE_CHAT_WEBHOOK` : URL du webhook entrant Google Chat.

La notification Google Chat contient le statut, le commit, le message associé
et un lien vers les logs de l'exécution. Elle est envoyée même si un job
précédent échoue.

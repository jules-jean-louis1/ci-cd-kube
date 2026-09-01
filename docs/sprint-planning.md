# Sprint planning — HealthSync

## 1. Cadre du sprint

| | |
|---|---|
| **Sprint** | Sprint unique — MVP API de gestion de rendez-vous |
| **Période** | Du vendredi 10 juillet au vendredi 24 juillet 2026 |
| **Durée** | 2 semaines — 11 jours ouvrés |
| **Équipe** | Binôme de 2 développeurs |
| **Capacité théorique** | 22 jours-homme (11 jours × 2 personnes) |
| **Unité d'estimation** | Jours-homme, échelle 0,25 / 0,5 / 1 / 1,5 / 2 |

**Membres**

- **Hervé** (`herve-beziat`) — infrastructure de qualité, service gRPC, sécurité, documentation.
- **Jules** (`jules-jean-louis1`) — socle applicatif, modules métier CRUD, rendez-vous.

### Note de méthode

Le projet a été mené par un binôme travaillant sur un périmètre unique et court. Nous n'avons pas tenu de cérémonies formelles (daily meetings, revue de sprint planifiée) : la coordination s'est faite **en continu**, chacun signalant à l'autre le module sur lequel il travaillait et ce qui restait disponible. Ce fonctionnement a été suffisant à deux personnes, mais ne serait pas transposable à une équipe plus large — il repose entièrement sur une communication informelle et n'aurait laissé aucune trace exploitable sans le découpage en issues et en branches.

La traçabilité a en revanche été assurée par les outils : chaque user story correspond à une **issue GitHub** avec label de priorité MoSCoW, chaque issue à une **branche dédiée**, et chaque branche à une **pull request** relue par l'autre membre avant fusion sur `develop`. Les critères de fin de tâche sont formalisés dans la Definition of Done de `CONTRIBUTING.md`.

## 2. Objectif de sprint

> Livrer un MVP fonctionnel de l'API de gestion de rendez-vous médicaux : gestion des patients, des médecins et des rendez-vous avec détection des conflits de créneaux, authentification JWT avec autorisation par rôle, communication inter-services REST↔gRPC démontrée, et couverture de tests supérieure à 60 % sur la logique métier.

Cet objectif est considéré atteint si un client peut s'inscrire, s'authentifier, consulter les créneaux réellement disponibles d'un médecin et réserver un rendez-vous sans possibilité de double réservation, l'ensemble étant couvert par des tests automatisés exécutés en intégration continue.

## 3. Périmètre engagé

### Hervé

| US | Intitulé | Priorité | Estimé | Réalisé | Statut |
|---|---|---|---|---|---|
| US-01 / US-02 | Création de compte et CRUD admin patient | Must | 1,5 | 1,5 | Livré |
| US-03 | Recherche patient par nom / email | Must | 0,5 | 0,5 | Livré |
| US-10 | Rôles et protection des endpoints | Must | 1 | 1 | Livré |
| US-12 | Setup du service gRPC et fichier `.proto` | Must | 1,5 | 1,5 | Livré |
| US-13 | Communication REST → gRPC démontrée | Must | 0,5 | 0,5 | Livré |
| US-14 | Tests unitaires | Must | 1 | 1 | Livré |
| US-15 | Tests d'intégration | Must | 0,5 | 0,25 | Livré |
| US-16 | Rapport de couverture automatique (> 60 %) | Must | 0,5 | 0,25 | Livré |
| US-17 | Rapport de sécurité OWASP Top 10 | Must | 1,5 | 2 | Livré |
| US-18 | Documentation OpenAPI / Swagger | Must | 1,5 | 1,5 | Livré |
| US-19 | README technique | Must | 0,5 | 0,25 | Livré |
| US-20 | ADR et schéma d'architecture | Must | 0,5 | 1 | Livré |
| | **Sous-total engagé** | | **11** | **11,25** | |

### Jules

| US | Intitulé | Priorité | Estimé | Réalisé | Statut |
|---|---|---|---|---|---|
| — | Socle applicatif (Hono, Prisma, Docker, base de test) | Must | 1,5 | 1,5 | Livré |
| US-09 | Authentification JWT | Must | 1,5 | 1,5 | Livré |
| US-04 | CRUD admin médecin et spécialités | Must | 2 | 2 | Livré |
| US-05 | Créneaux disponibles (plannings + calcul) | Must | 2 | 2 | Livré |
| US-06 | Réservation avec gestion des conflits | Must | 2 | 2 | Livré |
| US-07 | Modification et annulation de rendez-vous | Must | 1 | 1 | Livré |
| US-08 | Historique des rendez-vous | Must | 0,5 | 0,5 | Livré |
| | **Sous-total engagé** | | **10,5** | **10,5** | |

**Total engagé au lancement : 21,5 jours-homme** sur une capacité de 22 — soit un engagement à 98 % de la capacité, sans marge de sécurité.

## 4. Ajouts en cours de sprint

Quatre chantiers non prévus au backlog initial ont été identifiés puis intégrés pendant le sprint. Ils ne relèvent pas d'une dérive de périmètre subie : chacun a fait l'objet d'une issue créée en cours de route et d'une décision explicite de le traiter.

| US | Intitulé | Origine | Réalisé | Porté par |
|---|---|---|---|---|
| US-21 | Lint, Prettier et intégration continue | Manque identifié après les premiers modules : aucun garde-fou automatique sur la qualité | 1 | Hervé |
| US-22 | Tests du calcul de créneaux côté gRPC | Le calcul de disponibilité, déplacé côté gRPC en cours de sprint, était livré sans test | 0,5 | Hervé |
| US-23 | En-têtes HTTP de sécurité *(bonus)* | Lacune relevée pendant l'audit OWASP (A05) | 0,5 | Hervé |
| US-24 | Rate limiting anti-force brute *(bonus)* | Lacune relevée pendant l'audit OWASP (A04) | 1 | Hervé |
| — | Exploration de tests E2E (Cucumber) *(bonus)* | Initiative exploratoire, non menée à terme | 0,5 | Jules |
| | **Total ajouté** | | **3,5** | |

**Charge réelle du sprint : 25,25 jours-homme** pour une capacité de 22, soit un dépassement de 15 %. Ce dépassement a été absorbé par une intensification sur la dernière semaine, principalement sur les chantiers de documentation et de sécurité.

## 5. Répartition et logique de découpage

La répartition n'a pas été faite par découpage horizontal (l'un le front, l'autre le back) puisque le livrable est exclusivement une API, mais par **domaine fonctionnel et technique**, avec un principe simple : éviter que deux personnes touchent aux mêmes fichiers en même temps.

**Jules a pris le socle et les modules métier.** Il a démarré le projet (initialisation Hono, Prisma, Docker, base de test) puis l'authentification, ce qui lui donnait la connaissance du socle sur lequel tout le reste s'appuie. Il a ensuite enchaîné sur les modules médecins, spécialités, plannings puis rendez-vous — un enchaînement cohérent, chaque module réutilisant les conventions du précédent.

**Hervé a pris les modules patients, le service gRPC et tout le transverse.** Le module patients d'abord, en parallèle des médecins pour éviter les conflits de fichiers. Puis le service gRPC, isolé dans son propre dossier, donc développable sans interférer avec l'API. Enfin l'ensemble des chantiers transverses : outillage qualité et CI, tests unitaires, documentation OpenAPI, sécurité et documentation d'architecture.

Ce découpage a bien fonctionné sur les modules, mais a produit un **déséquilibre de charge sur la fin du sprint** : la documentation et la sécurité représentant à elles seules 7 jours-homme, elles sont toutes tombées du même côté.

## 6. Bilan de sprint

**Objectif atteint.** Le MVP est fonctionnel et l'ensemble des exigences techniques du sujet est couvert : API REST avec plus de cinq endpoints CRUD, JWT avec deux rôles minimum, service gRPC séparé avec communication démontrée par un contract test, documentation OpenAPI servie en ligne, et 107 tests automatisés pour une couverture de 84,6 % sur `api` et 100 % sur `grpc-service` — largement au-delà du seuil de 60 % demandé.

**Écarts estimé / réalisé notables**

- **US-17 (rapport OWASP) : 1,5 estimé, 2 réalisés.** L'audit a révélé deux défauts réels (une fuite de hash de mot de passe, un contrôle d'accès manquant) qu'il a fallu corriger avant de pouvoir documenter honnêtement l'état du code. Le travail de correction n'avait pas été anticipé dans l'estimation.
- **US-20 (ADR) : 0,5 estimé, 1 réalisé.** L'ADR existant ne couvrait pas deux exigences explicites du sujet (justification du langage et des patterns), et le schéma d'architecture devait être produit au format image.
- **US-15 et US-16 : sous-consommés.** La suite de tests existante satisfaisait déjà l'exigence d'intégration, et l'outil de couverture était déjà en place depuis la mise en œuvre de la CI. Ces deux stories ont été vérifiées et fermées sans développement supplémentaire.

**Enseignements**

1. **Engager 98 % de la capacité était imprudent.** Sans marge, les quatre chantiers ajoutés en cours de route se sont directement traduits en dépassement. Réserver 15 à 20 % de capacité aux imprévus aurait absorbé ces ajouts sans intensification finale.
2. **La qualité transverse aurait dû être engagée dès le début.** Le lint, Prettier et la CI ont été mis en place après les premiers modules, ce qui a imposé une passe de reformatage sur du code déjà écrit. Les intégrer au socle initial aurait coûté moins cher.
3. **Documenter fait trouver des bugs.** Deux défauts de sécurité ont été découverts non pas par un outil d'analyse, mais en relisant le code pour rédiger la documentation OpenAPI. C'est un argument pour ne pas repousser la documentation en fin de sprint — elle joue un rôle de revue.

## 7. Non livré

| US | Intitulé | Priorité | Estimé | Décision |
|---|---|---|---|---|
| US-11 | Authentification à deux facteurs | Must | 2 | **Non engagée.** La capacité étant déjà saturée par les fonctionnalités du MVP et les exigences de test et de documentation, cette story a été écartée du sprint. Le rate limiting mis en place (US-24) apporte une protection partielle contre la force brute, mais ne remplace pas un second facteur. À reprendre en priorité sur un sprint suivant. |

**Bonus non traités**, listés pour mémoire et sans engagement : test E2E complet (exploration entamée, non aboutie), mutation testing, test de charge, observabilité (journalisation structurée et identifiant de corrélation propagé entre services), collection Postman.
# ADR 01 : Choix du langage, du framework, de la base de données, de la communication inter-services, de la sécurité, de l'infrastructure et des patterns applicatifs

## Statut

Accepté — mis à jour le 24/07/2026

## Contexte et problème

Nous devons concevoir une plateforme de prise de rendez-vous médicaux capable de supporter un volume important de requêtes tout en garantissant l'intégrité des données, notamment l'absence de double réservation. Le système doit également offrir une faible latence pour la consultation des disponibilités, rester maintenable dans le temps et permettre une évolution progressive des fonctionnalités. Les données traitées étant des données de santé, la sécurité et la traçabilité des choix techniques constituent une contrainte de premier ordre.

## Facteurs de décision

- Garantir l'intégrité transactionnelle des réservations.
- Réduire la latence des requêtes fréquentes.
- Maintenir une architecture simple à faire évoluer.
- Sécuriser l'authentification et le stockage des mots de passe.
- Faciliter le déploiement, les tests et les migrations.
- Détecter les erreurs le plus tôt possible dans le cycle de développement.
- Préparer l'ajout de fonctionnalités futures comme la géolocalisation.

## Options envisagées

| Dimension | Options |
|---|---|
| Langage | JavaScript, **TypeScript**, Python, Go |
| Framework backend | Express.js, **Hono.js**, Fastify |
| Base de données | MySQL, **PostgreSQL**, MongoDB |
| Communication inter-services | REST/JSON, **gRPC**, message broker uniquement |
| Authentification et hachage | BCrypt + sessions serveur, **Argon2 + JWT**, Scrypt + JWT |
| Infrastructure | Déploiement manuel, Docker uniquement, **Docker + CI/CD** |

## Décision

Nous retenons **TypeScript sur Node.js, Hono.js, PostgreSQL, gRPC, Argon2/JWT et Docker + CI/CD**, car cette combinaison offre le meilleur équilibre entre performance, robustesse, maintenabilité et automatisation pour les besoins actuels de la plateforme.

### Langage : TypeScript sur Node.js

TypeScript a été retenu pour son **typage statique**, qui déplace la détection des erreurs de contrat de l'exécution vers la compilation. Sur une application manipulant des données de santé, une erreur de type sur un identifiant patient ou une date de rendez-vous doit être interceptée avant le déploiement, pas en production.

Ce choix est renforcé par la cohérence de l'outillage : **Prisma génère les types TypeScript directement depuis le schéma de base de données**, et `@grpc/proto-loader` fait de même depuis les fichiers `.proto`. Le contrat de données est donc vérifié de bout en bout — base, code applicatif, échanges inter-services — sans duplication manuelle des définitions de types.

Node.js a été retenu comme environnement d'exécution pour son modèle d'entrées-sorties non bloquantes, adapté à une API dont le temps est majoritairement passé en attente de la base de données plutôt qu'en calcul. La documentation officielle décrit ce modèle événementiel. [https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)

### Framework : Hono.js

Hono.js a été retenu pour sa légèreté, sa compatibilité native avec TypeScript et son positionnement orienté performance. La documentation officielle présente Hono comme un framework web construit sur les standards web et met en avant des résultats de benchmarks. [https://hono.dev/docs/concepts/benchmarks](https://hono.dev/docs/concepts/benchmarks)

### Base de données : PostgreSQL

PostgreSQL a été choisi pour ses garanties transactionnelles et son adéquation avec des applications qui nécessitent de fortes propriétés ACID — condition nécessaire pour empêcher une double réservation sur un même créneau. La documentation PostgreSQL détaille son support des transactions et de l'isolation transactionnelle. [https://www.postgresql.org/files/developer/transactions.pdf](https://www.postgresql.org/files/developer/transactions.pdf)

### Communication inter-services : gRPC

gRPC a été retenu pour les échanges internes entre services, car il fournit un contrat strict via des fichiers `.proto` et une communication efficace adaptée aux appels fréquents entre services. La documentation officielle présente ces concepts et son support multi-plateforme. [https://grpc.io/docs/](https://grpc.io/docs/)

### Sécurité : Argon2 et JWT

Argon2 a été retenu pour le hachage des mots de passe car il est issu de la Password Hashing Competition et conçu pour résister aux attaques par force brute, y compris avec des ressources matérielles spécialisées. Les recherches de référence sur Argon2 décrivent son origine et ses propriétés de sécurité. [https://www.arxiv.org/abs/1602.03097](https://www.arxiv.org/abs/1602.03097)

JWT a été retenu pour l'authentification, avec un *access token* de courte durée et un *refresh token* rotatif stocké en cookie `httpOnly`.

### Infrastructure : Docker et CI/CD

Docker a été choisi pour garantir la reproductibilité des environnements de développement, de test et de production. La documentation Docker présente les conteneurs comme un moyen de standardiser l'exécution des applications et de faciliter le déploiement. [https://docs.docker.com/get-started/docker-overview/](https://docs.docker.com/get-started/docker-overview/)

### Patterns applicatifs

Quatre patterns structurent le code de façon systématique.

**1. Architecture en couches (`controller` / `service` / `dto`).** Chaque module métier sépare le traitement HTTP (lecture de la requête, codes de statut, sérialisation) de la logique métier (règles de gestion, accès aux données) et de la définition des données attendues. Le bénéfice est directement mesurable sur la testabilité : les services étant indépendants du transport HTTP, ils ont pu être testés unitairement en isolant l'accès à la base par simulation, sans démarrer de serveur.

**2. Validation par schéma en frontière (Zod).** Toute entrée client est validée par un schéma déclaratif avant d'atteindre la couche métier. Une requête malformée est rejetée immédiatement avec un `400` explicite, et le reste du code travaille sur des données dont le type et le format sont garantis. Ce pattern constitue également une ligne de défense contre les injections (OWASP A03) et contre l'affectation de champs non prévus, comme une tentative d'auto-attribution de rôle à l'inscription.

**3. Chaîne de middlewares pour les préoccupations transversales.** L'authentification, le contrôle de rôle, la limitation de débit et les en-têtes de sécurité sont implémentés comme des middlewares composables plutôt que dupliqués dans chaque contrôleur. Chaque route déclare explicitement ses exigences (`auth([USER_ROLE.ADMIN])`, `rateLimit({ limit, windowMs })`), ce qui rend la politique de sécurité lisible directement dans la table de routage et évite qu'un endpoint soit oublié lors d'un ajout.

**4. Accès aux données via ORM (Prisma) plutôt que SQL manuscrit.** Prisma génère des requêtes paramétrées par construction, ce qui élimine la classe d'erreur la plus courante en matière d'injection SQL, et produit les types TypeScript depuis le schéma. Une exception assumée subsiste : le service gRPC écrit du SQL brut pour exploiter `generate_series` dans le calcul des créneaux, fonctionnalité PostgreSQL non exprimable via l'ORM. Cette portion utilise exclusivement des requêtes paramétrées.

## Conséquences

### Positives

- Les erreurs de contrat de données sont détectées à la compilation, et les types restent cohérents entre la base, le code et les échanges gRPC sans duplication manuelle.
- Les opérations de réservation bénéficient de garanties transactionnelles fortes.
- Les communications internes gagnent en clarté et en efficacité grâce à un contrat explicite.
- Le stockage des mots de passe est renforcé par un algorithme moderne, conçu pour résister aux attaques par GPU.
- Les environnements sont plus homogènes grâce à Docker.
- Le découpage en couches rend la logique métier testable sans infrastructure, et la politique de sécurité lisible au niveau du routage.
- Le contrat gRPC porte une vraie responsabilité métier (calcul de disponibilité) et non un simple accès à une donnée brute, ce qui renforce la pertinence de gRPC dans l'architecture.

### Négatives

- gRPC ajoute de la complexité d'intégration et de supervision.
- PostgreSQL impose une discipline plus forte sur les migrations et la gestion transactionnelle.
- Docker et CI/CD demandent une mise en place initiale plus structurée.
- TypeScript impose une étape de compilation et une rigueur de typage qui ralentissent l'écriture initiale, au bénéfice de la maintenance.
- Le découpage en couches multiplie le nombre de fichiers par fonctionnalité (trois au minimum), ce qui alourdit les modules très simples.
- Le service gRPC doit interroger à la fois `doctor_schedules` et `appointments`, augmentant son couplage à des données qui n'appartiennent pas à son domaine d'origine (planning).

## Alternatives rejetées

- **JavaScript sans typage** — écarté car il reporte à l'exécution la détection d'erreurs que le compilateur peut intercepter, coût jugé inacceptable sur des données de santé.
- **Python (FastAPI)** et **Go** — tous deux viables, écartés car ils ne permettent pas de partager les types avec un futur frontend TypeScript, et rompent la continuité avec le cahier des charges technique établi en phase de cadrage.
- **Express.js** — écarté au profit de Hono.js pour privilégier un cadre plus léger et plus orienté performance.
- **REST/JSON pour l'inter-service** — considéré, mais gRPC a été privilégié pour les échanges internes fréquents, pour son contrat strict et sa sérialisation plus efficace.
- **BCrypt** — considéré, mais Argon2 a été retenu comme lauréat de la Password Hashing Competition et référence actuelle du domaine.

## Mise à jour (2026-07-22) — Extension du périmètre gRPC

La décision initiale limitait `ScheduleService` à l'exposition du planning récurrent brut (`GetDoctorSchedule`), le calcul des créneaux disponibles devant être effectué par le module Rendez-vous à partir de ce planning et de ses propres données.

En pratique, cette responsabilité a été déplacée côté service gRPC : une nouvelle méthode `GetDoctorAvailableSlots` calcule directement les créneaux disponibles (croisement planning × rendez-vous déjà pris, via une requête SQL utilisant `generate_series`). Ce choix a été conservé car il enrichit la démonstration de communication inter-services — le module Rendez-vous consomme désormais un résultat métier calculé côté gRPC, et non plus seulement une donnée brute — sans remettre en cause le choix technologique initial de gRPC.

## Notes d'implémentation

- Les migrations de schéma devront rester compatibles autant que possible avec les anciennes versions de l'application.
- Les changements cassants devront être découpés en plusieurs étapes.
- Les déploiements devront être automatisés via CI/CD.
- Les décisions d'architecture devront être mises à jour si les contraintes évoluent.
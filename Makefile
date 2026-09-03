# Variables par défaut
s ?= 

.PHONY: env perms init build launch remove logs-all logs ps start stop restart rebuild clean exec stats prisma-generate test-all test-e2e test test-watch test-coverage help


init: env perms # Initialise l'environnement complet (copie .env, droits d'exécution)
	@echo "Initialisation terminée."

env: # Crée le fichier .env à partir de l'exemple s'il n'existe pas déjà
	@if [ ! -f "./docker/.env" ]; then \
		cp ./docker/.env.example ./docker/.env; \
		echo "Created .env from example"; \
	else \
		echo ".env already exists"; \
	fi

perms: # Donne les droits d'exécution au script docker helper
	@chmod +x ./docker/docker.sh

# --- Commandes Docker Standard ---

build: # Construit ou reconstruit les images du docker-compose
	./docker/docker.sh build

launch: # Lance les conteneurs en tâche de fond (build si nécessaire)
	./docker/docker.sh up -d --build

remove: # Arrête les conteneurs et supprime les volumes associés (remise à zéro)
	./docker/docker.sh down -v

logs-all: # Affiche les logs de tous les conteneurs en continu
	./docker/docker.sh logs -f

logs: # Affiche les logs d'un conteneur spécifique ou général (ex: make logs s=api)
	./docker/docker.sh logs -f $(s)

ps: # Liste les conteneurs actifs et leur statut
	./docker/docker.sh ps

start: # Démarre les conteneurs existants (ex: make start ou make start s=api)
	./docker/docker.sh start $(s)

stop: # Arrête temporairement les conteneurs (ex: make stop ou make stop s=api)
	./docker/docker.sh stop $(s)

# --- Commandes Avancées / Rétablissement ---

restart: # Redémarre un ou tous les conteneurs proprement (ex: make restart s=api)
	./docker/docker.sh restart $(s)

rebuild: # Force le rebuild et la relance complète d'un service (ex: make rebuild s=api)
	./docker/docker.sh stop $(s) || true
	./docker/docker.sh rm -f $(s) || true
	./docker/docker.sh up -d --build $(s)

restart-all: # Réinitialise TOUT : détruit les volumes (down -v) et relance proprement (up --build)
	./docker/docker.sh down -v
	./docker/docker.sh up -d --build

remove-service: # Arrête un service, supprime son conteneur et SES VOLUMES associés (ex: make remove-service s=postgres-test)
	@if [ -z "$(s)" ]; then \
		echo "Erreur: Spécifiez un service (ex: make remove-service s=postgres-test)"; \
	else \
		./docker/docker.sh rm -f -s -v $(s); \
	fi

clean-all: # Supprime les conteneurs, réseaux et TOUS les volumes du projet Docker Compose
	./docker/docker.sh down -v --rmi all --remove-orphans

exec: # Ouvre un shell interactif dans un conteneur (ex: make exec s=api)
	@if [ -z "$(s)" ]; then \
		echo "Erreur: Vous devez spécifier un service (ex: make exec s=api)"; \
	else \
		./docker/docker.sh exec -it $(s) sh || ./docker/docker.sh exec -it $(s) /bin/bash; \
	fi

stats: # Affiche la consommation CPU/RAM des conteneurs en temps réel
	docker stats

clean: # Nettoie Docker en supprimant les images, conteneurs et réseaux inutilisés (Prune)
	docker system prune -f
	docker volume prune -f

# --- Base de données & Tests (dans le sous-dossier ./api) ---

lint: # Lance le linter pour vérifier la qualité du code
	@cd api && npm run lint
	@echo "Skipping optional service lint (no extra services)."

prisma-generate: # Génère le client Prisma localement
	@cd api && npm run prisma:generate


prisma-migrate: # Applique les migrations Prisma à la base de données
	@cd api && npm run prisma:migrate

prisma-push: # Applique les migrations Prisma à la base de données et génère le client
	@cd api && npx prisma db push

# --- Tests ---
test-all: # Lance l'intégralité des tests : unitaires, intégration et E2E
	@cd api && npm run test:coverage && npm run test:e2e

test-e2e: # Lance les tests end-to-end Cucumber (parcours de rendez-vous)
	@cd api && npm run test:e2e

test: # Lance les tests en une passe, ciblés ou non (ex: make test s=auth)
	@cd api && npm run test -- run $(s)

test-watch: # Lance les tests en mode surveillance, ciblés ou non (ex: make test-watch s=auth)
	@cd api && npm run test $(s)

test-coverage: # Lance les tests avec couverture de code et génère un rapport
	@cd api && npm run test:coverage

test-coverage-brut: # Lance les tests directement dans api (sans dotenv wrapper)
	@cd api && npx vitest run --coverage
	
# --- Aide ---

help: # Affiche la liste et la description de toutes les commandes disponibles
	@echo "Commandes disponibles :"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*?# .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?# "}; {printf "\033[1;32m%-20s\033[0m %s\n", $$1, $$2}'
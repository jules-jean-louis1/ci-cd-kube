FROM node:22-bookworm-slim AS base
LABEL \
    org.opencontainers.image.title="api_healthsync" \
    org.opencontainers.image.licences="MIT"

RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
RUN chown node:node /usr/src/app

# DEVELOPMENT
FROM base AS development
LABEL org.opencontainers.image.ref.name="dev"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=development
USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD [ "dumb-init", "sh", "-c", "npx prisma generate && npm run dev" ]

# PRODUCTION
FROM base AS production
LABEL org.opencontainers.image.ref.name="prod"

ENV NODE_ENV=production
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node --from=development /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=development /usr/src/app/node_modules/@prisma ./node_modules/@prisma

COPY --chown=node:node --from=development /usr/src/app/dist ./dist

EXPOSE 3000
CMD [ "dumb-init", "node", "dist/index.js" ]

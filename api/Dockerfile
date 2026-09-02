FROM node:22-bookworm-slim AS base

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

RUN chown node:node /usr/src/app


FROM base AS development

ENV NODE_ENV=development

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci

COPY --chown=node:node . .

RUN npx prisma generate

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "run", "dev"]


FROM node:22-bookworm-slim AS dependencies

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci


FROM dependencies AS build

COPY . .

RUN npx prisma generate
RUN npm run build


FROM node:22-bookworm-slim AS production-dependencies

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci --omit=dev


FROM gcr.io/distroless/nodejs22-debian12:nonroot AS production

LABEL \
    org.opencontainers.image.title="api_taskmanager" \
    org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=production-dependencies --chown=nonroot:nonroot \
    /usr/src/app/node_modules ./node_modules

COPY --from=build --chown=nonroot:nonroot \
    /usr/src/app/dist ./dist

COPY --from=build --chown=nonroot:nonroot \
    /usr/src/app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build --chown=nonroot:nonroot \
    /usr/src/app/node_modules/@prisma ./node_modules/@prisma

USER nonroot:nonroot

EXPOSE 3000

CMD ["dist/index.js"]

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
    org.opencontainers.image.title="api_healthsync" \
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

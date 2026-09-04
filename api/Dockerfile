FROM node:22-bookworm-slim AS base

WORKDIR /usr/src/app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends dumb-init \
	&& rm -rf /var/lib/apt/lists/*


FROM base AS dependencies

ENV NODE_ENV=development

RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential python3 \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci --no-audit --no-fund


FROM dependencies AS development

COPY . .

RUN npx prisma generate

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "run", "dev"]


FROM dependencies AS build

COPY . .

RUN npx prisma generate \
	&& npm run build


FROM node:22-bookworm-slim AS production-dependencies

WORKDIR /usr/src/app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends build-essential python3 \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund \
	&& npm cache clean --force


FROM gcr.io/distroless/nodejs22-debian13:nonroot AS production

LABEL org.opencontainers.image.title="taskmanager-api"

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=production-dependencies --chown=nonroot:nonroot \
	/usr/src/app/node_modules ./node_modules

COPY --from=build --chown=nonroot:nonroot \
	/usr/src/app/dist ./dist

COPY --from=build --chown=nonroot:nonroot \
	/usr/src/app/swagger.yaml ./dist/swagger.yaml

COPY --from=build --chown=nonroot:nonroot \
	/usr/src/app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build --chown=nonroot:nonroot \
	/usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["dist/src/index.js"]

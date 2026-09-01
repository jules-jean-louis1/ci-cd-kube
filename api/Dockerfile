FROM node:22-bullseye AS base
LABEL \
    org.opencontainers.image.title="api_healthsync"\
    org.opencontainers.image.licences="MIT"

RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
RUN chown node:node /usr/src/app

FROM base AS development
LABEL \
    org.opencontainers.image.version="1.0" \
    org.opencontainers.image.ref.name="dev"

ENV NODE_ENV=development

USER node
COPY --chown=node:node package*.json ./

RUN npm i

COPY --chown=node:node . .

EXPOSE 3000
CMD [ "dumb-init", "sh", "-c", "npm run prisma:generate && npm run dev" ]
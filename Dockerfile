FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY ./pnpm-lock.yaml ./package.json ./

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY ./src ./src
COPY ./decoder.yaml ./decoder.yaml

EXPOSE 5000/udp
EXPOSE 5000/tcp

CMD [ "pnpm", "start" ]


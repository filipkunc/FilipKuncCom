# Multi-stage build. The "build" stage is a placeholder for future tooling
# (TypeScript compile, bundler, prisma generate, etc.). Today it just gathers
# the production tree so the final stage is minimal.

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY package.json ./
# When real deps exist:
# COPY package-lock.json ./
# RUN npm ci --omit=dev
COPY src ./src

FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

# GIT_SHA is the only build-time variable that matters: it is the artifact's
# identity. Bake it as an env var so the running container can surface it
# (response bodies, logs, traces).
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}
ENV NODE_ENV=production
ENV PORT=8080

# Run as non-root. The official node image already ships a `node` user.
COPY --from=build --chown=node:node /app /app
USER node

EXPOSE 8080

# Exec form — node becomes PID 1 and receives SIGTERM directly.
CMD ["node", "src/server.js"]

# Multi-stage build for the Astro static site + tiny Node static server.
# The image is the only release artifact.
# Runtime stage has no node_modules: server is pure Node-builtins, site is static.

ARG NODE_VERSION=24-alpine

# --- build stage -------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app

# Install deps with a clean cache. package-lock.json is the integrity check.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Bring in source + static assets and build.
COPY tsconfig.json astro.config.mjs snippet-manifest.json ./
COPY src ./src
COPY public ./public
# Build scripts: `npm run build` runs scripts/gen-og.mjs (OG image generation)
# before astro build.
COPY scripts ./scripts
# The gpu-normals post excerpts the real benchmark kernel sources at build time
# (CUDA/OpenCL/Slang live here, outside src). Build-stage only; the runtime
# image takes just dist + server-dist below.
COPY bench ./bench

# The build bakes the commit into "view on GitHub" source links, so the line
# anchors are pinned to exactly what shipped. No .git here, hence the arg.
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}

# astro build → dist/ ; tsc → server-dist/
RUN npm run build

# --- runtime stage -----------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app

ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}
ENV NODE_ENV=production
ENV PORT=8080

# Only what the server needs at runtime: the static site + the compiled server.
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server-dist ./server-dist

USER node
EXPOSE 8080

# Exec form — node becomes PID 1 and receives SIGTERM directly.
CMD ["node", "server-dist/index.js"]

# Sandbox image for one agent trial. The whole project is baked in at the red
# baseline; nothing from the host is mounted at run time. The agent's entire
# world is this image, so it cannot reach the real repo.
FROM node:24-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Claude Code CLI, installed globally so the unprivileged user can run it.
RUN npm install -g @anthropic-ai/claude-code

# Claude Code refuses --dangerously-skip-permissions as root, so run as the
# image's built-in non-root `node` user. /work holds the transcript and result.
RUN mkdir -p /app /work && chown node:node /app /work
WORKDIR /app
ENV HOME=/home/node

COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci

COPY --chown=node:node . .

# Stash the pristine contract (for tamper detection) and the hidden acceptance
# tests OUTSIDE /app, then remove the judge from the agent's reach.
RUN cp test/contract.test.js /home/node/contract.test.js.orig \
 && cp judge/acceptance.test.js /home/node/acceptance.test.js \
 && rm -rf judge

ENTRYPOINT ["bash", "/app/container/run-trial.sh"]

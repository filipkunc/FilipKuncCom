# filipkunc.com

My [personal website](https://filipkunc.com) where I write content and demos of my work with a big help from Claude.

It is a static [Astro](https://astro.build) + MDX site served by a tiny Node static server, packaged as a container and deployed to a small [Hetzner](https://www.hetzner.com) box behind [Caddy](https://caddyserver.com).

## Run it locally

```sh
npm install
npm run dev      # http://localhost:4321
```

Other scripts:

- `npm run build` — build the static site and the Node server
- `npm run preview` — serve the built site
- `npm run check` — type-check the site and the server
- `npm run verify` — run the posts' code snippets and capture their output
- `./deploy.sh --build-only` — build the deploy image without shipping it

## Deploying

Every push to `main` deploys automatically: the GitHub Actions workflow
(`.github/workflows/deploy.yml`) runs `./deploy.sh` on the runner — same build,
same SSH transfer, same health check as a workstation deploy. It needs two
repository secrets, `DEPLOY_SSH_KEY` (a dedicated key authorized for the deploy
user on the box) and `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan filipkunc.com`) — run
`./scripts/setup-actions-deploy.sh` once from a machine with SSH access to the
box to generate, authorize, and upload both. A
manual `Rollback` workflow retags a previously-shipped image via
`./rollback.sh`. Running `./deploy.sh` locally still works unchanged.

## Layout

- `src/content/posts/` — the posts, one folder per post (`index.mdx` plus its assets)
- `src/components/` — the interactive demos (Monaco editors, the type/JSON validator, diagrams)
- `src/server/` — the static file server that ships in the image
- `ansible/` — one-time provisioning for the box
- `deploy.sh`, `rollback.sh` — build the image locally and ship it over SSH. `./deploy.sh --build-only` stops after the local build, reproducing the container's `.dockerignore` context so it catches issues that `npm run build` (which builds the working tree directly) cannot

Some posts run their own code at build time, so the snippets you read are exactly what ran. The headers on those snippets link back to the lines here on GitHub. See `npm run verify` and `src/lib/snippets.ts` for how that works.

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

## Layout

- `src/content/posts/` — the posts, one folder per post (`index.mdx` plus its assets)
- `src/components/` — the interactive demos (Monaco editors, the type/JSON validator, diagrams)
- `src/server/` — the static file server that ships in the image
- `ansible/` — one-time provisioning for the box
- `deploy.sh`, `rollback.sh` — build the image locally and ship it over SSH

Some posts run their own code at build time, so the snippets you read are exactly what ran. The headers on those snippets link back to the lines here on GitHub. See `npm run verify` and `src/lib/snippets.ts` for how that works.

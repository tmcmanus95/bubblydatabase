# CLAUDE.md — BubblyDB

RateYourMusic-style sparkling water rating site. MERN (MongoDB, Express, React, Node). Live, with real users. Tone: fun and silly.

## Start / end of every session

- Start: read `docs/HANDOFF.md`, then `docs/ROADMAP.md`. Spec: `docs/SPEC.md`.
- End: update `docs/HANDOFF.md` and `docs/ROADMAP.md`; log decisions in `docs/DECISIONS.md`.
- Sessions are short (15–60 min). Keep tickets small enough to finish in one session.

## Hard rules

1. **Never connect to the production database.** Use local/staging only. Production migrations are run by Thomas.
2. Every schema change = a reversible migration script in `migrations/` with an `up` and `down`, tested against staging data.
3. Never delete or rename existing fields/collections holding user data without a migration and explicit approval.
4. No forced password resets. Auth changes must keep existing hashes valid (rehash on login if needed).
5. Server-side authorization for every admin/moderation route.
6. Validate all input (zod/joi) and sanitize Mongo queries. No raw user objects in queries.
7. AI-generated product data is always a draft submission. Never auto-publish.
8. Surgical edits over rewrites; small reviewable diffs; run tests before saying done.
9. Production = Render service + Atlas database "bubblydatabase3". Never request, read or use
   production credentials. Local and staging use `bubblydatabase3_staging` only (via a DB user
   with no access to production).
10. **No third-party images in our storage.** Never download, scrape, or rehost product photos or brand
    logos from the web. Product visuals are generated text/color cards (or photos we own / user uploads
    with a license grant). Brand _names_ in text are fine; brand _logos_ are not used.
11. Amazon product images and data appear only via Amazon's official API (Creators API; PA-API is
    deprecated), only inside the affiliate "Where to buy" block, and are never stored, cached beyond
    the API terms, or passed to any AI/LLM feature (Amazon's agreement prohibits this).

## Conventions

- Search state lives in URL query params; there is one search page.
- Product aggregates (`avgRating`, `ratingCount`, `reviewCount`) are denormalized and updated on write.
- Prefer `Map`/`Set` and Mongo aggregation over nested loops.
- Flavor colors: OKLCH tokens with separate light/dark values in the theme file. Animated glow borders respect `prefers-reduced-motion`.
- Aesthetic: playful, illustrated, hand-made (reference: Aura Bora). Avoid generic "AI-generated" UI patterns (gradient meshes everywhere, glassmorphism, stock icon sets).
- Accessibility: keyboard operable, visible focus, alt text, WCAG AA contrast.
- Product cards are typographic: the flavors' colors fill the card (`client/src/theme/flavorSurface.js`;
  one hard-edged band per flavor), the brand name is set in that brand's font (`brandFonts.js`), and the
  score badge + stars are the anchor (layout "B · Score sticker"). No brand colors. Color knobs live in
  `client/src/theme/colorSettings.js`; tune them live at `/working/colors` (Color Lab). Flavor-category icons are our own assets. No product
  photos required to ship.

## Commands

Setup: copy `server/.env.example` to `server/.env` (staging values only).

- `npm run dev` — server (:3000, restarts on change) + client (:5001, proxies `/graphql`)
- `npm test` — all tests: server (in-memory MongoDB, never Atlas) + backup/restore scripts. CI runs it on every PR
- `cd server && npm start` — API only
- New server tests: `server/tests/*.test.js`, using `startTestServer()` from `server/tests/helpers.js`
- `EMAIL_MODE=log` — never send email (tests, staging); messages go to the console
- `cd server && node seeders/<script>.js` — maintenance scripts; staging/local only (`seed.js` also needs `--yes-drop-staging`)
- `scripts/backup.sh` / `scripts/restore.sh` — encrypted backups; see `docs/RUNBOOK.md`
- `npm run staging:refresh` — reload staging from the latest backup and scrub emails (RUNBOOK)
- Planned: `npm run migrate:up` / `migrate:down` (P1-11, staging only)

## Branches

- `main` = production (Render auto-deploys it). `staging` = the staging Render service (P0-8).
- Work on a short branch from `staging` → PR into `staging` (auto-deploys to the staging site) → verify
  there → Thomas releases with a PR `staging` → `main`.
- Hotfixes branch from `main` and PR straight into `main`; then merge `main` back into `staging`.
- `new-aesthetic` holds Thomas's design WIP; leave it alone.

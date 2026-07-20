# CLAUDE.md

## Build Commands

```bash
npm install
npm run dev      # local dev server (http://localhost:4321)
npm run build     # static build to dist/
npm run check     # astro check (types)
npm test          # vitest unit tests
```

## Structure

- `src/pages/index.astro` — landing page.
- `src/content/docs/guides/` — Starlight guide content (MDX). File path under `guides/` maps
  directly to its route, e.g. `guides/advanced/multi-instance.mdx` → `/guides/advanced/multi-instance/`.
  Sidebar order is set per-file via frontmatter `sidebar: { order: N }`; no config changes needed
  to add a new guide.
- `src/lib/` — pure data/logic modules (nav links, feature list), each with a co-located
  `*.test.ts` run by `npm test`.
- `src/components/` — Astro presentational components.
- `src/styles/tokens.css` — design tokens (palette) derived from `assets/brand/logo-source.png`.

## Conventions

- Screenshots are hotlinked from `read-flow/read-flow`'s `screenshots` git branch
  (`https://raw.githubusercontent.com/read-flow/read-flow/screenshots/<file>.png`) — never
  duplicated into this repo, so they stay in sync with the app repo automatically.
- Guide content (`src/content/docs/guides/`) should stay in sync with `read-flow/read-flow`'s
  `README.md` and `read-flow.toml`/`core/src/settings.rs` — when that repo's config keys or
  install steps change, update the corresponding guide here in the same PR if possible.
- Every new pure-logic module in `src/lib/` needs a co-located `*.test.ts` (Vitest).
- Dark-mode-only palette for v1 — see the design tokens in `src/styles/tokens.css` before
  introducing new colors.

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
  Top-level order (Guides intro, Install, Setup, then the "Advanced" group) is fixed manually in
  `astro.config.mjs`'s `sidebar` items. Within `guides/advanced/`, order is set per-file via
  frontmatter `sidebar: { order: N }` — new advanced guides need no config changes, but a new
  top-level guide does.
- `src/lib/` — pure data/logic modules (nav links, feature list), each with a co-located
  `*.test.ts` run by `npm test`.
- `src/components/` — Astro presentational components.
- `src/styles/tokens.css` — design tokens (palette) derived from `assets/brand/logo-source.png`.

## Conventions

- Screenshots live locally in `src/assets/screenshots/` and are generated, not hand-captured.
  Run the `screenshot_tool` binary in the `read-flow/read-flow` repo (behind the
  `screenshot-tool` Cargo feature) against this repo's `assets/sample-library/`:
  `cargo run -p read-flow --features screenshot-tool -- --sample-library <path to
  assets/sample-library> --out <path to src/assets/screenshots>`. It renders each app page
  headlessly (no display server, no live network) and writes PNGs straight to `--out`.
  Regenerate and re-commit them whenever the relevant app UI changes.
- Guide content (`src/content/docs/guides/`) should stay in sync with `read-flow/read-flow`'s
  `README.md` and `read-flow.toml`/`core/src/settings.rs` — when that repo's config keys or
  install steps change, update the corresponding guide here in the same PR if possible.
- Every new pure-logic module in `src/lib/` needs a co-located `*.test.ts` (Vitest).
- Dark-mode-only palette for v1 — see the design tokens in `src/styles/tokens.css` before
  introducing new colors. `assets/brand/color-palette.md` is the source of truth for the
  palette itself (derivation, contrast ratios) and for the rules book covers must follow
  (accent-colored background, `bg`-colored text, one distinct composition per title) —
  read it before regenerating covers or touching `tokens.css`.

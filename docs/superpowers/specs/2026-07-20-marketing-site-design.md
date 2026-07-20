# Read Flow marketing/docs site — design

## Goal

A public website for Read Flow that:
1. Markets the app to new users (landing page).
2. Guides installation and initial setup/configuration.
3. Documents advanced/technical features (multi-instance remote sources, OPDS, headless+PWA pairing, reverse proxy/TLS) in a how-to format.

Repo: `read-flow.github.io` (sibling to `read-flow/read-flow` and `read-flow/read-flow-pdf` locally; separate git history from the app repo). Named to match GitHub Pages' org-root convention: pages served at `https://read-flow.github.io/` once pushed to the `read-flow` GitHub org.

## Stack

- **Astro** for the landing page — full design control, minimal shipped JS, static output.
- **Starlight** (Astro's docs framework) for the guides section (`/guides/`) — built-in sidebar nav, search, prev/next, versioned-content-ready. Mounted as an Astro integration in the same project (one repo, one build), not a separate app.
- **Deploy**: GitHub Actions → GitHub Pages, triggered on push to `main`. Static output only, no server runtime needed.
- **Domain**: `read-flow.github.io` (org default). No custom domain for v1.

## Visual identity

Direction: **Bold & Modern** — gradient hero, saturated accent colors, rounded cards, dark-mode-first. Palette derived from the existing "cosmic book" app icon (`assets/brand/logo-source.png`, also the source for the COSMIC desktop app's icon):

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#120A2A` | Page background (darkest) |
| `bg-2` | `#1B1140` | Section/card background |
| `primary` | `#5B3DE0` | Links, nav highlights, primary UI accent |
| `book` (secondary) | `#38BDF8` | "Reading" motifs, secondary accent |
| `cta-gradient` | `#ec4899 → #f97316 → #fbbf24` | Primary buttons, highlight badges — echoes the fanned book pages in the icon |
| text | near-white / muted gray | Body copy on dark background |

Light mode: not required for v1 (dark-mode-first per Bold & Modern direction); revisit if user feedback asks for it.

**Icon usage**: favicon and small nav-bar mark only (paired with a wordmark). Not used as large hero art — the hero uses an actual app screenshot instead, so first-time visitors see the real product immediately.

## Site structure

```
/                       Landing page (Astro, custom layout)
/guides/                Starlight docs section
  /guides/install/        Per-platform install (deb, tarball, Flatpak, macOS)
  /guides/setup/           read-flow.toml walkthrough, scan folders, first run
  /guides/advanced/        Multi-instance/remote sources, OPDS catalogs,
                            headless server + PWA pairing, reverse proxy/TLS
```

No comparison page, roadmap page, or About/FAQ in v1 — kept out of scope to stay focused on marketing + getting-started + advanced docs.

## Landing page layout (story-led)

1. Sticky top nav: wordmark + small icon mark, links to Features/Install/Guides/GitHub.
2. Hero: headline + subhead only (no screenshot yet) — sets up the problem: scattered PDFs/EPUBs across devices, no local-first way to organize them.
3. Problem statement section: short, scannable — the pain of unorganized libraries, cloud-dependent readers.
4. Alternating feature rows, each paired with a small screenshot: scanning/dedup, tags & auto-tagging, reading status sync, built-in PDF/EPUB readers, OPDS catalogs, fuzzy search, private mode.
5. "Three ways in" explainer: Desktop app / Headless server / PWA — how they relate, backed by the same library.
6. Install CTA band: links to `/guides/install/` and GitHub Releases.
7. Footer: GitHub, Releases, License (AGPL-3.0-or-later / MIT per crate — link to repo's LICENSE files rather than restating), Guides.

## Content sourcing

Install/setup guide content is adapted from `read-flow/read-flow`'s `README.md` and `read-flow.toml` config sections (`[database]`, `[client]`, `[server]`, `[scan]`, `[ui]`, `[online_library]`) — this doc doesn't restate that content; the implementation plan will pull current values from the source repo at write time so the guide doesn't drift from what's actually shipped.

## Repo conventions (new repo, no existing CLAUDE.md yet)

Implementation plan should propose a minimal `CLAUDE.md` for this repo covering: Astro/Starlight build commands, content update workflow (guides live as Markdown/MDX under `src/content/`), and image/asset conventions (screenshots sourced from `read-flow/read-flow`'s `screenshots` git branch via direct URL, per the README pattern, rather than duplicated into this repo — avoids stale copies).

## Out of scope (v1)

- Custom domain.
- Light mode.
- Comparison/roadmap/about pages.
- Blog/changelog surface.
- i18n (site is English-only; the *app* is en/fr/nl, that's unrelated).

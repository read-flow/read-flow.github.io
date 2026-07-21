# Read Flow Marketing/Docs Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship `read-flow.github.io` — an Astro landing page marketing Read Flow plus a Starlight-powered `/guides/` section (install, setup, advanced/technical how-tos), deployed to GitHub Pages via Actions.

**Architecture:** Single Astro project. `src/pages/index.astro` is a hand-built landing page (Astro components, no framework UI runtime). `src/content/docs/guides/**` is a Starlight content collection — Starlight owns the `/guides/*` routes only, leaving `/` free for the custom landing page. Pure data (nav links, feature list) lives in `src/lib/*.ts` with co-located Vitest unit tests; everything else (layout, components, CSS, guide content) is verified by `astro build`/`astro check` succeeding.

**Tech Stack:** Astro 5, `@astrojs/starlight`, TypeScript, Vitest, plain CSS (custom properties, no framework), GitHub Actions + `actions/deploy-pages`.

## Global Constraints

- Repo: `read-flow.github.io` (already created, git-initialized, default branch `main`, at `/Users/peterpaul/src/personal/read-flow/read-flow.github.io`).
- Site config `site: 'https://read-flow.github.io'`, no `base` path, no custom domain (v1).
- Package manager: `npm` (matches `read-flow/read-flow`'s `pwa/` convention). Node ≥ 20.
- Palette (exact hex, from `docs/superpowers/specs/2026-07-20-marketing-site-design.md`):
  - `--color-bg: #120A2A`
  - `--color-bg-2: #1B1140`
  - `--color-primary: #5B3DE0`
  - `--color-book: #38BDF8`
  - CTA gradient: `#ec4899 → #f97316 → #fbbf24`
- Dark-mode only for v1 — no light theme toggle.
- The cosmic-book icon (`assets/brand/logo-source.png`, already committed) is used **only** as favicon + small nav-bar mark — never as large hero art. Hero uses real app screenshots instead.
- Screenshots are hotlinked from `read-flow/read-flow`'s `screenshots` git branch (`https://raw.githubusercontent.com/read-flow/read-flow/screenshots/<file>.png`) — never duplicated into this repo.
- Landing page section order (story-led, fixed): Nav → Hero (headline+subhead only) → Problem statement → Alternating feature rows w/ screenshots → Three-ways-in (Desktop/Headless/PWA) → Install CTA band → Footer.
- No comparison/roadmap/about pages, no light mode, no custom domain, no i18n — all out of scope for v1 per the spec.
- Footer license link points at the source repo's `NOTICE` file — never restate license terms on this site.

---

### Task 1: Project scaffold (Astro, no integrations yet)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `src/pages/index.astro`

**Interfaces:**
- Produces: `npm run build`, `npm run dev`, `npm run check`, `npm test` scripts, used by every later task.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "read-flow-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://read-flow.github.io',
  integrations: [],
});
```

- [ ] **Step 4: Write a placeholder `src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Read Flow</title>
  </head>
  <body>
    <p>Coming soon.</p>
  </body>
</html>
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: exits 0, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: exits 0, `dist/index.html` exists containing "Coming soon."

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json astro.config.mjs src/pages/index.astro
git commit -m "chore: scaffold Astro project"
```

---

### Task 2: Add Starlight integration for `/guides/`

**Files:**
- Modify: `package.json` (add `@astrojs/starlight` dependency)
- Modify: `astro.config.mjs`
- Create: `src/content.config.ts`
- Create: `src/content/docs/guides/index.mdx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `/guides/` route tree (Starlight), sidebar auto-generated from `src/content/docs/guides/**`. Later guide-content tasks (13–15) add files under this same directory — no further config changes needed for those.

- [ ] **Step 1: Add the Starlight dependency**

Edit `package.json` `dependencies` to:

```json
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/starlight": "^0.32.0"
  },
```

- [ ] **Step 2: Rewrite `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://read-flow.github.io',
  integrations: [
    starlight({
      title: 'Read Flow Guides',
      description: 'Install, setup, and advanced guides for Read Flow.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/read-flow/read-flow' }],
      sidebar: [{ label: 'Guides', autogenerate: { directory: 'guides' } }],
    }),
  ],
});
```

- [ ] **Step 3: Write `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

- [ ] **Step 4: Write `src/content/docs/guides/index.mdx`**

```mdx
---
title: Guides
description: Install, configure, and get the most out of Read Flow.
sidebar:
  order: 0
---

Start here: install Read Flow, then set up your library. Power users can dig into the advanced
guides for multi-instance setups, OPDS catalogs, headless + PWA pairing, and TLS.
```

- [ ] **Step 5: Install and verify**

Run: `npm install && npm run build`
Expected: exits 0. `dist/guides/index.html` exists. If the build fails on a Starlight/Astro content-collection API mismatch, check the installed `@astrojs/starlight` version's docs — the `docsLoader()` API is current as of Starlight 0.32/Astro 5 but may have moved.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/content.config.ts src/content/docs/guides/index.mdx
git commit -m "feat: add Starlight guides section"
```

---

### Task 3: Design tokens and global CSS

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: CSS custom properties (`--color-bg`, `--color-bg-2`, `--color-primary`, `--color-book`, `--color-cta-start/mid/end`, `--color-text`, `--color-text-muted`, `--radius-lg`, `--radius-md`, `--font-sans`) and a `.cta-button` class, consumed by every component task from Task 6 onward.

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root {
  --color-bg: #120a2a;
  --color-bg-2: #1b1140;
  --color-primary: #5b3de0;
  --color-book: #38bdf8;
  --color-cta-start: #ec4899;
  --color-cta-mid: #f97316;
  --color-cta-end: #fbbf24;
  --color-text: #f5f3ff;
  --color-text-muted: #a9a3c7;
  --font-sans:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --radius-lg: 16px;
  --radius-md: 8px;
}
```

- [ ] **Step 2: Write `src/styles/global.css`**

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.5;
}

a {
  color: var(--color-book);
}

.cta-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  background: linear-gradient(
    135deg,
    var(--color-cta-start),
    var(--color-cta-mid),
    var(--color-cta-end)
  );
  color: #1a1a1a;
  font-weight: 700;
  text-decoration: none;
}
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build`
Expected: exits 0 (these files aren't imported yet, but must be valid CSS — check for typos by running `npx astro check`).

- [ ] **Step 4: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css
git commit -m "feat: add design tokens and global styles"
```

---

### Task 4: Nav link data + tests

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/nav-links.ts`
- Test: `src/lib/nav-links.test.ts`

**Interfaces:**
- Produces: `NavLink` interface (`{ label: string; href: string }`), `NAV_LINKS: NavLink[]`, `validateNavLinks(links: NavLink[]): void`. Consumed by `SiteNav.astro` (Task 6).

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 2: Write the failing test**

`src/lib/nav-links.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NAV_LINKS, validateNavLinks, type NavLink } from './nav-links';

describe('validateNavLinks', () => {
  it('accepts the real nav config without throwing', () => {
    expect(() => validateNavLinks(NAV_LINKS)).not.toThrow();
  });

  it('throws on a duplicate href', () => {
    const links: NavLink[] = [
      { label: 'A', href: '/a/' },
      { label: 'B', href: '/a/' },
    ];
    expect(() => validateNavLinks(links)).toThrow('Duplicate nav link href: /a/');
  });

  it('throws on an empty label', () => {
    const links: NavLink[] = [{ label: '  ', href: '/a/' }];
    expect(() => validateNavLinks(links)).toThrow('Nav link is missing a label');
  });

  it('throws on an empty href', () => {
    const links: NavLink[] = [{ label: 'A', href: '  ' }];
    expect(() => validateNavLinks(links)).toThrow('Nav link "A" is missing an href');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/lib/nav-links.test.ts`
Expected: FAIL — cannot find module `./nav-links`.

- [ ] **Step 4: Write `src/lib/nav-links.ts`**

```ts
export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Install', href: '/guides/install/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'GitHub', href: 'https://github.com/read-flow/read-flow' },
];

export function validateNavLinks(links: NavLink[]): void {
  const seen = new Set<string>();
  for (const link of links) {
    if (!link.label.trim()) {
      throw new Error('Nav link is missing a label');
    }
    if (!link.href.trim()) {
      throw new Error(`Nav link "${link.label}" is missing an href`);
    }
    if (seen.has(link.href)) {
      throw new Error(`Duplicate nav link href: ${link.href}`);
    }
    seen.add(link.href);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/lib/nav-links.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/lib/nav-links.ts src/lib/nav-links.test.ts package.json
git commit -m "feat: add nav link data with validation"
```

---

### Task 5: Feature list data + tests

**Files:**
- Create: `src/lib/features.ts`
- Test: `src/lib/features.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Feature` interface (`{ slug: string; title: string; description: string; screenshot: string }`), `FEATURES: Feature[]`, `validateFeatures(features: Feature[]): void`, `screenshotUrl(filename: string): string`. Consumed by `FeatureRow.astro` / `FeaturesSection.astro` (Task 8).

- [ ] **Step 1: Write the failing test**

`src/lib/features.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FEATURES, screenshotUrl, validateFeatures, type Feature } from './features';

describe('validateFeatures', () => {
  it('accepts the real feature list without throwing', () => {
    expect(() => validateFeatures(FEATURES)).not.toThrow();
  });

  it('throws on a duplicate slug', () => {
    const features: Feature[] = [
      { slug: 'a', title: 'A', description: 'x', screenshot: 'a.png' },
      { slug: 'a', title: 'B', description: 'y', screenshot: 'b.png' },
    ];
    expect(() => validateFeatures(features)).toThrow('Duplicate feature slug: a');
  });

  it('throws on a missing description', () => {
    const features: Feature[] = [{ slug: 'a', title: 'A', description: '  ', screenshot: 'a.png' }];
    expect(() => validateFeatures(features)).toThrow('Feature "A" is missing a description');
  });

  it('throws on a missing screenshot', () => {
    const features: Feature[] = [{ slug: 'a', title: 'A', description: 'x', screenshot: '  ' }];
    expect(() => validateFeatures(features)).toThrow('Feature "A" is missing a screenshot');
  });
});

describe('screenshotUrl', () => {
  it('builds a raw githubusercontent URL against the screenshots branch', () => {
    expect(screenshotUrl('dark-dashboard.png')).toBe(
      'https://raw.githubusercontent.com/read-flow/read-flow/screenshots/dark-dashboard.png',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/features.test.ts`
Expected: FAIL — cannot find module `./features`.

- [ ] **Step 3: Write `src/lib/features.ts`**

```ts
export interface Feature {
  slug: string;
  title: string;
  description: string;
  screenshot: string;
}

export const FEATURES: Feature[] = [
  {
    slug: 'scanning',
    title: 'Automatic scanning & de-duplication',
    description:
      'Read Flow scans your document folders and fingerprints every file with SHA-256, so duplicates are caught even if they were renamed or copied.',
    screenshot: 'dark-document-list.png',
  },
  {
    slug: 'tags',
    title: 'Tags & auto-tagging',
    description:
      'Organize your library with tags, and define rules that tag documents automatically as they are discovered.',
    screenshot: 'dark-document-list.png',
  },
  {
    slug: 'progress',
    title: 'Reading status & progress',
    description:
      'Mark documents Unread, Reading, or Read, and pick up exactly where you left off — kept in sync across your devices.',
    screenshot: 'dark-dashboard.png',
  },
  {
    slug: 'readers',
    title: 'Built-in PDF & EPUB readers',
    description:
      'A native PDF viewer and EPUB reader render your books directly in the app — no external tools needed.',
    screenshot: 'dark-epub-reader.png',
  },
  {
    slug: 'opds',
    title: 'Online libraries (OPDS)',
    description:
      'Search and pull public-domain titles straight from catalogs like Project Gutenberg and Standard Ebooks.',
    screenshot: 'dark-opds-search.png',
  },
  {
    slug: 'search',
    title: 'Fuzzy search',
    description: 'Find what you want in the web app even with typos or partial titles.',
    screenshot: 'dark-opds-search.png',
  },
  {
    slug: 'private-mode',
    title: 'Private mode',
    description: 'Hide sensitive documents behind a private-tag filter, on-device.',
    screenshot: 'dark-dashboard.png',
  },
];

export function validateFeatures(features: Feature[]): void {
  const seen = new Set<string>();
  for (const feature of features) {
    if (!feature.slug.trim()) {
      throw new Error(`Feature "${feature.title}" is missing a slug`);
    }
    if (seen.has(feature.slug)) {
      throw new Error(`Duplicate feature slug: ${feature.slug}`);
    }
    seen.add(feature.slug);
    if (!feature.description.trim()) {
      throw new Error(`Feature "${feature.title}" is missing a description`);
    }
    if (!feature.screenshot.trim()) {
      throw new Error(`Feature "${feature.title}" is missing a screenshot`);
    }
  }
}

export function screenshotUrl(filename: string): string {
  return `https://raw.githubusercontent.com/read-flow/read-flow/screenshots/${filename}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/features.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/features.ts src/lib/features.test.ts
git commit -m "feat: add feature list data with validation"
```

---

### Task 6: Base layout, nav, footer components

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteNav.astro`
- Create: `src/components/SiteFooter.astro`
- Modify: `src/pages/index.astro` (temporarily use `BaseLayout` + `SiteNav` + `SiteFooter` to verify wiring)

**Interfaces:**
- Consumes: `NAV_LINKS` from `src/lib/nav-links.ts` (Task 4), `global.css` from Task 3.
- Produces: `BaseLayout` (props: `title: string`, `description: string`, default slot), `SiteNav`, `SiteFooter` — consumed by Task 11's final `index.astro` assembly.

- [ ] **Step 1: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Write `src/components/SiteNav.astro`**

```astro
---
import { NAV_LINKS } from '../lib/nav-links';
---
<header class="site-nav">
  <a class="brand" href="/">
    <span>Read Flow</span>
  </a>
  <nav>
    <ul>
      {NAV_LINKS.map((link) => (
        <li><a href={link.href}>{link.label}</a></li>
      ))}
    </ul>
  </nav>
</header>

<style>
  .site-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: var(--color-bg-2);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text);
    text-decoration: none;
    font-weight: 700;
  }
  nav ul {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  nav a {
    color: var(--color-text);
    text-decoration: none;
  }
</style>
```

(The icon `<img>` mark is added in Task 12 once the favicon assets exist.)

- [ ] **Step 3: Write `src/components/SiteFooter.astro`**

```astro
---
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <ul>
    <li><a href="https://github.com/read-flow/read-flow">GitHub</a></li>
    <li><a href="https://github.com/read-flow/read-flow/releases">Releases</a></li>
    <li><a href="https://github.com/read-flow/read-flow/blob/main/NOTICE">License</a></li>
    <li><a href="/guides/">Guides</a></li>
  </ul>
  <p>&copy; {year} Read Flow. Source available on GitHub.</p>
</footer>

<style>
  .site-footer {
    padding: 2rem 1.5rem;
    background: var(--color-bg-2);
    color: var(--color-text-muted);
  }
  .site-footer ul {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
  }
  .site-footer a {
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 4: Wire them into `src/pages/index.astro` temporarily**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';
---
<BaseLayout title="Read Flow" description="Organize and read your e-book and PDF library.">
  <SiteNav />
  <p>Coming soon.</p>
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: exits 0. Inspect `dist/index.html` — contains `<header class="site-nav">`, the four nav links, and `<footer class="site-footer">`.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/SiteNav.astro src/components/SiteFooter.astro src/pages/index.astro
git commit -m "feat: add base layout, nav, and footer components"
```

---

### Task 7: Hero and problem-statement components

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/ProblemStatement.astro`
- Modify: `src/pages/index.astro` (insert both between `SiteNav` and `SiteFooter`, replacing the "Coming soon." placeholder)

**Interfaces:**
- Consumes: `global.css` tokens (Task 3).
- Produces: `Hero`, `ProblemStatement` — consumed by Task 11.

- [ ] **Step 1: Write `src/components/Hero.astro`**

```astro
<section class="hero">
  <h1>Your library. Your books. Your machines.</h1>
  <p class="subhead">
    Read Flow organizes and reads your e-book and PDF library across all your devices — locally,
    privately, and on your terms.
  </p>
  <div class="hero-actions">
    <a class="cta-button" href="/guides/install/">Install Read Flow</a>
    <a class="secondary" href="https://github.com/read-flow/read-flow">View on GitHub</a>
  </div>
</section>

<style>
  .hero {
    padding: 4rem 1.5rem;
    text-align: center;
    max-width: 720px;
    margin: 0 auto;
  }
  .subhead {
    color: var(--color-text-muted);
    font-size: 1.15rem;
  }
  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }
  .secondary {
    color: var(--color-text);
    align-self: center;
  }
</style>
```

- [ ] **Step 2: Write `src/components/ProblemStatement.astro`**

```astro
<section class="problem">
  <p>
    PDFs and EPUBs pile up across laptops, phones, and download folders — duplicated, untagged,
    and disconnected from whatever cloud reading app you tried last. Read Flow scans the folders
    you already have, fingerprints and de-duplicates what it finds, and gives you one library that
    follows you across every device — without sending your files anywhere.
  </p>
</section>

<style>
  .problem {
    max-width: 640px;
    margin: 0 auto;
    padding: 0 1.5rem 3rem;
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
```

- [ ] **Step 3: Update `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';
import Hero from '../components/Hero.astro';
import ProblemStatement from '../components/ProblemStatement.astro';
---
<BaseLayout title="Read Flow" description="Organize and read your e-book and PDF library.">
  <SiteNav />
  <Hero />
  <ProblemStatement />
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/index.html` contains `<h1>Your library. Your books. Your machines.</h1>` and the problem-statement paragraph.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro src/components/ProblemStatement.astro src/pages/index.astro
git commit -m "feat: add hero and problem statement sections"
```

---

### Task 8: Feature rows section

**Files:**
- Create: `src/components/FeatureRow.astro`
- Create: `src/components/FeaturesSection.astro`
- Modify: `src/pages/index.astro` (insert `FeaturesSection` after `ProblemStatement`)

**Interfaces:**
- Consumes: `FEATURES`, `Feature`, `screenshotUrl` from `src/lib/features.ts` (Task 5).
- Produces: `FeaturesSection` (id `features`, matches the `#features` nav link from Task 4) — consumed by Task 11.

- [ ] **Step 1: Write `src/components/FeatureRow.astro`**

```astro
---
import type { Feature } from '../lib/features';
import { screenshotUrl } from '../lib/features';

interface Props {
  feature: Feature;
  reversed?: boolean;
}

const { feature, reversed = false } = Astro.props;
---
<div class:list={['feature-row', { reversed }]}>
  <div class="feature-copy">
    <h3>{feature.title}</h3>
    <p>{feature.description}</p>
  </div>
  <div class="feature-visual">
    <img src={screenshotUrl(feature.screenshot)} alt={feature.title} loading="lazy" />
  </div>
</div>

<style>
  .feature-row {
    display: flex;
    gap: 2rem;
    align-items: center;
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  .feature-row.reversed {
    flex-direction: row-reverse;
  }
  .feature-copy,
  .feature-visual {
    flex: 1;
  }
  .feature-visual img {
    width: 100%;
    border-radius: var(--radius-lg);
    display: block;
  }
</style>
```

- [ ] **Step 2: Write `src/components/FeaturesSection.astro`**

```astro
---
import { FEATURES } from '../lib/features';
import FeatureRow from './FeatureRow.astro';
---
<section id="features">
  {FEATURES.map((feature, index) => (
    <FeatureRow feature={feature} reversed={index % 2 === 1} />
  ))}
</section>
```

- [ ] **Step 3: Update `src/pages/index.astro`**

Add the import and insert `<FeaturesSection />` after `<ProblemStatement />`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';
import Hero from '../components/Hero.astro';
import ProblemStatement from '../components/ProblemStatement.astro';
import FeaturesSection from '../components/FeaturesSection.astro';
---
<BaseLayout title="Read Flow" description="Organize and read your e-book and PDF library.">
  <SiteNav />
  <Hero />
  <ProblemStatement />
  <FeaturesSection />
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/index.html` contains `id="features"` and 7 `<h3>` feature titles.

- [ ] **Step 5: Commit**

```bash
git add src/components/FeatureRow.astro src/components/FeaturesSection.astro src/pages/index.astro
git commit -m "feat: add alternating feature rows section"
```

---

### Task 9: Three-ways-in section

**Files:**
- Create: `src/components/ThreeWaysIn.astro`
- Modify: `src/pages/index.astro` (insert after `FeaturesSection`)

**Interfaces:**
- Consumes: `global.css` tokens.
- Produces: `ThreeWaysIn` — consumed by Task 11.

- [ ] **Step 1: Write `src/components/ThreeWaysIn.astro`**

```astro
<section class="three-ways">
  <h2>Three ways in, one library</h2>
  <div class="cards">
    <div class="card">
      <h3>Desktop app</h3>
      <p>A native app for Linux and macOS. Browse, read, tag, and manage scan folders from a GUI.</p>
    </div>
    <div class="card">
      <h3>Headless server</h3>
      <p>
        Run the same app without a UI on a home server or NAS, so the web app can connect over
        your network.
      </p>
    </div>
    <div class="card">
      <h3>Web app (PWA)</h3>
      <p>
        A browser-based reader with fuzzy search and offline-capable reading, installable to any
        device. Can aggregate multiple Read Flow servers as sources.
      </p>
    </div>
  </div>
</section>

<style>
  .three-ways {
    max-width: 960px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    text-align: center;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
    text-align: left;
  }
  .card {
    background: var(--color-bg-2);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
  }
</style>
```

- [ ] **Step 2: Update `src/pages/index.astro`**

Add the import and insert `<ThreeWaysIn />` after `<FeaturesSection />`.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/index.html` contains "Three ways in, one library" and all three card headings.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThreeWaysIn.astro src/pages/index.astro
git commit -m "feat: add three-ways-in section"
```

---

### Task 10: Install CTA band

**Files:**
- Create: `src/components/InstallCtaBand.astro`
- Modify: `src/pages/index.astro` (insert after `ThreeWaysIn`, before `SiteFooter`)

**Interfaces:**
- Consumes: `global.css` tokens.
- Produces: `InstallCtaBand` — consumed by Task 11.

- [ ] **Step 1: Write `src/components/InstallCtaBand.astro`**

```astro
<section class="install-cta">
  <h2>Get Read Flow</h2>
  <p>Prebuilt binaries for Linux (deb, tarball, Flatpak) and macOS (Apple Silicon).</p>
  <div class="hero-actions">
    <a class="cta-button" href="/guides/install/">Installation guide</a>
    <a class="secondary" href="https://github.com/read-flow/read-flow/releases">GitHub Releases</a>
  </div>
</section>

<style>
  .install-cta {
    text-align: center;
    padding: 4rem 1.5rem;
    background: var(--color-bg-2);
  }
  .hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }
  .secondary {
    color: var(--color-text);
    align-self: center;
  }
</style>
```

- [ ] **Step 2: Update `src/pages/index.astro`**

Add the import and insert `<InstallCtaBand />` after `<ThreeWaysIn />`.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/index.html` contains "Get Read Flow" and a link to `/guides/install/`.

- [ ] **Step 4: Commit**

```bash
git add src/components/InstallCtaBand.astro src/pages/index.astro
git commit -m "feat: add install CTA band"
```

---

### Task 11: Final landing-page assembly and copy pass

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: every component from Tasks 6–10.
- Produces: the finished `/` route.

- [ ] **Step 1: Write the final `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';
import Hero from '../components/Hero.astro';
import ProblemStatement from '../components/ProblemStatement.astro';
import FeaturesSection from '../components/FeaturesSection.astro';
import ThreeWaysIn from '../components/ThreeWaysIn.astro';
import InstallCtaBand from '../components/InstallCtaBand.astro';
---
<BaseLayout
  title="Read Flow — organize and read your library, on your terms"
  description="Read Flow scans, organizes, and lets you read your e-book and PDF library across all your machines — locally, privately, no cloud account required."
>
  <SiteNav />
  <Hero />
  <ProblemStatement />
  <FeaturesSection />
  <ThreeWaysIn />
  <InstallCtaBand />
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 2: Verify the full build and type-check**

Run: `npm run check && npm run build`
Expected: both exit 0. `dist/index.html` contains, in order, the nav, hero headline, problem paragraph, `id="features"`, "Three ways in, one library", "Get Read Flow", and the footer.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, open `http://localhost:4321/` in a browser. Confirm section order matches the constraint list at the top of this plan and the dark indigo/violet palette renders correctly. Stop the dev server (Ctrl-C) when done.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: finalize landing page copy and section order"
```

---

### Task 12: Favicon and nav icon mark

**Files:**
- Create: `public/favicon-32.png`
- Create: `public/favicon-192.png`
- Create: `public/apple-touch-icon.png`
- Modify: `src/layouts/BaseLayout.astro` (add favicon `<link>` tags)
- Modify: `src/components/SiteNav.astro` (add `<img>` icon mark next to the wordmark)

**Interfaces:**
- Consumes: `assets/brand/logo-source.png` (already committed to the repo root).

- [ ] **Step 1: Generate the icon sizes**

Run (macOS `sips`, already available):

```bash
mkdir -p public
sips -z 32 32 assets/brand/logo-source.png --out public/favicon-32.png
sips -z 192 192 assets/brand/logo-source.png --out public/favicon-192.png
sips -z 180 180 assets/brand/logo-source.png --out public/apple-touch-icon.png
```

Expected: three PNG files created in `public/`, each command prints `... DONE`.

- [ ] **Step 2: Add favicon links to `src/layouts/BaseLayout.astro`**

In the `<head>`, after `<meta name="description" ...>`:

```astro
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- [ ] **Step 3: Add the icon mark to `src/components/SiteNav.astro`**

Change the `.brand` anchor to:

```astro
  <a class="brand" href="/">
    <img src="/favicon-32.png" width="24" height="24" alt="" />
    <span>Read Flow</span>
  </a>
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/favicon-32.png`, `dist/favicon-192.png`, `dist/apple-touch-icon.png` exist (Astro copies `public/` verbatim). `dist/index.html` contains the `<link rel="icon"...>` tags and the nav `<img src="/favicon-32.png">`.

- [ ] **Step 5: Commit**

```bash
git add public/favicon-32.png public/favicon-192.png public/apple-touch-icon.png src/layouts/BaseLayout.astro src/components/SiteNav.astro
git commit -m "feat: add favicon and nav icon mark from cosmic-book logo"
```

---

### Task 13: Install guide

**Files:**
- Create: `src/content/docs/guides/install.mdx`

**Interfaces:**
- Consumes: Starlight collection from Task 2. Linked from `Hero` (Task 7) and `InstallCtaBand` (Task 10) via `/guides/install/`, and from the nav's "Install" link (Task 4).

- [ ] **Step 1: Write `src/content/docs/guides/install.mdx`**

```mdx
---
title: Install
description: Install Read Flow on Linux or macOS, or build it from source.
sidebar:
  order: 1
---

## Linux (x86_64)

- **`.deb`** (Debian/Ubuntu):

  ```bash
  sudo apt install ./read-flow_*.deb
  ```

- **Portable tarball**: extract `read-flow-*-linux-x86_64.tar.gz` and run the `read-flow` binary
  inside. Optionally copy the `.desktop` and `.svg` files into `~/.local/share/`.

## macOS (Apple Silicon)

Download `read-flow-*-macos-arm64.zip`, unzip it, and move **Read Flow.app** to `/Applications`.

The app is not code-signed yet, so macOS Gatekeeper blocks it on first launch. To open it:
right-click **Read Flow.app** → **Open** → **Open**. Alternatively, from a terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/Read Flow.app"
```

## Verify your download

Every release publishes a `SHA256SUMS` file alongside the binaries:

```bash
shasum -a 256 -c SHA256SUMS
```

## Build from source

Requires the [Rust toolchain](https://rustup.rs/) and, for the web app,
[Node.js](https://nodejs.org/) ≥ 20.

```bash
cargo run -p read-flow --release
```

See the [repository README](https://github.com/read-flow/read-flow#build-from-source) for the
full prerequisite list, including the Linux system libraries the desktop app needs.

## Next step

Once installed, continue to [Setup &amp; configuration](/guides/setup/).
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/guides/install/index.html` exists and contains "Verify your download".

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/guides/install.mdx
git commit -m "docs: add install guide"
```

---

### Task 14: Setup & configuration guide

**Files:**
- Create: `src/content/docs/guides/setup.mdx`

**Interfaces:**
- Consumes: Starlight collection from Task 2. Linked from the nav (Task 4) and `install.mdx`'s "Next step" (Task 13).

- [ ] **Step 1: Write `src/content/docs/guides/setup.mdx`**

```mdx
---
title: Setup & configuration
description: How Read Flow's configuration file works, and what each section controls.
sidebar:
  order: 2
---

On first run, Read Flow writes a `read-flow.toml` file for you — most people never need to edit
it by hand, since every setting also has a control in the app's **Preferences** UI.

`read-flow.toml` is specific to your machine: it holds your server's hashed credentials and local
file paths, so it's never checked into version control and each installation gets its own copy.

## Configuration sections

| Section            | What it controls                                                  |
| ------------------- | ------------------------------------------------------------------- |
| `[database]`       | Path to the SQLite database file.                                 |
| `[server]`         | Bind address/port, allowed origins, and authorized users.         |
| `[scan]`           | Which folders to scan, file types, concurrency, auto-tag rules.   |
| `[ui]`             | Private mode and which tags count as private.                     |
| `[online_library]` | OPDS catalogs to search (Project Gutenberg, Standard Ebooks, …).  |

## Adding a folder to scan

From the app: **Preferences → Scan → Add folder**. The equivalent config entry looks like:

```toml
[scan.directories."/home/you/Documents"]
action = "Scan"
tags = []
inherit = false
```

- `action` — `"Scan"` to index files found here, or `"Ignore"` to skip a subfolder inside an
  already-scanned tree.
- `tags` — tags automatically applied to everything found in this folder.
- `inherit` — whether subfolders inherit this entry's tags/action by default.

## Running headless

On a home server or NAS, skip the GUI entirely:

```bash
read-flow --headless --address 0.0.0.0 --port 8000
```

See [Headless server + PWA](/guides/advanced/headless-pwa/) for the full walkthrough, and
[Multi-instance &amp; remote sources](/guides/advanced/multi-instance/) if you're connecting more
than one Read Flow server from the same web app.
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/guides/setup/index.html` exists and contains the configuration sections table.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/guides/setup.mdx
git commit -m "docs: add setup and configuration guide"
```

---

### Task 15: Advanced/technical guides

**Files:**
- Create: `src/content/docs/guides/advanced/multi-instance.mdx`
- Create: `src/content/docs/guides/advanced/opds-catalogs.mdx`
- Create: `src/content/docs/guides/advanced/headless-pwa.mdx`
- Create: `src/content/docs/guides/advanced/reverse-proxy-tls.mdx`

**Interfaces:**
- Consumes: Starlight collection from Task 2 (the `advanced/` subfolder auto-nests under "Advanced" in the sidebar via the `autogenerate` config from Task 2 — no config changes needed here).

- [ ] **Step 1: Write `src/content/docs/guides/advanced/multi-instance.mdx`**

```mdx
---
title: Multi-instance & remote sources
description: Connect the PWA to more than one Read Flow server.
sidebar:
  order: 1
---

The web app (PWA) can aggregate multiple Read Flow servers into one combined library view — handy
if you run a server at home and another elsewhere, or want to browse a family member's library
alongside your own.

## Adding a source

In the PWA: **Settings → Sources → Add source**, and fill in:

- **Name** — a label for this source, shown in the source list.
- **Base URL** — the server's address, e.g. `http://192.168.1.10:8000`.
- **User ID** — a username configured on that server (see below).
- **Passphrase** — that user's password.
- **Private mode** — check this to also pull private-tagged documents; it requires the `owner`
  role for that user on the remote server.

The PWA test-connects before saving, so a wrong URL or credential is caught immediately.

## How authentication works

Each Read Flow server defines its own users in its `read-flow.toml`:

```toml
[server.authorized_users.alice]
password = "$argon2id$..."  # generated by the app, not typed by hand
roles = ["owner"]
```

The **User ID** you enter when adding a source is the table key (`alice` above), and the
**Passphrase** is the plaintext password the app hashed when that user was created. A source only
needs the `owner` role if you also enable **Private mode** for it — read-only aggregation works
with any configured role.
```

- [ ] **Step 2: Write `src/content/docs/guides/advanced/opds-catalogs.mdx`**

```mdx
---
title: OPDS catalogs
description: Search and pull public-domain titles from Project Gutenberg and Standard Ebooks.
sidebar:
  order: 2
---

Read Flow can search external OPDS catalogs and pull titles directly into your library, without
leaving the app.

## Built-in catalogs

Two catalogs are enabled by default:

```toml
[[online_library.catalogs]]
type = "builtin"
id = "project_gutenberg"
enabled = true

[[online_library.catalogs]]
type = "builtin"
id = "standard_ebooks"
enabled = true
```

Toggle either one off from **Preferences → Online libraries**, or by setting `enabled = false`
directly in `read-flow.toml`.

## Searching

Open the **Online library** search from the web app's search bar — results show cover, title, and
author, with a one-click **Add to library** action that downloads and scans the file in.
```

- [ ] **Step 3: Write `src/content/docs/guides/advanced/headless-pwa.mdx`**

```mdx
---
title: Headless server + PWA
description: Run Read Flow without a GUI and connect to it from the web app.
sidebar:
  order: 3
---

For a home server or NAS, run Read Flow with no window at all — it serves the REST API and the
PWA itself from one process.

```bash
read-flow --headless --address 0.0.0.0 --port 8000
```

- `--address` — bind address; `0.0.0.0` listens on every network interface.
- `--port` — bind port; `0` picks a free port automatically.
- `--configuration-file <path>` — use a config file other than the default location.

Then, from any device on your network, open `http://<server-address>:8000` in a browser. The page
served **is** the PWA — install it to your home screen or desktop like any other installable web
app, and it will keep talking to that server over the network.

Packaged release builds already embed the web app, so `read-flow --headless` serves it directly —
no separate build or deploy step needed.
```

- [ ] **Step 4: Write `src/content/docs/guides/advanced/reverse-proxy-tls.mdx`**

```mdx
---
title: Reverse proxy & TLS
description: Serve Read Flow over HTTPS, either natively or behind a reverse proxy.
sidebar:
  order: 4
---

By default the headless server speaks plain HTTP. If you're exposing it beyond your local
network, put it behind TLS using one of these two approaches.

## Native TLS

Read Flow can terminate TLS itself — set a certificate and key in `read-flow.toml`:

```toml
[server.tls]
cert = "/path/to/cert.pem"
key = "/path/to/key.pem"
```

Or from **Preferences → Server**, enable **TLS** and click **Generate** to create a self-signed
certificate automatically.

Self-signed certificates work fine for the desktop app connecting to itself, but browsers (and
the PWA) won't trust them without manually importing the certificate — for a source you'll open
in a normal browser, use a certificate from a real CA instead (see below), or import the
self-signed cert into your device's trust store.

## Reverse proxy (recommended for browser access)

Point a reverse proxy that already handles trusted certificates — such as
[Caddy](https://caddyserver.com/) or [nginx](https://nginx.org/) with
[Let's Encrypt](https://letsencrypt.org/) — at Read Flow's plain-HTTP port. A minimal Caddy
example:

```
read-flow.example.com {
    reverse_proxy localhost:8000
}
```

Caddy obtains and renews the certificate automatically; Read Flow itself keeps running with TLS
disabled, listening only on `localhost`.
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: exits 0. `dist/guides/advanced/multi-instance/index.html`, `.../opds-catalogs/index.html`, `.../headless-pwa/index.html`, and `.../reverse-proxy-tls/index.html` all exist.

- [ ] **Step 6: Commit**

```bash
git add src/content/docs/guides/advanced/
git commit -m "docs: add advanced guides (multi-instance, OPDS, headless+PWA, TLS)"
```

---

### Task 16: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build` (Task 1), producing `dist/`.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Validate the YAML locally**

Run: `npx --yes js-yaml .github/workflows/deploy.yml`

Expected: prints the parsed document back out as normalized YAML, no `YAMLException` error. (Full correctness — including that the referenced Pages environment exists — is ultimately verified by the real Actions run in Task 17, since that depends on repository settings that don't exist until the repo is pushed to GitHub.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Pages deploy workflow"
```

---

### Task 17: Repo `CLAUDE.md` and publish

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- None — final documentation + manual publish step.

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# CLAUDE.md

## Build Commands

\`\`\`bash
npm install
npm run dev      # local dev server (http://localhost:4321)
npm run build     # static build to dist/
npm run check     # astro check (types)
npm test          # vitest unit tests
\`\`\`

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
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add repo CLAUDE.md"
```

- [ ] **Step 3: Publish (manual — run these yourself, not automated)**

These steps push to GitHub and change repository/Pages settings — run them yourself when ready,
after reviewing the full commit history:

```bash
gh repo create read-flow/read-flow.github.io --public --source=. --remote=origin --push
gh api -X PATCH repos/read-flow/read-flow.github.io/pages -f build_type=workflow
```

(If `gh api repos/read-flow/read-flow.github.io/pages` returns 404 because Pages was never
enabled, create it first with `gh api -X POST repos/read-flow/read-flow.github.io/pages -f
build_type=workflow -f 'source[branch]=main' -f 'source[path]=/'`.)

After the push, check the Actions tab — the `Deploy to GitHub Pages` workflow should run and the
site should be live at `https://read-flow.github.io/` within a few minutes.

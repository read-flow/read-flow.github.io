# Read Flow color palette

Sampled from `assets/brand/logo-source.png` (deep-space cosmic background,
open book fanned into yellow/orange/pink/purple pages, cyan facing page).
Less purple-heavy than the first pass at this palette — background is a true
dark **blue**, purple is one accent among eight rather than the dominant
hue.

Values were picked by sampling actual pixel clusters from the logo (not
guessed), then nudged for WCAG contrast against the background where noted.

## Backgrounds

| Token       | Hex       | RGB              | Role                                                             |
| ----------- | --------- | ---------------- | ----------------------------------------------------------------- |
| `bg`        | `#0d0f57` | `13, 15, 87`     | App/page background — the logo's deep cosmic navy.                |
| `bg-2`      | `#1b2472` | `27, 36, 114`    | Secondary container background (cards, panels) — a lighter blue step up from `bg`, same hue family, not an accent. |

`bg` was averaged from the darkest sampled pixels in the logo's background
(`#0b115f`, `#0c105a`, `#0e0f5e`). `bg-2` is `bg` lifted a fixed amount
per channel — deliberately closer to `bg` than to the logo's bright royal-blue
glow (`#0850ab`–`#255ac3`), which reads as an accent, not a neutral surface.

## Text

| Token         | Hex       | Role                                      | Contrast on `bg` |
| ------------- | --------- | ------------------------------------------ | ----------------- |
| `text`        | `#eef1fb` | Primary text/icons on dark backgrounds.     | 15.2 : 1 |
| `text-muted`  | `#9aa5c9` | Secondary text, captions, placeholders.     | 7.0 : 1 |

Both are blue-tinted near-neutrals (not lavender/purple-tinted) to stay
consistent with the blue background family.

## Accent colors

Eight accents, one per fanned-page hue in the logo plus a green chosen to
harmonize (not present in the source logo). Use these for highlights,
interactive accents, tags, and book-cover theming — never as body text on
`bg-2` unless the contrast column clears 4.5:1.

| Token      | Hex       | RGB              | Sampled from logo                  | Contrast on `bg` |
| ---------- | --------- | ---------------- | ------------------------------------ | ----------------- |
| `yellow`   | `#fde047` | `253, 224, 71`   | Pale page highlight, brightened       | 13.0 : 1 |
| `gold`     | `#fbbf24` | `251, 191, 36`   | Page-fold gold (`#fed048`, `#feba3d`) | 10.3 : 1 |
| `orange`   | `#f0863a` | `240, 134, 58`   | Mid-fan orange (`#f5a040`, `#e3823b`) |  6.7 : 1 |
| `pink`     | `#fb4b5a` | `251, 75, 90`    | Coral-red page (`#fd5b5a`, `#f02d41`) |  5.1 : 1 |
| `fuchsia`  | `#d946ef` | `217, 70, 239`   | Magenta page (`#d944e3`, `#c62fb4`)   |  5.0 : 1 |
| `purple`   | `#a855f7` | `168, 85, 247`   | Left violet page, brightened for contrast (source `#5c1493`–`#9f5fc6`) | 4.3 : 1 |
| `cyan`     | `#38bdf8` | `56, 189, 248`   | Facing page (`#4ac5fd`, `#57d2fe`)    |  8.0 : 1 |
| `green`    | `#34d399` | `52, 211, 153`   | Not in logo — emerald chosen to sit between cyan and gold on the wheel, reads as fresh/natural rather than clashing | 8.9 : 1 |

`purple` is the one accent that needed adjusting past its raw logo sample:
the source violet (`#8b2fc9`) only cleared 2.7:1 against `bg`, under the
3:1 floor for UI graphics/large text. Brightened to `#a855f7` (4.3:1) while
keeping the same hue.

## Usage guidance

- **App background**: `bg`. **Secondary containers** (cards, panels, raised
  surfaces, sidebars): `bg-2`.
- **Primary UI accent** (buttons, active nav, focus rings): `purple` — it's
  the most neutral/least-loud of the eight and reads as "the brand color"
  without competing with content-level accents.
- **Book covers**: rotate through all eight accents per title (border,
  divider, subtitle, footer), cream/`text` for the title and author. Eight
  accents means less repetition than the five-color rotation used previously
  across a 6-title sample library.
- **Tags/categories/highlights**: any accent, picked for semantic fit
  (e.g. `green` for "completed", `orange` for "in progress") rather than
  round-robin, where the UI has a reason to pick one over another.
- Don't put accent-on-accent text. Accents are for use on `bg`/`bg-2` (or
  as a background themselves with `bg`/`text` on top, for solid tag pills).

## Suggested CSS custom properties

Mirrors the naming in `src/styles/tokens.css`, replacing the current
purple-leaning set:

```css
:root {
  --color-bg: #0d0f57;
  --color-bg-2: #1b2472;
  --color-text: #eef1fb;
  --color-text-muted: #9aa5c9;

  --color-yellow: #fde047;
  --color-gold: #fbbf24;
  --color-orange: #f0863a;
  --color-pink: #fb4b5a;
  --color-fuchsia: #d946ef;
  --color-purple: #a855f7;
  --color-cyan: #38bdf8;
  --color-green: #34d399;
}
```

## Not yet applied

This document defines the palette only. `src/styles/tokens.css`, the
sample-library `[ui.theme]` block in `assets/sample-library/read-flow.toml`,
and the generated book covers in `assets/sample-library/_covers/` all still
use the older, more-purple palette and need a follow-up pass to adopt this
one.

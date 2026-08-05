# Read Flow color palette

Sampled from `assets/brand/logo-source.png` (deep-space cosmic background,
open book fanned into yellow/orange/pink/purple pages, cyan facing page).
Less purple-heavy than the first pass at this palette — background is a true
dark **blue**, purple is one accent among eight rather than the dominant
hue.

Values were picked by sampling actual pixel clusters from the logo (not
guessed), then nudged for WCAG contrast against the background where noted.

## Backgrounds (marketing site)

These are the docs/marketing site's own values (`src/styles/tokens.css`) —
not the app's. See "App chrome" below for why the app uses a different,
deliberately non-matching pair.

| Token       | Hex       | RGB              | Role                                                             |
| ----------- | --------- | ---------------- | ----------------------------------------------------------------- |
| `bg`        | `#080935` | `8, 9, 53`       | Marketing site background — the logo's deep cosmic navy, darkened. |
| `bg-2`      | `#151c5b` | `21, 28, 91`     | Secondary container background (cards, panels) — a lighter blue step up from `bg`, same hue family, not an accent. |

Both are the same hue/saturation as the logo's background sample
(`#0b115f`–`#0e0f5e`), just darker: lowered to 12%/22% lightness (was
20%/28%) so the marketing site reads as a genuinely dark surface, not
dark-blue-gray. The `bg`→`bg-2` lightness *step* is kept the same as before
(contrast ratio ~1.2:1 either way) — only the floor moved down, not the
relationship between the two.

## App chrome

The app (screenshots, `assets/sample-library/read-flow.toml`
`[ui.theme.dark]`) uses its own background/container/accent triad —
deliberately *not* the marketing site's `bg`/`bg-2`/`purple` above. The two
surfaces sit next to each other constantly (docs pages embed app
screenshots), so if the app matched the docs background exactly, a
screenshot would blend into the page around it instead of reading as a
distinct object.

| Token               | Hex       | RGB              | Role                                        | Contrast |
| -------------------- | --------- | ---------------- | -------------------------------------------- | -------- |
| `app-bg`             | `#081018` | `8, 16, 24`      | App background.                              | — |
| `app-container`      | `#082038` | `8, 32, 56`      | Secondary container background (cards, panels), a step up from `app-bg`. | 1.16 : 1 vs `app-bg` |
| `app-accent`         | `#80C0FF` | `128, 192, 255`  | Primary UI accent — buttons, active nav, focus rings. | 9.9 : 1 vs `app-bg`, 8.6 : 1 vs `app-container` |

`app-bg` and the marketing `bg` are near-identical in *lightness*
(luminance ratio 1.00:1 — both are about as dark as each other) but
different in *hue*: marketing `bg` is a saturated indigo, `app-bg` is a
near-neutral dark slate with a faint teal cast. They're told apart by color,
not darkness — intentional, so the app doesn't just read as "the docs site
but dimmer."

This dark `app-bg` is also what makes accent-colored book covers (below)
pop inside the app's own library grid: against a merely-dark background, a
cover using `gold` or `cyan` as its own background would read as similar in
weight to the chrome around it. Against `app-bg`, every one of the eight
cover accents is unambiguously brighter than the app itself.

## Text

| Token         | Hex       | Role                                      | Contrast on `bg` |
| ------------- | --------- | ------------------------------------------ | ----------------- |
| `text`        | `#eef1fb` | Primary text/icons on dark backgrounds.     | 16.9 : 1 |
| `text-muted`  | `#9aa5c9` | Secondary text, captions, placeholders.     | 7.8 : 1 |

Both are blue-tinted near-neutrals (not lavender/purple-tinted) to stay
consistent with the blue background family.

## Accent colors

Eight accents, one per fanned-page hue in the logo plus a green chosen to
harmonize (not present in the source logo). Use these for highlights,
interactive accents, tags, and book-cover theming — never as body text on
`bg-2` unless the contrast column clears 4.5:1.

| Token      | Hex       | RGB              | Sampled from logo                  | Contrast on `bg` |
| ---------- | --------- | ---------------- | ------------------------------------ | ----------------- |
| `yellow`   | `#fde047` | `253, 224, 71`   | Pale page highlight, brightened       | 14.5 : 1 |
| `gold`     | `#fbbf24` | `251, 191, 36`   | Page-fold gold (`#fed048`, `#feba3d`) | 11.4 : 1 |
| `orange`   | `#f0863a` | `240, 134, 58`   | Mid-fan orange (`#f5a040`, `#e3823b`) |  7.4 : 1 |
| `pink`     | `#fb4b5a` | `251, 75, 90`    | Coral-red page (`#fd5b5a`, `#f02d41`) |  5.7 : 1 |
| `fuchsia`  | `#d946ef` | `217, 70, 239`   | Magenta page (`#d944e3`, `#c62fb4`)   |  5.5 : 1 |
| `purple`   | `#a855f7` | `168, 85, 247`   | Left violet page, brightened for contrast (source `#5c1493`–`#9f5fc6`) | 4.8 : 1 |
| `cyan`     | `#38bdf8` | `56, 189, 248`   | Facing page (`#4ac5fd`, `#57d2fe`)    |  8.9 : 1 |
| `green`    | `#34d399` | `52, 211, 153`   | Not in logo — emerald chosen to sit between cyan and gold on the wheel, reads as fresh/natural rather than clashing | 9.9 : 1 |

`purple` is the one accent that needed adjusting past its raw logo sample:
the source violet (`#8b2fc9`) only cleared 2.7:1 against `bg`, under the
3:1 floor for UI graphics/large text. Brightened to `#a855f7` (4.3:1 against
the original `bg`, 4.8:1 against the current darker one) while keeping the
same hue.

Every accent clears 4.5:1 against both the marketing `bg` and the app's own
`app-bg` (purple is tightest at 4.8:1 / 4.84:1 respectively) — a consequence
of darkening `bg` (see above), and the reason `bg`/`app-bg` is used as
*text* on accent-colored surfaces below rather than picking a text color
per accent.

## Usage guidance

- **Marketing site background**: `bg`. **Secondary containers** (cards,
  panels, raised surfaces, sidebars): `bg-2`. **Primary UI accent**
  (buttons, active nav, focus rings): `purple` — it's the most
  neutral/least-loud of the eight and reads as "the brand color" without
  competing with content-level accents.
- **App background/container/accent**: see "App chrome" above —
  `app-bg`/`app-container`/`app-accent`, not the marketing values.
- **Book covers**: see the dedicated section below — covers are the one
  place accents are used as a *background*, not a highlight.
- **Tags/categories/highlights**: any accent, picked for semantic fit
  (e.g. `green` for "completed", `orange` for "in progress") rather than
  round-robin, where the UI has a reason to pick one over another.
- Don't put accent-on-accent text. Outside of book covers, accents are for
  use *on* `bg`/`bg-2` (or as a background themselves with `bg`/`text` on
  top, for solid tag pills) — not as backgrounds carrying other accents.

## Book covers

Three rules, in order of how much they change the artwork:

1. **Cover background is an accent color, never `app-bg`/`app-container`.**
   The app chrome (library grid, document list, dashboard) is
   `app-bg`/`app-container` — if a cover used the same background, it would
   blend into its own surroundings instead of standing out as an object
   sitting *on* the app. An accent background is what makes a cover read as
   a cover at thumbnail size, not just another dark rectangle in a dark UI.
2. **Text on that accent background is `app-bg` (the app's own dark
   background), not `text`/cream.** Every accent in the table above is
   bright enough that `app-bg`-as-text clears 4.5:1 against all eight (4.84:1
   on the tightest, `purple`) — cream text would not (it loses to dark text
   on all eight; see the accent table). Using the app's actual background
   color as cover text also ties the two together visually: the cover's
   text is quite literally "made of" the color of the app it lives in.
3. **Each cover uses a different composition, not just a different accent.**
   Recoloring one template six times is what caused the "they all look the
   same" problem this rule set fixes — a reader scanning a shelf should be
   able to tell titles apart by shape before they read a single word.
   Compositions may reuse structural ideas (a divider, a byline block) but
   the overall silhouette/layout must differ. The sample library's six
   covers are the reference catalog for this:

   | Book | Accent (background) | Style | Why |
   | --- | --- | --- | --- |
   | Pride and Prejudice | `pink` | Bordered classic — double-rule border, centered serif, diamond ornament | Regency formality |
   | Twenty Thousand Leagues Under the Sea | `cyan` | Wave horizon — borderless, a wave-line path splits the cover, title floats above it | ocean/adventure |
   | The Strange Case of Dr Jekyll and Mr Hyde | `purple` (+ `fuchsia` seam) | Split duality — a jagged seam divides the cover into two tints | literalizes "two natures" |
   | Meditations | `gold` | Radial medallion — concentric rings and a center dot, no border, large negative space | Stoic austerity |
   | Leaves of Grass | `green` | Organic line — left-aligned ragged type, grass-blade line art from the bottom edge | untamed/natural |
   | The Time Machine | `orange` | Radiating spokes — motion-lines fanning from a corner, clock-face center | mechanical motion |

   New covers should invent a new composition rather than reuse one of the
   six above verbatim, unless two titles are genuinely similar enough in
   theme to share (as Jekyll/Hyde's seam borrows the fuchsia accent as a
   secondary color without borrowing anyone else's layout).

Accent assignment is picked for thematic fit first (ocean → `cyan`,
philosophy → `gold`), round-robin only as a tiebreaker — with eight accents
against a 6-title sample library there's room to be deliberate rather than
mechanical.

## Marketing-site CSS custom properties

Mirrors `src/styles/tokens.css` (marketing site only — the app's
`app-bg`/`app-container`/`app-accent` live in
`assets/sample-library/read-flow.toml` `[ui.theme.dark]` instead, not here):

```css
:root {
  --color-bg: #080935;
  --color-bg-2: #151c5b;
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

- The six sample-library covers in `assets/sample-library/_covers/` (and
  their embedded copies in the `.epub`/`.pdf` files) use the *previous*
  `app-bg` (`#080935`, the old shared navy) as their text color per rule 2
  above. Now that `app-bg` is `#081018`, that text is a shade off the
  current app background — cosmetic (still >4.5:1 on every accent), but the
  covers should be regenerated with `#081018` text next time they're
  touched.

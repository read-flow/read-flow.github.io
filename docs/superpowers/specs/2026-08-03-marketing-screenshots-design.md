# Marketing screenshot automation — design

## Goal

Automate producing the screenshot set required by `docs/screenshots-needed.md`, replacing the
current hotlinked images with locally-stored PNGs, without any manual GUI interaction or a live
running app window.

## Chosen approach

Render each required app scene **headlessly**, using the `cosmic-golden-test` crate already
vendored by the `read-flow` app repo (`cosmic-golden`), which renders any `cosmic::Element` to a
PNG via a CPU (tiny-skia) renderer — no display server, no window, no clicking.

This works because every page in `read-flow`'s `cosmic` crate implements a `Page` trait
(`cosmic/src/page/traits.rs`) with a synchronous `fn view(&self) -> Element`. Page *state* can be
populated without the full `iced::Application` message loop, using patterns already precedented in
the repo:

- **Direct/fake-provider construction** — for components generic over their data provider (e.g.
  `TagEditor<P>`), substitute a trivial synchronous `Value<T>` provider instead of a real
  `Arc<DocumentProvider>`.
- **Direct `update()` calls with synthetic data** — several message handlers (`SetSourceStatus`,
  `SearchCompleted`) are pure, synchronous state mutations; calling them directly with hand-built
  data bypasses the async network/DB calls that would normally produce that state.
- **The existing tokio-test + temp-SQLite harness** (`cosmic/src/test_support.rs`) — for pages that
  need a real `DocumentProvider`/`ApplicationModule`, build one against a temp-dir SQLite DB (no
  network, no real filesystem beyond fixtures), then drain the page's init `Task` and feed selected
  messages into `update()`.

No new async/runtime plumbing is required. `HeadlessRenderer::render(element, width, height)` takes
arbitrary dimensions, so a full-page render at marketing resolution (1600×1000) is expected to work
the same as the existing small component-scale golden tests, though it hasn't been exercised at that
size before.

## Scope split

This spans two repos with different conventions, built as two phases of one spec:

- **Phase 1** (in `read-flow`): a new `screenshot_tool` binary that produces the 8 PNGs.
- **Phase 2** (in `read-flow.github.io`, this repo): consume those PNGs — already fully described
  in `docs/screenshots-needed.md`'s "Integration steps" section.

## Phase 1 — `screenshot_tool` binary (read-flow repo)

### Packaging

A new bin target in the `cosmic` crate, gated behind a `screenshot-tool` Cargo feature so it never
ships in release builds and only pulls in test-only helpers when built explicitly:

```
cargo run -p cosmic --bin screenshot_tool --features screenshot-tool -- \
  --sample-library ../read-flow.github.io/assets/sample-library \
  --out ../read-flow.github.io/src/assets/screenshots
```

`test_support.rs`'s helpers (`document_provider()`, `scan_and_fetch_document()`, `drain()`) and the
EPUB `test_helper.rs`/`render_chapter_blocks` get their `#[cfg(test)]` gate widened to
`#[cfg(any(test, feature = "screenshot-tool"))]` so the binary can reuse them instead of duplicating
logic.

### Rendering convention

Every scene renders via `HeadlessRenderer` at a single fixed size — **1600×1000, dark theme**
(`cosmic::Theme::dark()`). Using the same renderer call for every scene satisfies the "consistent
chrome" requirement by construction — there's no real window to drift.

### The 8 scenes

| # | Filename | Page(s) | Construction approach |
|---|---|---|---|
| 1 | `cosmic-scanning.png` | `DocumentList` | Temp-DB harness; scan sample library; select `pride-and-prejudice.epub` + `pride-and-prejudice.pdf` (same book, different format/hash — two distinct rows); merge button visible in header. **Not** the byte-identical `.epub` copy — the scanner auto-merges byte-identical content into a single `Document` with multiple `sources`, so that pair would collapse into one row with nothing to select. |
| 2 | `cosmic-tags.png` | `DocumentDetails` | Temp-DB harness; open a document with several tags applied via `TagEditor`; uniform card-style chips (the real UI has no per-tag color), no rule editor shown. |
| 3 | `cosmic-tags-rule.png` *(bonus — not in the required table)* | `PreferencesPage` (Sources → directory settings) | Temp-DB harness; open the directory-settings sub-form with a scan-tags auto-tag rule filled in. |
| 4 | `cosmic-progress.png` | `DashboardPage` or `DocumentList` | Temp-DB harness; seed documents with a mix of Unread / Reading / Read status. |
| 5 | `cosmic-multi-instance.png` | `PreferencesPage` (Sources) | Temp-DB harness; `update(PreferencesMessage::Remotes(ProvidedStateMessage::Loaded(vec![remote_a, remote_b])))` + `SetSourceStatus(id, true)` for both — two synthetic `Remote`s, no real network. |
| 6 | `cosmic-pdf-reader.png` | `MuPdfViewer` | **New** test-only harness mirroring EPUB's `render_chapter_blocks`/`EpubBuilder` pattern: open a real sample PDF via `mupdf::Document::open`, rasterize a page; drive the full `MuPdfViewer::new()` + `drain()` path for page chrome (toolbar, thumbnails). |
| 7 | `cosmic-epub-reader.png` | `EpubViewer` | Reuses the existing `load_epub_chapters` + full-page `EpubViewer::new()` + `drain()` pattern already proven in `epub_viewer/mod.rs` tests. |
| 8 | `cosmic-opds.png` | `OnlineLibraryPage` | `update(OnlineLibraryMessage::SearchCompleted(fake_books, HashMap::new()))` with a handful of hand-built `OnlineBook` literals (public-domain-sounding titles) — no live network. |

### Data flow & error handling

- The tool scans the *actual* `assets/sample-library/` files into a fresh temp SQLite DB each run —
  never touches the committed `assets/sample-library/database.db`, so runs are hermetic and
  reproducible.
- A scene that fails (missing sample file, mupdf error, render panic) aborts only that scene;
  the tool attempts all remaining scenes and exits non-zero with a summary
  (`7/8 scenes written, 1 failed: cosmic-pdf-reader`).
- No network egress, ever — OPDS and "sources reachable" are both faked via `update()`. This keeps
  the tool hermetic and safe to run in CI later if desired.
- Idempotent: re-running always overwrites the same 8 filenames; no incremental state.

### Testing

- The new PDF-rasterization helper (scene 6) gets one lightweight `#[test]` (under the same feature
  gate) asserting the rendered pixel buffer isn't blank/uniform, so a future mupdf upgrade that
  silently breaks rendering fails loudly instead of quietly producing an empty marketing screenshot.
- No changes to the existing golden-test suite; the `screenshot-tool` feature is additive and off
  by default, so normal `cargo test`/`cargo build` are unaffected.

## Phase 2 — integration (read-flow.github.io, this repo)

Already specified in `docs/screenshots-needed.md`'s "Integration steps" section, run once the 8
PNGs exist under `src/assets/screenshots/`:

1. Update the `screenshot` field per entry in `src/lib/features.ts` to the new local filenames.
2. Replace `screenshotUrl()` (or move to a direct local import, whichever `FeatureRow.astro` ends
   up needing) to resolve local assets instead of hotlinking the `screenshots` branch.
3. Update `CLAUDE.md`'s "Conventions" section to describe local storage instead of the hotlink
   convention.
4. Delete the `screenshots` branch on `read-flow/read-flow` once nothing references it.
5. *(New — not in the original doc)* `cosmic-tags-rule.png` isn't wired into any `features.ts`
   entry. Generate it in Phase 1, but treat wiring it into the site (e.g. `ThreeWaysIn.astro` or a
   guide, per the doc's "Optional" section) as an unblocked follow-up, not part of Phase 2.

## Open questions / risks carried forward

- 1600×1000 full-page headless rendering is untested at this scale in `cosmic-golden-test` — if
  layout/rendering breaks at that size, may need to render smaller and upscale, or investigate the
  renderer's size handling.
- Scene 6 (PDF viewer) requires genuinely new harness code with no direct precedent, unlike the
  other 7 scenes which all reuse an existing pattern.
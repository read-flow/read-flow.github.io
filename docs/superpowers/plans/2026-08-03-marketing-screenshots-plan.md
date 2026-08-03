# Marketing Screenshot Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a feature-gated `screenshot_tool` entrypoint in the `read-flow` app repo's `cosmic` crate that headlessly renders the 8 PNGs specified in `read-flow.github.io/docs/screenshots-needed.md` (7 required + 1 bonus), then wire those PNGs into the `read-flow.github.io` marketing site.

**Architecture:** One binary (`read-flow`), same crate root as the real GUI app (`cosmic/src/main.rs`) — no new `[[bin]]` target, since this crate has no `lib.rs` and sibling `src/bin/*.rs` files can't see `main.rs`'s private module tree. Behind `--features screenshot-tool`, `main()` branches to `screenshot_tool::run()` instead of launching the GUI. Each scene builds real page state via the same async-message-driven construction the production app uses (`Page::new()` → drain the init `Task` → selectively replay messages into `update()`), using either the real sample-library files (scanned into a fresh temp SQLite DB per scene) or synthetic data injected directly via `update()` where the real path would need live network. Every scene renders through `cosmic-golden`'s `HeadlessRenderer` (CPU tiny-skia, no display server) at a fixed 1600×1000, dark theme, and the raw RGBA output is encoded to PNG via the `image` crate.

**Tech Stack:** Rust, tokio, `cosmic-golden` (headless iced renderer), `image` (PNG encoding), existing `cosmic` crate internals (`test_support.rs`'s temp-DB harness, `Page` trait, per-page message types).

## Global Constraints

- Dark theme only, PNG, long edge ~1600px — render every scene at exactly 1600×1000 (per `docs/screenshots-needed.md`).
- Filenames: `<app>-<slug>.png` per the table in `docs/screenshots-needed.md`; the bonus scene is `cosmic-tags-rule.png` (not in that table).
- No network egress, ever — OPDS results and source-reachability are injected synthetically via `update()`, never via real HTTP.
- The tool must never touch the committed `assets/sample-library/database.db` — every scene scans the real sample files into its own fresh temp-dir SQLite DB.
- `screenshot-tool` is an off-by-default Cargo feature; normal `cargo build`/`cargo test` (no feature flags) must be completely unaffected.
- Visibility widenings introduced for this tool are `pub(crate)` only — never `pub` — since nothing outside this bin-only crate consumes them.
- Output goes to `--out <dir>` (the caller passes `read-flow.github.io/src/assets/screenshots`); idempotent — re-running always overwrites the same 8 filenames.

---

### Task 1: Feature scaffolding + first working scene (OPDS)

**Files:**
- Modify: `cosmic/Cargo.toml`
- Modify: `cosmic/src/main.rs`
- Modify: `cosmic/src/test_support.rs`
- Create: `cosmic/src/screenshot_tool/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/opds.rs`

**Interfaces:**
- Produces: `pub(crate) fn run() -> anyhow::Result<()>` in `screenshot_tool` (called from `main.rs`), `pub(super) const WIDTH: u32 = 1600;` / `pub(super) const HEIGHT: u32 = 1000;` in `screenshot_tool/mod.rs`, `pub(super) fn save_png(rgba: &[u8], path: &std::path::Path) -> anyhow::Result<()>` in `screenshot_tool/mod.rs`.
- Consumes: `crate::test_support::document_provider()` (widened to build under this feature), `read_flow_core::online_library::{OnlineBook, DownloadFormat}`, `crate::page::{OnlineLibraryPage, OnlineLibraryMessage}` (already `pub use`-re-exported from `page/mod.rs`, no widening needed).

- [ ] **Step 1: Add the `screenshot-tool` feature and its two optional deps to `cosmic/Cargo.toml`**

In `cosmic/Cargo.toml`, add to `[features]` (currently only has `embed-pwa`):

```toml
[features]
embed-pwa = ["read-flow-core/embed-pwa"]
screenshot-tool = ["dep:cosmic-golden", "dep:tempfile"]
```

Add to `[dependencies]` (alongside the existing `provider = { path = "../provider" }`):

```toml
cosmic-golden = { workspace = true, optional = true }
tempfile = { workspace = true, optional = true }
```

Leave the existing `cosmic-golden.workspace = true` and `tempfile.workspace = true` entries under `[dev-dependencies]` untouched — Cargo unifies the two: dev builds/tests get them unconditionally, `--features screenshot-tool` builds get them via the optional-dependency path.

- [ ] **Step 2: Widen `test_support`'s gate so it compiles under the new feature**

In `cosmic/src/main.rs`, change:

```rust
#[cfg(test)]
mod test_support;
```

to:

```rust
#[cfg(any(test, feature = "screenshot-tool"))]
mod test_support;
```

In `cosmic/src/test_support.rs`, change the file-level gate:

```rust
#![cfg(test)]
```

to:

```rust
#![cfg(any(test, feature = "screenshot-tool"))]
```

Do **not** widen `mod bdd;` (`main.rs:6-7`) or `epub_viewer`'s `mod test_helper;` — the tool never uses `crate::bdd::fixtures` or `EpubBuilder` (it scans real sample-library files instead), so pulling those in (and their heavier dev-deps like `cucumber`/`axum`/`zip`) would be unnecessary.

- [ ] **Step 3: Add the `screenshot_tool` module and branch `main()` into it**

In `cosmic/src/main.rs`, add near the other `mod` declarations:

```rust
#[cfg(feature = "screenshot-tool")]
mod screenshot_tool;
```

At the very top of `fn main() -> anyhow::Result<()> {`, before the existing logging-init line, add:

```rust
fn main() -> anyhow::Result<()> {
    #[cfg(feature = "screenshot-tool")]
    return screenshot_tool::run();

    // Initialize logging: structured JSON to stderr + in-memory capture that
    // the in-app server log page renders.
    let log_bus = logging::init();
    // ...rest of the existing function body, unchanged...
```

- [ ] **Step 4: Create the scene registry module**

Create `cosmic/src/screenshot_tool/scenes/mod.rs`:

```rust
pub(super) mod opds;
```

(Later tasks add one `pub(super) mod <scene>;` line each.)

- [ ] **Step 5: Create the orchestrator (`screenshot_tool/mod.rs`)**

```rust
mod scenes;

use std::path::Path;
use std::path::PathBuf;

use clap::Parser;

pub(super) const WIDTH: u32 = 1600;
pub(super) const HEIGHT: u32 = 1000;

#[derive(Debug, clap::Parser)]
struct Args {
    /// Path to the read-flow.github.io sample library (assets/sample-library)
    #[clap(long)]
    sample_library: PathBuf,
    /// Directory to write the PNGs into (e.g. read-flow.github.io/src/assets/screenshots)
    #[clap(long)]
    out: PathBuf,
}

pub(crate) fn run() -> anyhow::Result<()> {
    let args = Args::parse();
    cosmic_golden::init();
    std::fs::create_dir_all(&args.out)?;

    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?;

    let lib: &Path = args.sample_library.as_path();
    let results: Vec<(&str, anyhow::Result<Vec<u8>>)> = rt.block_on(async {
        vec![("cosmic-opds.png", scenes::opds::render(lib).await)]
    });

    let total = results.len();
    let mut failures = Vec::new();
    let mut succeeded = 0usize;
    for (filename, result) in results {
        match result.and_then(|rgba| save_png(&rgba, &args.out.join(filename))) {
            Ok(()) => {
                succeeded += 1;
                println!("wrote {filename}");
            }
            Err(e) => failures.push(format!("{filename}: {e}")),
        }
    }

    if failures.is_empty() {
        println!("{succeeded}/{total} scenes written");
        Ok(())
    } else {
        println!(
            "{succeeded}/{total} scenes written, {} failed: {}",
            failures.len(),
            failures.join("; ")
        );
        anyhow::bail!("{} scene(s) failed", failures.len());
    }
}

fn save_png(rgba: &[u8], path: &Path) -> anyhow::Result<()> {
    let image = image::RgbaImage::from_raw(WIDTH, HEIGHT, rgba.to_vec())
        .ok_or_else(|| anyhow::anyhow!("rgba buffer size mismatch for {WIDTH}x{HEIGHT}"))?;
    image.save(path)?;
    Ok(())
}
```

- [ ] **Step 6: Implement the OPDS scene**

This is the first scene because `OnlineLibraryPage`/`OnlineLibraryMessage` are already `pub use`-re-exported from `page/mod.rs` (no visibility widening needed), and it needs zero scanned documents — the simplest possible end-to-end proof of the pipeline.

Create `cosmic/src/screenshot_tool/scenes/opds.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;
use read_flow_core::online_library::DownloadFormat;
use read_flow_core::online_library::OnlineBook;

use crate::page::OnlineLibraryMessage;
use crate::page::OnlineLibraryPage;
use crate::page::Page as _;

fn fake_book(id: &str, title: &str, authors: &[&str]) -> OnlineBook {
    OnlineBook {
        id: id.to_string(),
        title: title.to_string(),
        subtitle: None,
        authors: authors.iter().map(|a| a.to_string()).collect(),
        contributors: Vec::new(),
        summary: None,
        summary_html: None,
        language: Some("en".to_string()),
        publisher: None,
        identifier: None,
        published: None,
        rights: None,
        subject: None,
        // Deliberately `None`: a `Some(url)` here would trigger a real
        // `fetch_cover_bytes` HTTP call from `SearchCompleted`'s handler.
        cover_url: None,
        formats: vec![DownloadFormat {
            mime_type: "application/epub+zip".to_string(),
            href: format!("https://example.invalid/{id}.epub"),
            label: "EPUB".to_string(),
        }],
        catalog_name: "Project Gutenberg".to_string(),
    }
}

pub(in crate::screenshot_tool) async fn render(
    _sample_library: &Path,
) -> anyhow::Result<Vec<u8>> {
    let (application_module, _document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let (mut page, init_task) = OnlineLibraryPage::new(application_module);
    crate::test_support::drain(init_task).await;

    let books = vec![
        fake_book("pg-84", "Frankenstein; Or, The Modern Prometheus", &["Mary Wollstonecraft Shelley"]),
        fake_book("pg-1342", "Pride and Prejudice", &["Jane Austen"]),
        fake_book("pg-2701", "Moby-Dick; Or, The Whale", &["Herman Melville"]),
        fake_book("pg-11", "Alice's Adventures in Wonderland", &["Lewis Carroll"]),
    ];
    let _ = page.update(OnlineLibraryMessage::SearchCompleted(
        books,
        std::collections::HashMap::new(),
    ));

    let element = page.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

Note: `Page as _` brings the `view`/`update` trait methods into scope without naming the trait; if `OnlineLibraryPage` has its own inherent `view`/`update` (shadowing the trait ones) this import is a no-op harmless extra — keep it for consistency across scenes since some pages only expose these via the `Page` trait impl.

- [ ] **Step 7: Build and run, verify a real PNG comes out**

Run:
```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
mkdir -p /tmp/screenshot-tool-out
cargo run -p cosmic --features screenshot-tool -- \
  --sample-library assets/sample-library-does-not-need-to-exist-yet \
  --out /tmp/screenshot-tool-out
```
(The OPDS scene ignores `sample_library`, so a nonexistent path is fine for this task only — later scenes need the real path.)

Expected: compiler errors are likely on the first attempt (unknown import paths, missing `Page` trait import, etc.) — fix them using `cargo build -p cosmic --features screenshot-tool` output as a guide; this is ordinary compile-and-fix, not a sign the plan is wrong. Once it compiles, expect stdout ending in `wrote cosmic-opds.png` and `1/1 scenes written`, and `/tmp/screenshot-tool-out/cosmic-opds.png` should exist and be a valid PNG roughly 1600×1000 (`file /tmp/screenshot-tool-out/cosmic-opds.png`).

- [ ] **Step 8: Confirm normal builds are unaffected**

Run: `cargo build -p cosmic` (no `--features`) and `cargo test -p cosmic test_support` (should report no tests found, not a compile error — confirms the widened `cfg` didn't leak into default builds).

- [ ] **Step 9: Commit**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
git add cosmic/Cargo.toml cosmic/src/main.rs cosmic/src/test_support.rs cosmic/src/screenshot_tool/
git commit -m "feat: add screenshot-tool feature with OPDS scene"
```

---

### Task 2: Sources/multi-instance scene

**Files:**
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/sources.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`

**Interfaces:**
- Consumes: `crate::page::{PreferencesPage, PreferencesMessage, PreferencesSection}` (already `pub use`-re-exported — verify `PreferencesSection` is re-exported too; if not, add `pub use preferences::PreferencesSection;` to `page/mod.rs`'s re-export list, mirroring the existing `pub use preferences::PreferencesMessage;` line), `read_flow_core::db::models::Remote`, `crate::config::Config`.
- Produces: `cosmic-multi-instance.png`.

- [ ] **Step 1: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod sources;
```

- [ ] **Step 2: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/sources.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;
use read_flow_core::db::models::Remote;

use crate::config::Config;
use crate::page::Page as _;
use crate::page::PreferencesMessage;
use crate::page::PreferencesPage;
use crate::page::PreferencesSection;

pub(in crate::screenshot_tool) async fn render(
    _sample_library: &Path,
) -> anyhow::Result<Vec<u8>> {
    let (application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let (mut page, init_task) =
        PreferencesPage::new(application_module, Config::default(), document_provider);
    crate::test_support::drain(init_task).await;

    let remotes = vec![
        Remote {
            id: 1,
            base_url: "https://library.example.com".to_string(),
            order: 0,
            passphrase: String::new(),
            user_id: "reader".to_string(),
        },
        Remote {
            id: 2,
            base_url: "https://office.example.com".to_string(),
            order: 1,
            passphrase: String::new(),
            user_id: "reader".to_string(),
        },
    ];

    // Deliberately DISCARD the returned Task: `Remotes(Loaded(..))`'s update
    // arm auto-schedules a real `CheckSourceStatus` HTTP health-check per
    // remote. Since nothing in this tool polls that task, it never runs —
    // Rust futures do nothing until polled, and `drain()` is the only poller
    // this tool has. We force "reachable" ourselves instead, synchronously.
    let _ = page.update(PreferencesMessage::Remotes(
        provider::r#async::ProvidedStateMessage::Loaded(remotes),
    ));
    let _ = page.update(PreferencesMessage::SetSourceStatus(1, true));
    let _ = page.update(PreferencesMessage::SetSourceStatus(2, true));
    let _ = page.update(PreferencesMessage::SectionChanged(PreferencesSection::Sources));

    let element = page.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

Note on `ProvidedStateMessage`'s import path: it's defined in `cosmic/src/component/provided_state.rs` per the research (`pub enum ProvidedStateMessage<T>`), not in the `provider` crate — if `provider::r#async::ProvidedStateMessage` doesn't resolve, replace with `crate::component::provided_state::ProvidedStateMessage` (widen `mod provided_state;` in `component/mod.rs` to `pub(crate) mod provided_state;` if needed, following the same pattern as Step 3 in Task 6).

- [ ] **Step 3: Wire it into the orchestrator**

In `cosmic/src/screenshot_tool/mod.rs`, add to the `vec![...]` inside `run()`:
```rust
("cosmic-multi-instance.png", scenes::sources::render(lib).await),
```

- [ ] **Step 4: Build and run, verify output**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
cargo run -p cosmic --features screenshot-tool -- \
  --sample-library /Users/peterpaul/src/personal/read-flow/read-flow.github.io/assets/sample-library \
  --out /tmp/screenshot-tool-out
```
Expected: `2/2 scenes written`; `/tmp/screenshot-tool-out/cosmic-multi-instance.png` exists and visibly shows two sources both marked reachable (open it and eyeball it — `open /tmp/screenshot-tool-out/cosmic-multi-instance.png` on macOS).

- [ ] **Step 5: Commit**

```bash
git add cosmic/src/screenshot_tool/ cosmic/src/page/mod.rs
git commit -m "feat: add sources/multi-instance screenshot scene"
```

---

### Task 3: Dashboard/progress scene

**Files:**
- Modify: `cosmic/src/page/mod.rs`
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/progress.rs`

**Interfaces:**
- Consumes: `crate::document_provider::DocumentProvider::update_reading_status(&self, fingerprint: &str, status: ReadingStatus) -> Result<(), FilesClientError>`, `read_flow_core::api::ReadingStatus`.
- Produces: `cosmic-progress.png`. Requires widening `mod dashboard;` to reach `DashboardPage`/`DashboardMessage` construction (its `Message` type is already re-exported, but the struct itself isn't).

- [ ] **Step 1: Widen `dashboard`'s visibility**

In `cosmic/src/page/mod.rs`, change:
```rust
mod dashboard;
```
to:
```rust
pub(crate) mod dashboard;
```

- [ ] **Step 2: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod progress;
```

- [ ] **Step 3: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/progress.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;
use read_flow_core::api::ReadingStatus;

use crate::page::Page as _;
use crate::page::dashboard::DashboardMessage;
use crate::page::dashboard::DashboardPage;

pub(in crate::screenshot_tool) async fn render(sample_library: &Path) -> anyhow::Result<Vec<u8>> {
    let (application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let seeds = [
        ("leaves-of-grass.epub", ReadingStatus::Unread),
        ("the-time-machine.epub", ReadingStatus::Reading),
        ("twenty-thousand-leagues.epub", ReadingStatus::Read),
        ("meditations.epub", ReadingStatus::Reading),
    ];
    let mut fixture_dirs = Vec::new();
    for (filename, status) in seeds {
        let (document, dir) = crate::test_support::scan_and_fetch_document(
            &application_module,
            &document_provider,
            sample_library.join(filename),
            filename,
        )
        .await;
        fixture_dirs.push(dir);
        for content in &document.contents {
            document_provider
                .update_reading_status(&content.fingerprint, status)
                .await?;
        }
    }

    let (mut page, init_task) = DashboardPage::new(document_provider);
    crate::test_support::drain(init_task).await;
    let _ = page.update(DashboardMessage::LoadDashboard);

    let element = page.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

- [ ] **Step 4: Wire it into the orchestrator**

Add to the `vec![...]` in `screenshot_tool/mod.rs`:
```rust
("cosmic-progress.png", scenes::progress::render(lib).await),
```

- [ ] **Step 5: Build, run, verify**

Same command as Task 2 Step 4. Expected `3/3 scenes written`; open `cosmic-progress.png` and confirm a visible mix of Unread/Reading/Read documents.

- [ ] **Step 6: Commit**

```bash
git add cosmic/src/page/mod.rs cosmic/src/screenshot_tool/
git commit -m "feat: add dashboard/progress screenshot scene"
```

---

### Task 4: Bonus tags-rule scene (directory settings auto-tag form)

**Files:**
- Create: `cosmic/src/screenshot_tool/scenes/tags_rule.rs`
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`
- Possibly modify: `cosmic/src/forms/mod.rs`, `cosmic/src/forms/settings/mod.rs` (widen visibility to `DirectorySettingsForm`)

**Interfaces:**
- Consumes: `crate::forms::settings::directory_settings::{DirectorySettingsForm, DirectorySettingsFormMessage}` (visibility TBD — verify first, see Step 1), `read_flow_core::scan::DirectorySettings`, `read_flow_core::ExpandedPath`.
- Produces: `cosmic-tags-rule.png` — not wired into `features.ts`; a bonus asset per the design spec.

- [ ] **Step 1: Check current visibility of the path to `DirectorySettingsForm`**

Run:
```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
grep -n "^mod settings\|^pub mod settings\|^pub(crate) mod settings" cosmic/src/forms/mod.rs
grep -n "^mod directory_settings\|^pub mod directory_settings\|^pub(crate) mod directory_settings" cosmic/src/forms/settings/mod.rs
grep -n "^pub struct DirectorySettingsForm\|^struct DirectorySettingsForm" cosmic/src/forms/settings/directory_settings.rs
```
If any of the first two greps show a bare `mod X;` (no `pub`), widen it to `pub(crate) mod X;` in that file. If `DirectorySettingsForm` itself is not `pub struct`, widen it to `pub struct` (it needs at minimum `pub(crate)` reachability all the way down; `pub` is fine and matches the crate's existing convention for other page/form structs).

- [ ] **Step 2: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod tags_rule;
```

- [ ] **Step 3: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/tags_rule.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;
use read_flow_core::ExpandedPath;
use read_flow_core::scan::DirectorySettings;

use crate::forms::settings::directory_settings::DirectorySettingsForm;

pub(in crate::screenshot_tool) async fn render(sample_library: &Path) -> anyhow::Result<Vec<u8>> {
    let (_application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let path = ExpandedPath::try_from(sample_library.to_path_buf())
        .map_err(|e| anyhow::anyhow!("expand sample library path: {e}"))?;
    let settings = DirectorySettings::Scan {
        tags: vec!["classics".to_string(), "public-domain".to_string()],
        inherit: false,
    };

    let (form, init_task) = DirectorySettingsForm::new(Some((path, settings)), document_provider);
    crate::test_support::drain(init_task).await;

    let element = form.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

Note: `DirectorySettingsForm::view()` returns `Element<'_, DirectorySettingsFormMessage>` directly (it's an inherent method per the research, not behind the `Page` trait) — no `Page as _` import needed here.

- [ ] **Step 4: Wire it into the orchestrator**

Add to the `vec![...]` in `screenshot_tool/mod.rs`:
```rust
("cosmic-tags-rule.png", scenes::tags_rule::render(lib).await),
```

- [ ] **Step 5: Build, run, verify**

Same command as before. Expected `4/4 scenes written`; open `cosmic-tags-rule.png` and confirm the directory-settings form is visible with the two scan-tags chips (`classics`, `public-domain`) shown.

- [ ] **Step 6: Commit**

```bash
git add cosmic/src/forms/ cosmic/src/screenshot_tool/
git commit -m "feat: add bonus tags-rule screenshot scene"
```

---

### Task 5: Tags scene (document detail with tag chips)

**Files:**
- Modify: `cosmic/src/page/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/tags.rs`
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`

**Interfaces:**
- Consumes: `crate::page::document_details::{DocumentDetails, DocumentDetailsMessage}` (widen `mod document_details;` to `pub(crate)`), `crate::component::tag_editor::TagEditorMessage::SetTags`.
- Produces: `cosmic-tags.png`.

- [ ] **Step 1: Widen `document_details`'s visibility**

In `cosmic/src/page/mod.rs`, change:
```rust
mod document_details;
```
to:
```rust
pub(crate) mod document_details;
```

- [ ] **Step 2: Verify `TagEditorMessage` is reachable, widen if not**

```bash
grep -n "^mod tag_editor\|^pub mod tag_editor\|^pub(crate) mod tag_editor" cosmic/src/component/mod.rs
```
If it's a bare `mod tag_editor;`, widen to `pub(crate) mod tag_editor;`.

- [ ] **Step 3: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod tags;
```

- [ ] **Step 4: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/tags.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;

use crate::component::tag_editor::TagEditorMessage;
use crate::page::Page as _;
use crate::page::document_details::DocumentDetails;
use crate::page::document_details::DocumentDetailsMessage;

pub(in crate::screenshot_tool) async fn render(sample_library: &Path) -> anyhow::Result<Vec<u8>> {
    let (application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let (document, _fixture_dir) = crate::test_support::scan_and_fetch_document(
        &application_module,
        &document_provider,
        sample_library.join("meditations.epub"),
        "meditations.epub",
    )
    .await;

    let (mut page, init_task) = DocumentDetails::new(document, document_provider, application_module);
    crate::test_support::drain(init_task).await;

    let tags = vec![
        "philosophy".to_string(),
        "classic".to_string(),
        "public-domain".to_string(),
        "to-read".to_string(),
    ];
    let _ = page.update(DocumentDetailsMessage::TagEditor(TagEditorMessage::SetTags(tags)));

    let element = page.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

- [ ] **Step 5: Wire it into the orchestrator**

Add to the `vec![...]` in `screenshot_tool/mod.rs`:
```rust
("cosmic-tags.png", scenes::tags::render(lib).await),
```

- [ ] **Step 6: Build, run, verify**

Same command as before. Expected `5/5 scenes written`; open `cosmic-tags.png` and confirm the four tag chips are visible on the document detail view.

- [ ] **Step 7: Commit**

```bash
git add cosmic/src/page/mod.rs cosmic/src/component/mod.rs cosmic/src/screenshot_tool/
git commit -m "feat: add tags screenshot scene"
```

---

### Task 6: Scanning/merge scene

**Files:**
- Modify: `cosmic/src/component/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/scanning.rs`
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`

**Interfaces:**
- Consumes: `crate::page::{Pages, PageMessage, PageSelector}` (already `pub` — `Pages` is defined directly in `page/mod.rs`, no widening needed), `crate::page::DocumentListMessage::DocumentsComponent` variant, `crate::component::documents::DocumentsMessage::ToggleDocumentSelected` (widen `mod documents;` in `component/mod.rs` to `pub(crate)`).
- Produces: `cosmic-scanning.png`.

- [ ] **Step 1: Widen `documents`'s visibility**

```bash
grep -n "^mod documents\|^pub mod documents\|^pub(crate) mod documents" cosmic/src/component/mod.rs
```
Widen the bare `mod documents;` to `pub(crate) mod documents;` if needed.

- [ ] **Step 2: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod scanning;
```

- [ ] **Step 3: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/scanning.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;

use crate::component::documents::DocumentsMessage;
use crate::config::Config;
use crate::page::DocumentListMessage;
use crate::page::PageMessage;
use crate::page::PageSelector;
use crate::page::Pages;

pub(in crate::screenshot_tool) async fn render(sample_library: &Path) -> anyhow::Result<Vec<u8>> {
    let (application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    // Same book, different format/hash — two distinct rows, real candidates
    // for the merge feature. NOT the byte-identical `(copy).epub`: the
    // scanner auto-merges byte-identical content into one Document with
    // multiple sources, so that pair would collapse into a single row with
    // nothing to select.
    let (epub_doc, _epub_dir) = crate::test_support::scan_and_fetch_document(
        &application_module,
        &document_provider,
        sample_library.join("pride-and-prejudice.epub"),
        "pride-and-prejudice.epub",
    )
    .await;
    let (pdf_doc, _pdf_dir) = crate::test_support::scan_and_fetch_document(
        &application_module,
        &document_provider,
        sample_library.join("pride-and-prejudice.pdf"),
        "pride-and-prejudice.pdf",
    )
    .await;

    let (mut pages, init_task) = Pages::new(
        application_module,
        document_provider,
        Config::default(),
        crate::logging::init(),
    );
    crate::test_support::drain(init_task).await;

    for document in [epub_doc, pdf_doc] {
        let messages = crate::test_support::drain(pages.update(PageMessage::Documents(
            DocumentListMessage::DocumentsComponent(DocumentsMessage::ToggleDocumentSelected(
                document,
            )),
        )))
        .await;
        for message in messages {
            if !matches!(message, PageMessage::Out(_)) {
                let _ = pages.update(message);
            }
        }
    }

    let element = pages.view(&PageSelector::Documents);
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

- [ ] **Step 4: Wire it into the orchestrator**

Add to the `vec![...]` in `screenshot_tool/mod.rs`:
```rust
("cosmic-scanning.png", scenes::scanning::render(lib).await),
```

- [ ] **Step 5: Build, run, verify**

Same command as before. Expected `6/6 scenes written`; open `cosmic-scanning.png` and confirm both "Pride and Prejudice" rows are selected with the Merge button visible in the header.

- [ ] **Step 6: Commit**

```bash
git add cosmic/src/component/mod.rs cosmic/src/screenshot_tool/
git commit -m "feat: add scanning/merge screenshot scene"
```

---

### Task 7: EPUB reader scene

**Files:**
- Modify: `cosmic/src/page/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/epub_reader.rs`
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`

**Interfaces:**
- Consumes: `crate::page::epub_viewer::{EpubViewer, EpubViewerMessage}` (widen `mod epub_viewer;` to `pub(crate)`).
- Produces: `cosmic-epub-reader.png`.

- [ ] **Step 1: Widen `epub_viewer`'s visibility**

In `cosmic/src/page/mod.rs`, change:
```rust
mod epub_viewer;
```
to:
```rust
pub(crate) mod epub_viewer;
```

- [ ] **Step 2: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod epub_reader;
```

- [ ] **Step 3: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/epub_reader.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;

use crate::page::Page as _;
use crate::page::epub_viewer::EpubViewer;
use crate::page::epub_viewer::EpubViewerMessage;

pub(in crate::screenshot_tool) async fn render(sample_library: &Path) -> anyhow::Result<Vec<u8>> {
    let (application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let (document, _fixture_dir) = crate::test_support::scan_and_fetch_document(
        &application_module,
        &document_provider,
        sample_library.join("the-time-machine.epub"),
        "the-time-machine.epub",
    )
    .await;

    let (mut viewer, init_task) = EpubViewer::new(document, document_provider);
    let messages = crate::test_support::drain(init_task).await;
    for message in messages {
        if !matches!(message, EpubViewerMessage::Out(_)) {
            let _ = viewer.update(message);
        }
    }

    let element = viewer.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}
```

- [ ] **Step 4: Wire it into the orchestrator**

Add to the `vec![...]` in `screenshot_tool/mod.rs`:
```rust
("cosmic-epub-reader.png", scenes::epub_reader::render(lib).await),
```

- [ ] **Step 5: Build, run, verify**

Same command as before. Expected `7/7 scenes written`; open `cosmic-epub-reader.png` and confirm readable chapter text from *The Time Machine* is visible.

- [ ] **Step 6: Commit**

```bash
git add cosmic/src/page/mod.rs cosmic/src/screenshot_tool/
git commit -m "feat: add EPUB reader screenshot scene"
```

---

### Task 8: PDF reader scene (+ non-blank-render regression test)

**Files:**
- Modify: `cosmic/src/page/mod.rs`
- Create: `cosmic/src/screenshot_tool/scenes/pdf_reader.rs`
- Modify: `cosmic/src/screenshot_tool/scenes/mod.rs`
- Modify: `cosmic/src/screenshot_tool/mod.rs`

**Interfaces:**
- Consumes: `crate::page::mu_pdf_viewer::{MuPdfViewer, MuPdfViewerMessage}` (widen `mod mu_pdf_viewer;` to `pub(crate)`).
- Produces: `cosmic-pdf-reader.png`, plus a `#[test]` guarding against a silently blank render.

- [ ] **Step 1: Widen `mu_pdf_viewer`'s visibility**

In `cosmic/src/page/mod.rs`, change:
```rust
mod mu_pdf_viewer;
```
to:
```rust
pub(crate) mod mu_pdf_viewer;
```

- [ ] **Step 2: Add the module declaration**

In `cosmic/src/screenshot_tool/scenes/mod.rs`, add:
```rust
pub(super) mod pdf_reader;
```

- [ ] **Step 3: Implement the scene**

Create `cosmic/src/screenshot_tool/scenes/pdf_reader.rs`:

```rust
use std::path::Path;

use cosmic::Theme;
use cosmic_golden::HeadlessRenderer;

use crate::page::Page as _;
use crate::page::mu_pdf_viewer::MuPdfViewer;
use crate::page::mu_pdf_viewer::MuPdfViewerMessage;

pub(in crate::screenshot_tool) async fn render(sample_library: &Path) -> anyhow::Result<Vec<u8>> {
    let (application_module, document_provider, _db_dir) =
        crate::test_support::document_provider().await;

    let (document, _fixture_dir) = crate::test_support::scan_and_fetch_document(
        &application_module,
        &document_provider,
        sample_library.join("jekyll-and-hyde.pdf"),
        "jekyll-and-hyde.pdf",
    )
    .await;

    let (mut viewer, init_task) = MuPdfViewer::new(document, document_provider);
    let messages = crate::test_support::drain(init_task).await;
    for message in messages {
        if !matches!(message, MuPdfViewerMessage::Out(_)) {
            let _ = viewer.update(message);
        }
    }

    let element = viewer.view();
    let mut renderer = HeadlessRenderer::with_theme(Theme::dark());
    Ok(renderer.render(element, super::super::WIDTH, super::super::HEIGHT))
}

#[cfg(any(test, feature = "screenshot-tool"))]
#[cfg(test)]
mod tests {
    use super::*;

    /// Guards against a future mupdf/library upgrade silently breaking
    /// rendering and producing a blank marketing screenshot.
    #[tokio::test]
    async fn pdf_reader_scene_renders_non_blank_pixels() {
        let sample_library = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../read-flow.github.io/assets/sample-library");
        let rgba = render(&sample_library).await.expect("render pdf reader scene");

        assert_eq!(rgba.len(), (super::super::super::WIDTH * super::super::super::HEIGHT * 4) as usize);
        let all_same = rgba.chunks_exact(4).all(|p| p == &rgba[0..4]);
        assert!(!all_same, "rendered PDF page is a single solid color — rendering likely broke");
    }
}
```

- [ ] **Step 4: Wire it into the orchestrator**

Add to the `vec![...]` in `screenshot_tool/mod.rs`:
```rust
("cosmic-pdf-reader.png", scenes::pdf_reader::render(lib).await),
```

- [ ] **Step 5: Run the new regression test**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
cargo test -p cosmic --features screenshot-tool pdf_reader_scene_renders_non_blank_pixels -- --nocapture
```
Expected: PASS. If the path in the test needs adjusting because the sibling-repo layout differs, fix the relative path — the important invariant is "resolves to `read-flow.github.io/assets/sample-library`".

- [ ] **Step 6: Build the full tool, run, verify**

Same command as before (all 8 scenes now). Expected `8/8 scenes written`; open `cosmic-pdf-reader.png` and confirm readable text from *The Strange Case of Dr Jekyll and Mr Hyde* is visible.

- [ ] **Step 7: Commit**

```bash
git add cosmic/src/page/mod.rs cosmic/src/screenshot_tool/
git commit -m "feat: add PDF reader screenshot scene with non-blank render test"
```

---

### Task 9: Phase 2 — integrate PNGs into read-flow.github.io

**Files:**
- Modify: `src/lib/features.ts`
- Modify: `src/lib/features.test.ts` (or wherever its co-located test lives — check first)
- Modify: `src/components/FeatureRow.astro` (only if it needs to switch from URL string to local asset import)
- Modify: `CLAUDE.md`
- Copy: 8 PNGs into `src/assets/screenshots/`

**Interfaces:**
- Consumes: the 8 PNGs produced by the `screenshot_tool` binary (Tasks 1–8), copied from wherever `--out` pointed.
- Produces: updated `screenshotUrl()` (or equivalent) resolving local assets; no more hotlinking.

- [ ] **Step 1: Generate and copy the real PNGs**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
mkdir -p /Users/peterpaul/src/personal/read-flow/read-flow.github.io/src/assets/screenshots
cargo run -p cosmic --features screenshot-tool -- \
  --sample-library /Users/peterpaul/src/personal/read-flow/read-flow.github.io/assets/sample-library \
  --out /Users/peterpaul/src/personal/read-flow/read-flow.github.io/src/assets/screenshots
```
Expected: `8/8 scenes written` and all 8 files present in `src/assets/screenshots/`.

- [ ] **Step 2: Read the current `features.ts` and `screenshotUrl()`**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow.github.io
cat src/lib/features.ts
grep -rn "screenshotUrl\|screenshot" src/components/FeatureRow.astro
```
(This step is read-only reconnaissance — the exact edit in Step 3 depends on what's found. Do not skip it; the current shape of `screenshotUrl()` determines whether Step 3 is a one-line change or needs `FeatureRow.astro` touched too.)

- [ ] **Step 3: Update `screenshotUrl()` (or switch to local imports) and the `screenshot` fields**

Replace whatever hotlinking logic exists (a template string building a `raw.githubusercontent.com/read-flow/read-flow/screenshots/...` URL) with either:
- a function that returns `/src/assets/screenshots/${filename}` resolved via Astro's asset pipeline, or
- direct `import` statements per screenshot in `FeatureRow.astro` if that's what Astro's image handling needs for optimization.

Update each feature entry's `screenshot` field in `src/lib/features.ts` to match the actual filenames written in Step 1 (`cosmic-scanning.png`, `cosmic-tags.png`, `cosmic-progress.png`, `cosmic-multi-instance.png`, `cosmic-pdf-reader.png`, `cosmic-epub-reader.png`, `cosmic-opds.png`).

- [ ] **Step 4: Update or add the co-located test**

Run `npm test` first to see what the existing `features.test.ts` (or equivalent) currently asserts about `screenshotUrl()`/`screenshot` fields, then update its expectations to match the new local-path behavior instead of the old hotlink URL format.

- [ ] **Step 5: Run the full check suite**

```bash
npm run check
npm test
npm run build
```
Expected: all pass, and `dist/` contains the 7 screenshots actually referenced by `features.ts` (verify with `find dist -iname "cosmic-*.png"`).

- [ ] **Step 6: Start the dev server and visually confirm**

```bash
npm run dev
```
Open `http://localhost:4321`, scroll to the feature section, and confirm all 7 screenshots render (not broken images) and look correct for their feature.

- [ ] **Step 7: Update `CLAUDE.md`'s Conventions section**

Replace the "Screenshots are hotlinked..." bullet with a description of local storage, e.g.: screenshots live in `src/assets/screenshots/`, are generated by the `screenshot_tool` binary in the `read-flow/read-flow` repo (`cargo run -p cosmic --features screenshot-tool -- --sample-library <path> --out src/assets/screenshots`), and should be regenerated + re-committed whenever the app's relevant UI changes.

- [ ] **Step 8: Commit**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow.github.io
git add src/assets/screenshots/ src/lib/features.ts src/lib/features.test.ts src/components/FeatureRow.astro CLAUDE.md
git commit -m "feat: replace hotlinked screenshots with locally-generated PNGs"
```

- [ ] **Step 9: Delete the old `screenshots` branch (only after confirming nothing else references it)**

```bash
cd /Users/peterpaul/src/personal/read-flow/read-flow
grep -rn "screenshots" README.md
```
If the README's screenshot table still points at the `screenshots` branch, that's a separate follow-up (out of scope for this plan — flag it to the user rather than silently deleting a branch another doc still depends on). Only run `git push origin --delete screenshots` once confirmed nothing references it, and only with the user's explicit go-ahead (branch deletion is a destructive, hard-to-reverse action on a shared remote).

---

## Self-review notes

- **Spec coverage**: all 8 scenes from the design spec have a task (Tasks 1–8); Phase 2's 5 integration steps from the spec are covered by Task 9's steps 3, 7, and the branch-deletion note in step 9.
- **Residual uncertainty, by design**: a handful of exact module-privacy states (`forms::settings`, `component::provided_state`, `component::tag_editor`) weren't directly read line-by-line before writing this plan; each such spot has an explicit `grep`-first step with the precise one-line fix (`pub(crate) mod X;`) rather than a vague placeholder — this is a deliberate trade-off given the size of the codebase involved, not a gap in the plan's content.
- **Type/signature consistency check**: `Config::default()` and `crate::logging::init()` are used identically across Tasks 1, 2, 3, 6 — matches the one precedent test (`page/mod.rs:1136`) that constructs `Pages`/`PreferencesPage` this way. `drain()` + "replay all non-`Out` messages" is used identically in Tasks 6, 7, 8 — matches the `save_all_reading_progress_saves_every_open_viewer` precedent exactly.
# Sample library

Placeholder EPUB/PDF documents for taking the screenshots described in
`docs/screenshots-needed.md`. Each title is a public-domain classic reimagined with fresh cover
art and a short original placeholder text (not the real book's text) — good enough to look like a
real library without reproducing anyone's actual prose at length.

Every file has proper embedded metadata (title, author, subtitle/description, and — for EPUB —
subject tags), so it reads correctly in the document list, detail view, and readers.

## Titles

| Title | Author | Tags | Formats |
|---|---|---|---|
| Twenty Thousand Leagues Under the Sea | Jules Verne | Science Fiction, Adventure | EPUB, PDF |
| Pride and Prejudice | Jane Austen | Classic, Romance | EPUB, PDF |
| The Strange Case of Dr Jekyll and Mr Hyde | Robert Louis Stevenson | Gothic, Mystery | EPUB, PDF |
| Meditations | Marcus Aurelius | Philosophy | EPUB, PDF |
| Leaves of Grass | Walt Whitman | Poetry | EPUB, PDF |
| The Time Machine | H. G. Wells | Science Fiction | EPUB, PDF |

`pride-and-prejudice (copy).epub` is a byte-identical duplicate of `pride-and-prejudice.epub`,
included specifically for the `scanning` (automatic scanning & de-duplication) screenshot.

`_covers/` holds the standalone cover PNGs used to build each EPUB/PDF, in case you need the
artwork on its own.

## Usage

```
./run-sample-library.sh
```

This scans the library into `database.db`, applies the tags above (via
`read-flow-cli apply-tags`, using the rules in `read-flow.toml`), then launches the Cosmic desktop
app against it. Assumes a sibling checkout of `read-flow/read-flow`; set `READ_FLOW_REPO` if
yours lives elsewhere. Then follow the shot list in `docs/screenshots-needed.md`.

`database.db` (and its `-shm`/`-wal` files) are git-ignored — safe to delete and re-run anytime.

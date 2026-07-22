#!/usr/bin/env bash
# Scans this sample library into database.db, applies the tags from
# read-flow.toml, then launches the Read Flow (Cosmic) desktop app against
# it — so you can take the screenshots listed in docs/screenshots-needed.md.
#
# Assumes a sibling checkout of read-flow/read-flow (override with
# READ_FLOW_REPO if yours lives elsewhere).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

READ_FLOW_REPO="${READ_FLOW_REPO:-$SCRIPT_DIR/../../../read-flow}"
if [ ! -f "$READ_FLOW_REPO/Cargo.toml" ]; then
  echo "error: no read-flow checkout found at $READ_FLOW_REPO" >&2
  echo "set READ_FLOW_REPO=/path/to/read-flow and try again" >&2
  exit 1
fi

echo "==> building read-flow-cli"
cargo build --manifest-path "$READ_FLOW_REPO/Cargo.toml" -p read-flow-core --bin read-flow-cli
CLI="$READ_FLOW_REPO/target/debug/read-flow-cli"

echo "==> scanning $SCRIPT_DIR"
"$CLI" --configuration-file read-flow.toml scan .

echo "==> applying tags"
"$CLI" --configuration-file read-flow.toml apply-tags

echo "==> building and launching the desktop app"
cargo run --manifest-path "$READ_FLOW_REPO/Cargo.toml" -p read-flow --bin read-flow -- \
  --configuration-file "$SCRIPT_DIR/read-flow.toml"

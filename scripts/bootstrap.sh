#!/usr/bin/env bash
set -euo pipefail

echo "Installing JavaScript dependencies..."
pnpm install

echo "Checking Rust workspace..."
cargo check

echo "Done."

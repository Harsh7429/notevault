#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# NoteVault backend — build script
# Run this as the Render "Build Command" or on any Ubuntu/Debian host.
#
# What this does:
#   1. Installs qpdf (apt) — used for lossless PDF encryption during download.
#      Without qpdf the server falls back to @cantoo/pdf-lib (still works, but
#      complex PDFs with coloured backgrounds render correctly only with qpdf).
#   2. Runs `npm install` for Node dependencies.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "▶  Installing system packages…"
if command -v apt-get &>/dev/null; then
  apt-get update -qq
  apt-get install -y --no-install-recommends qpdf
  echo "✔  qpdf $(qpdf --version 2>&1 | head -1) installed"
else
  echo "⚠  apt-get not found — skipping qpdf install (will use pdf-lib fallback)"
fi

echo "▶  Installing Node dependencies…"
npm install

echo "✔  Build complete"

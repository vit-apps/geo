# ADR 0002 — Client-only PWA on GitHub Pages (no back-end)

**Date:** 2026-10-12
**Status:** Accepted

## Context
Must run on free cloud infrastructure and be installable/offline. The brief
allows a client-only app.

## Decision
Ship as a purely client-side static PWA deployed to GitHub Pages. All state
(per-region mastery, best times, settings) lives in browser local storage.
No server, accounts, or cloud sync.

## Consequences
- Zero hosting cost; trivial deploy.
- Offline-first after first load via a precaching service worker.
- Progress is per-device (no cross-device sync) — acceptable for the target
  use.
- Base path must be configured for the GitHub Pages project subpath.

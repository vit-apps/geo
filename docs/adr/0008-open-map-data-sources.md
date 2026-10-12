# ADR 0008 — Open map data sources

**Date:** 2026-10-12
**Status:** Accepted

## Context
Maps and region names must come from open sources and bundle for offline
use. Four maps are preloaded: World, Europe, Middle East, North America +
US states.

## Decision
- **world-atlas** (TopoJSON, from Natural Earth) — world country boundaries
  at 110m/50m/10m, with ISO numeric ids and names. Source for World, and for
  Europe and Middle East as filtered subsets.
- **us-atlas** (TopoJSON, from US Census) — US states with FIPS ids and
  names. Source for US states within the North America map.
- **Wikidata** — region-name translations per stable id, used by
  `add-language`.

Data is fetched at acquisition/build time and bundled locally; no runtime
CDN dependency.

## Consequences
- Europe and Middle East derive from one source file (world), reducing data.
- Stable ids (ISO numeric, FIPS) key both geometry and translations.
- Resolution is a size/detail trade-off chosen per map by `add-map`.

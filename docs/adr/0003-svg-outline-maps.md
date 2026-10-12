# ADR 0003 — SVG outline maps as the rendering approach

**Date:** 2026-10-12
**Status:** Accepted

## Context
Maps may be empty or partially empty; every region must be individually
selectable; the app must run offline and small on low-end Android.

## Decision
Render maps as flat SVG outlines: one `<path>` per region with a stable id.
Derive paths from open TopoJSON atlases (world-atlas, us-atlas).

## Alternatives considered
- **Interactive tile maps (MapLibre/OSM):** realistic but heavy, hard to run
  fully offline on GitHub Pages.
- **Static image + hotspots:** simple but inflexible; blocks name-the-place
  and jigsaw modes.

## Consequences
- Tiny offline bundles; crisp at any zoom.
- Each region is a tappable, highlightable, draggable shape — supports all
  planned game modes on one renderer.
- Requires a build/acquisition step to simplify and convert boundaries.

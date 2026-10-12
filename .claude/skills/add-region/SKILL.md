---
name: add-region
description: Use this skill when asked to add a region, fix a region, update a region's boundary, correct a region name, or add a missing country/state/province to an existing map. Triggers on phrases like "add region", "fix region", "missing region", "region boundary wrong", "add [country] to [map]".
---

# Skill: add-region

Add or fix a single region within an existing geo-game map. A region is one entry in the `regions` array of a `src/data/maps/<map-id>.json` file. Use this skill for targeted edits — when the map file already exists and only one or a few regions need to be added, corrected, or updated.

This skill documents the four stages required by ADR 0007 for any region expansion or correction.

---

## Stage 1 — Acquire the Region Boundary

Identify the SVG path data for the target region:

- **From an existing atlas**: if the parent map was built from `world-atlas` or `us-atlas`, locate the region's feature in the same TopoJSON source by its numeric id or FIPS code, then project and stringify it with the same pipeline used in `scripts/build-maps.mjs`.
- **Manual path**: if the region was omitted or has an incorrect boundary, extract the corrected path from Natural Earth Admin-1 shapefiles (convert with `topojson-server` + `geo2svg`), or trace/correct it by hand in an SVG editor, then copy the `d` attribute value.
- Record the source and any corrections made.

The region object must contain:
- `id` — unique string within the map (matches the ISO or atlas id)
- `nameKey` — i18n key, e.g. `region.<id>`
- `svgPath` — the SVG path `d` attribute string (non-empty)
- `bbox` — 4-element array `[minX, minY, maxX, maxY]` in SVG coordinate space
- `centroid` — 2-element array `[cx, cy]` for label placement (optional but recommended)

---

## Stage 2 — Edit the Map File

1. Open `src/data/maps/<map-id>.json`.
2. Insert the new region object into the `regions` array (order is cosmetic; alphabetical by id is conventional).
3. Add the region's `nameKey` to `src/i18n/en.json` and all other locale files under `src/i18n/`.
4. If fixing an existing region, update the relevant fields (`svgPath`, `bbox`, `nameKey`) in place, keeping the same `id`.

Do not change the map's `id`, `nameKey`, or `viewBox` unless the region addition requires expanding the bounding box.

---

## Stage 3 — Test

Run the full test suite:

```bash
npm test
```

The parameterized suite in `src/data/__tests__/mapIndex.test.ts` will cover the modified map automatically (it iterates over `MAP_IDS`). All tests must pass before the quality gate.

---

## Stage 4 — Quality Gate

Run the validate-map helper against the modified map file:

```bash
node .claude/skills/add-map/validate-map.mjs src/data/maps/<map-id>.json
```

Expected output: `OK: <map-id> <N> regions`

Additionally check:

- **No duplicate ids**: the validator catches these, but double-check if you merged from another source.
- **Missing translations**: confirm the new `nameKey` is present in every locale file under `src/i18n/`. List untranslated keys in the PR description.
- **Visual spot-check**: open the game in the browser (use the `chrome-devtools` skill or `npm run dev`), navigate to the affected map, and confirm the new/corrected region renders correctly — no overlap with neighbours, correct highlight on click, label positioned near the centroid.

---

## Stage 5 — Document

If the region was previously missing or had a known incorrect boundary, note the fix in the commit message. If the correction involved a non-trivial source or methodology decision (e.g. switching atlas versions), append an ADR to `docs/decisions/` and add a one-line entry to `docs/decisions-log.md`.

Per ADR 0007, all region expansions run through this skill. Reference the related map's ADR (or the new ADR) in the commit message.

---

## Checklist

- [ ] Region boundary source recorded
- [ ] Region object added/updated in `src/data/maps/<map-id>.json`
- [ ] `nameKey` added to `en.json` and all other locale files
- [ ] `npm test` passes
- [ ] `validate-map.mjs` prints `OK: <map-id> <N> regions`
- [ ] No duplicate ids
- [ ] Missing translations listed
- [ ] Visual spot-check passed
- [ ] ADR written if needed

---
name: add-map
description: Use this skill when asked to add a map, add a new map, add a country's regions, or register a new geography for the geo-game. Triggers on phrases like "add a map", "new map", "add [country] regions", "add [continent] map".
---

# Skill: add-map

Add a new geography map to the geo-game. A map is a JSON file under `src/data/maps/<id>.json` with SVG path data for each region, plus matching i18n keys for region names.

This skill documents the four stages required by ADR 0007 for any map expansion.

---

## Stage 1 — Acquire Open Boundaries

Identify the open-source boundary data for the target geography:

- **World / continents**: use `world-atlas` (Natural Earth) subset by ISO 3166-1 numeric ids. The `scripts/build-maps.mjs` script already loads `world-atlas/world/110m.json`; add the target ISO id set there.
- **US states**: use `us-atlas` (Census Bureau TopoJSON).
- **Other regions**: download Natural Earth Admin-1 shapefiles and convert with `topojson-server` + `geo2svg`, or use an equivalent open atlas.

Record the source, version, and licence in the commit message or in a new ADR (see Stage 4).

---

## Stage 2 — Generate the Map File

1. Add the new map id and its region id set (or atlas object) to `scripts/build-maps.mjs`.
2. Add the map's `nameKey` string to `src/i18n/en.json` (and other locale files) under the key `map.<id>`.
3. Run the build script:
   ```bash
   npm run build:maps
   ```
4. Confirm the new file `src/data/maps/<id>.json` is created with the expected regions.
5. Confirm all `nameKey` values (e.g. `region.<id>`) appear in `src/i18n/en.json`.
6. Add the new id to the `MAP_IDS` constant in `src/data/mapIndex.ts` (or wherever the map registry lives).

---

## Stage 3 — Test

The parameterized suite in `src/data/__tests__/mapIndex.test.ts` iterates over `MAP_IDS`, so adding the id to `MAP_IDS` automatically includes it in coverage. Run:

```bash
npm test
```

All tests must pass before proceeding. Fix any failures (broken region ids, missing nameKeys, bad JSON structure) before the quality gate.

---

## Stage 4 — Quality Gate

Run the validate-map helper against the new file:

```bash
node .claude/skills/add-map/validate-map.mjs src/data/maps/<id>.json
```

Expected output: `OK: <id> <N> regions`

Additionally check:

- **File size budget**: the JSON file should remain under 500 KB. Warn if larger (Natural Earth 10m data is much bigger than 110m).
- **Missing translations**: diff the new `nameKey` values against every locale file under `src/i18n/`. List any untranslated keys as a TODO comment in the PR description.
- **Visual spot-check**: open the game in the browser (use the `chrome-devtools` skill or `npm run dev`) and navigate to the new map. Confirm regions render without gaps or overlaps, and that clicking a region highlights it correctly.

---

## Stage 5 — Document

If any non-trivial choice was made during acquisition or generation (boundary resolution, projection, source atlas, id scheme), append a new ADR to `docs/decisions/` using the project ADR template, and add a one-line entry to `docs/decisions-log.md`.

Per ADR 0007, all map expansions run through this skill. Reference the ADR number in the commit message.

---

## Checklist

- [ ] Source and licence recorded
- [ ] `npm run build:maps` succeeds
- [ ] `MAP_IDS` updated
- [ ] All nameKeys present in `en.json`
- [ ] `npm test` passes
- [ ] `validate-map.mjs` prints `OK: <id> <N> regions`
- [ ] File size within budget
- [ ] Missing translations listed
- [ ] Visual spot-check passed
- [ ] ADR written if needed

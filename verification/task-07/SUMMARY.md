# Task 07 Verification Summary

## Steps

| Step | Evidence | Expected | Actual | Result |
|------|----------|----------|--------|--------|
| step2-build | step2-build.log | Maps built, count > 150, europe/middle-east non-empty | 225 region names; world=174, europe=31, middle-east=14, north-america=51 | PASS |
| step5-datatest | step5-datatest.log | All 4 maps pass (non-empty paths, no dup ids, centroid within bbox) | 4/4 tests pass | PASS |

## Per-Map Region Counts

| Map | Regions | Notes |
|-----|---------|-------|
| world | 174 | 3 features excluded (N. Cyprus, Somaliland, Kosovo) — no ISO numeric id in atlas |
| europe | 31 | EUROPE_IDS filter; some microstates not in 110m resolution (Monaco, San Marino, etc.) |
| middle-east | 14 | MIDDLE_EAST_IDS filter; Bahrain (048) absent — too small for 110m resolution |
| north-america | 51 | US States + DC |

## Atlas ID Format

Atlas IDs are ISO numeric strings, NOT zero-padded (e.g. '040' for Austria, '056' for Belgium).
The EUROPE_IDS and MIDDLE_EAST_IDS sets use matching format — filters worked correctly.

## Known Quirk: Duplicate Set Entries

EUROPE_IDS contains '688' twice, MIDDLE_EAST_IDS contains '368' twice.
JS Set deduplication is automatic — no issue.

## Build Adjustment

The brief's verbatim script was modified in one way:
- World-map filter added `.filter((f) => f.id != null)` to skip 3 features (N. Cyprus, Somaliland, Kosovo) that have no ISO numeric id in the atlas.
- Without this fix, `String(undefined)` produces the string `'undefined'`, causing 3 duplicate region ids and the data test would fail.
- Europe/Middle-East are unaffected since their filter `filterSet.has(String(f.id))` would already exclude `'undefined'`.

## Fix Rows (post-review cleanup)

| Step | Evidence | Expected | Actual | Result |
|------|----------|----------|--------|--------|
| fix1-enjson | fix1-enjson.log | region.undefined absent, keys=225 | has undefined key: false, keys: 225 | PASS |
| fix1-datatest | fix1-datatest.log | 4/4 pass | 4/4 pass | PASS |

Fixes applied:
1. Removed stale `"region.undefined": "Kosovo"` key from src/i18n/en.json (left from pre-fix build run).
2. Removed unused `geoBounds` from d3-geo import in scripts/build-maps.mjs.
Maps rebuilt; en.json now has 225 keys matching the 225 region names printed by the build.

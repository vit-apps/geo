# GeoMap Game — Design Specification

**Date:** 2026-10-12
**Status:** Approved for planning
**Author:** Brainstormed collaboratively

## 1. Purpose

A web-based game for learning world and regional geography by locating,
naming, and placing regions on empty or partially empty maps. The primary
target is Android devices via the browser. It must run on free cloud
infrastructure (GitHub Pages), be installable to the device as a PWA, and
work offline after first load.

### Who it is for and what success looks like

- Learners from first-graders through experts, learning the same maps at
  different scopes and difficulty.
- Success: a player opens the installed app offline, picks a map and a
  level, and the game adaptively drills the regions they are weakest on
  until mastery, visibly tracking progress.

## 2. Scope

### In scope (initial build)
- Client-only PWA, installable, offline-capable, hosted on GitHub Pages.
- One game mode at launch: **Locate a named place** (the game names a
  region, the player taps it on the map).
- Four preloaded maps: **World**, **Europe**, **Middle East**,
  **North America + US states**.
- Adaptive spaced-repetition scheduling of which region is asked next.
- Difficulty via **levels** that set the starting region set
  (beginner → expert) combined with adaptive repetition within that set.
- Three selectable scoring modes: **no-fail learning**, **lives**,
  **timer / best time**.
- Full internationalization from day one, shipping **English + Hebrew**,
  with right-to-left (RTL) support for UI chrome.
- A development-layer of **in-repo Claude skills** for expansion tasks.

### Planned expansion (architected for, not built now)
- Additional game modes: name-the-highlighted-place, place capitals/cities,
  drag jigsaw pieces into place.
- Additional maps, regions, and languages — all added via the dev skills.

### Out of scope
- Any server/back-end, user accounts, or cloud-stored progress.
- Multiplayer.
- Realistic tile/satellite maps.

## 3. Architecture

The repository contains two halves: the shipped app and the development
tooling that builds and grows it.

### 3.A The app (ships to GitHub Pages)

Client-only PWA. Stack: **React + Vite + TypeScript** (see ADR 0001).
Three layers:

1. **Map data layer** — bundled TopoJSON (World + US states) and derived
   per-map region data. A region is
   `{ id, nameKey, svgPath, centroid, bbox, capital? }`. The four preloaded
   maps are generated from two source atlases (world-atlas, us-atlas);
   Europe and Middle East are filtered subsets of world data. Adding a map
   is a data task, not a code change.

2. **Game engine layer** — pure framework-agnostic TypeScript, DOM-free,
   unit-tested. Contains game modes, scoring strategies, and the adaptive
   spaced-repetition scheduler. Never touches the DOM.

3. **UI layer** — React: SVG map renderer, screens, i18n + RTL chrome.
   Holds no game logic; renders engine state and forwards taps.

**Persistence:** browser local storage — per-region mastery, best times,
settings (language, mode). Enables adaptive repetition across sessions and
offline.

### 3.B The development layer (in-repo Claude skills)

Under `.claude/skills/`, each a markdown workflow + helper scripts. Each
orchestrates four stages: **acquire → generate → test → quality gate**, and
records non-trivial choices as an ADR.

- `add-map` — add a new map from open-source boundaries.
- `add-region` — add/correct individual regions in an existing map.
- `add-game-mode` — scaffold a new engine mode against the mode interface.
- `add-language` — add a UI + region-name locale from open sources.

**Adopted rule:** expansion tasks (map, region, mode, language) are performed
*through* these skills, so acquisition, codegen, tests, and quality gates
always run.

### 3.C Documentation

- This spec — the overview.
- `docs/adr/NNNN-*.md` — one ADR per significant decision.
- `docs/decisions-log.md` — running one-line index of all ADRs.

## 4. Game engine design

Pure TypeScript, DOM-free, unit-tested. Four concerns:

### 4.1 Region & map model
```
Region  { id, nameKey, centroid, bbox, svgPath, capital? }
GameMap { id, nameKey, projection, regions: Region[] }
```
The engine holds geometry and ids only; the UI reads `svgPath` to draw.

### 4.2 Game mode interface
```
GameMode {
  start(sessionConfig): void
  nextPrompt(): Prompt
  submitAnswer(regionId): AnswerResult
  isComplete(): boolean
  score(): ScoreState
}
```
Ship **LocateMode**. Future modes implement the same contract — additive,
no engine rewrite.

### 4.3 Adaptive scheduler (spaced repetition)
Separate from modes, so all modes benefit. Per-region mastery: times seen,
times correct, last-seen, due-ness. A **Leitner-box** scheme (chosen over
full SM-2 for simplicity and explainability, suitable for children):
- Wrong → region drops to box 1 (comes back soon).
- Right → region moves up a box (comes back later).
- `nextPrompt()` asks the scheduler for the most-due region within the
  active level's region set.

A **level** sets the starting region set (first-grader: ~6 large countries;
expert: all regions). Adaptive repetition schedules within that set.

### 4.4 Scoring strategies (pluggable, layered on any mode)
- **No-fail learning** — wrong tap reveals the right region and moves on.
- **Lives** — N wrong taps ends the round.
- **Timer / best time** — race the clock; persist best time per map+level.

### 4.5 Round data flow
```
UI → engine.start(map, level, mode, scoring)
loop:
  prompt = engine.nextPrompt()       // scheduler picks a due region
  player taps a region
  result = engine.submitAnswer(id)   // updates mastery
  UI shows feedback
until engine.isComplete()
persist mastery + best time; show results
```

### 4.6 Testing
Engine is the most-tested part (TDD): scheduler promotion/demotion,
due-ness ordering, each scoring strategy's end condition, mode correctness.
No browser required.

## 5. UI layer design

### 5.1 SVG map renderer
- One `<svg>` with one `<path>` per region, keyed by id; `viewBox` from the
  map bounding box.
- Touch-first: direct path taps; invisible enlarged hit-area and minimum
  tap target for tiny/clustered regions; pan + pinch-zoom for dense maps.
- Visual states per region via CSS classes: idle, highlighted, correct,
  wrong, revealed.
- Mode-agnostic: shows regions, emits `onRegionTap(id)`.

### 5.2 Screens
1. Home — continue, pick map, settings, streak/mastery summary.
2. Map picker — the four preloaded maps.
3. Level & mode picker — level sets region set; mode sets scoring.
4. Play — map renderer + prompt banner + score/lives/timer HUD.
5. Results — score, best time, missed regions, "practice weak spots".
6. Stats — per-region mastery heat view.

### 5.3 i18n + RTL
- All UI strings and region names come from locale files keyed by id.
- `dir="rtl"` flips chrome for Hebrew; **the SVG map never flips** —
  only the chrome mirrors.
- Region-name translations are data, filled by `add-language` with coverage
  checks.

### 5.4 PWA shell
- Web app manifest (name, icons, standalone) + Vite-generated service
  worker precaching the app shell and the four map data files. Base path
  set for the GitHub Pages subpath.

### 5.5 UI testing
- Component tests for the renderer (tap emits correct id; visual states).
- Smoke test of a full round.
- Accessibility / tap-target checks via chrome-devtools.

## 6. Development-layer skill contracts

Each skill: `.claude/skills/<name>/SKILL.md` + helper scripts. Stages:
acquire → generate → test → quality gate. Each writes an ADR for non-trivial
choices.

### 6.1 add-map
- **Input:** map id + name, source hint, target resolution.
- **Acquire:** fetch open boundaries (world-atlas / us-atlas / Natural
  Earth); choose resolution for size vs. detail.
- **Generate:** simplify, convert to `Region[]`, add i18n name keys,
  register map, precache in service worker.
- **Test:** valid non-empty paths; no duplicate ids; centroids within bbox;
  renders; all regions tappable.
- **Quality gate:** file-size budget; visual spot-check; missing-translation
  report.

### 6.2 add-region
Add/correct individual regions in an existing map; same stages scoped to one
map.

### 6.3 add-game-mode
- **Input:** mode id, loop description.
- **Generate:** scaffold a class implementing `GameMode`; wire into mode
  selection and renderer interaction; add locale strings.
- **Test (TDD):** behavior tests first (prompt, scoring, completion), then
  implement to green.
- **Quality gate:** works under all three scoring strategies and with the
  adaptive scheduler.

### 6.4 add-language
- **Input:** locale code, direction.
- **Acquire:** translations for UI strings and region names from open
  sources (e.g. Wikidata labels per region id); flag gaps rather than invent
  names.
- **Generate:** locale files; register locale; set direction.
- **Test / gate:** coverage report (every key translated); RTL/LTR layout
  check; no untranslated fallbacks in shipped locales.

## 7. Data sources (open)

- **world-atlas** (topojson) — world country boundaries, multiple
  resolutions, ISO numeric ids + names. Source for World, Europe (subset),
  Middle East (subset).
- **us-atlas** (topojson) — US states, FIPS ids + names. Source for US
  states in the North America map.
- **Wikidata** — region-name translations per stable id, for `add-language`.

All bundled locally for offline use; CDN only at build/acquisition time.

## 8. Hosting & deployment

- Static build output deployed to **GitHub Pages** (free). Base path
  configured for the project subpath.
- No back-end. Installable PWA; offline after first load.

## 9. Non-functional requirements

- Runs acceptably on low-end Android browsers (bundle kept small; map data
  lazy-loaded per map; SVG is the main weight).
- Offline-first after initial install.
- Accessible tap targets (minimum touch size), legible at phone sizes.
- Full RTL correctness for Hebrew.

## 10. Testing strategy summary

- Engine: extensive unit tests, TDD.
- UI: renderer component tests + full-round smoke test.
- Dev skills: each has a quality gate that must pass before a change lands.
- Accessibility and visual checks via chrome-devtools.

## 11. Open items for the implementation plan

- Exact level definitions (which regions per level, per map).
- Icon set and PWA manifest specifics.
- Choice of i18n library (react-i18next vs. a minimal custom loader).
- Simplification tolerance per map resolution (size/detail trade-off).

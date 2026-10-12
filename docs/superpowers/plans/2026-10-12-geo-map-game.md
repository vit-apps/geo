# GeoMap Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-only, installable PWA that teaches geography on empty SVG maps, with an adaptive spaced-repetition engine, four preloaded maps, English + Hebrew (RTL), and an in-repo skill layer for future expansion.

**Architecture:** A DOM-free TypeScript game engine (modes, scoring strategies, Leitner scheduler, local-storage persistence) sits beneath a React UI (SVG map renderer + screens + i18n/RTL). Map data is derived at build time from open TopoJSON atlases into a bundled `Region[]` format. Development-layer Claude skills generate maps/modes/languages through an acquire→generate→test→quality-gate workflow.

**Tech Stack:** React 18, Vite 5+, TypeScript 5, Vitest + Testing Library, vite-plugin-pwa 1.x, react-i18next, topojson-client 3, world-atlas 2, us-atlas 3.

**Spec:** `docs/superpowers/specs/2026-10-12-geo-map-game-design.md`

## Global Constraints

- Node ≥ 20 (dev uses Node 26); npm ≥ 10.
- Client-only: no back-end, no network at runtime. All runtime data bundled.
- All persistence via browser `localStorage` behind one wrapper module.
- Engine layer (`src/engine/**`) is DOM-free: no `window`, `document`, or React imports. Enforced by keeping it importable in a Node test with no jsdom.
- All user-facing text and region names come from locale files keyed by id. No hardcoded strings in components.
- Two shipped locales: `en` (ltr) and `he` (rtl). The SVG map never mirrors; only chrome flips with `dir`.
- Stable region ids: ISO 3166-1 numeric (countries), FIPS (US states). Ids are strings.
- Vite `base` must be configurable for GitHub Pages subpath via an env var, defaulting to `/`.
- Commit after every passing step group. Conventional-commit messages.
- **Verification evidence is mandatory for every step.** No step is complete, and no task is marked done, until its validation has run, its output has been captured to a file, and that output has been evaluated against the step's stated **Expected** result. See the Verification Protocol below. A step whose evidence does not match its Expected line is a failure — stop, fix, re-run, re-capture; do not proceed.

## Verification Protocol

Every task writes evidence into `verification/task-NN/` (created by Task 0). The rules:

1. **Capture.** Any step that runs a command captures combined stdout+stderr and the exit code to a log file. Use the helper `scripts/verify.sh` (created in Task 0):
   ```bash
   scripts/verify.sh task-03 step2-types-fail -- npx vitest run src/engine/types.test.ts
   ```
   This runs the command, tees output to `verification/task-03/step2-types-fail.log`, appends a trailer line `EXIT=<code>` and an ISO timestamp, and exits with the command's own code. The `<task-NN>` and `<label>` are free-form; `--` separates them from the command.

2. **Evaluate.** After capturing, compare the log against the step's **Expected** line. For a "verify it fails" step the evidence must show failure (non-zero exit or the named error); for a "verify it passes" step it must show success (`EXIT=0`, tests passed). Record the judgement — do not assume.

3. **Non-command steps** (writing a file, authoring a SKILL.md) are verified by the next command step that exercises them; their evidence is that downstream log. A step that only writes a doc with no downstream command gets a one-line note in the task SUMMARY.

4. **Summarize.** The last step of every task writes `verification/task-NN/SUMMARY.md`: a table of each verified step with its evidence file, the Expected result, the Actual result, and PASS/FAIL. The task is done only when every row is PASS. The SUMMARY is committed with the task.

5. **Evidence is version-controlled.** `verification/` is committed (it is the audit trail), except that large or binary captures (screenshots, traces) are referenced by path and the raw file is kept but may be git-ignored if over 1 MB; note the size in the SUMMARY.

6. **CI re-evaluates.** The deploy workflow (Task 11) runs the same test/build commands; a green CI run is the independent re-evaluation of the local evidence.

**This protocol applies to every task, 1 through 14.** For each task: wrap each `Run:` command with `scripts/verify.sh task-NN <step-label> -- <command>` so its evidence lands in `verification/task-NN/`; after the task's final code step, add a closing step that writes `verification/task-NN/SUMMARY.md` (one row per verified step: step, evidence file, Expected, Actual, PASS/FAIL) and includes `verification/task-NN/` in that task's commit. Where a task below shows a bare `Run:` line, it is shorthand for the wrapped form. A task is not done until its SUMMARY exists and every row is PASS.

## Review Focus

These inputs/conditions the spec implies but that no single feature task naturally exercises. Each has a test added to the owning task.

- **Empty/first-run state** — no saved progress exists; the scheduler and stats screen must work with zero history, not crash on an empty store. (Owned by Task 4, scheduler; Task 6, persistence.)
- **A level set smaller than a round** — a beginner level with 6 regions must still terminate and never ask for a region not in the active set. (Owned by Task 5, session/modes.)
- **Tapping the wrong region repeatedly** — each scoring strategy must handle many consecutive wrong answers without going negative/looping (lives floors at 0; no-fail never ends by mistakes). (Owned by Task 5.)
- **Tiny/overlapping SVG regions on touch** — the renderer must expose a hit area so a region smaller than the minimum tap target is still selectable, and overlapping paths resolve to the topmost intended id. (Owned by Task 9, renderer.)
- **Missing translation key** — a region or UI key absent in the active locale must fall back visibly (to `en` or the key), never render blank or throw. (Owned by Task 8, i18n.)

---

## File Structure

```
geo-game/
  package.json, tsconfig.json, vite.config.ts, index.html
  scripts/
    verify.sh                 # verification evidence capture helper (Task 0)
    build-maps.mjs            # acquire+convert TopoJSON -> Region[] JSON (Task 7)
  verification/               # committed evidence: task-NN/*.log + SUMMARY.md (Task 0+)
    FINAL-REPORT.md           # aggregate pass/fail across all tasks (Task 14)
  public/
    icons/ (pwa icons)
  src/
    main.tsx                  # React entry (Task 1; i18n init added Task 10)
    App.tsx                   # router/screen switch (Task 10)
    engine/
      types.ts                # Region, GameMap, Prompt, AnswerResult, etc (Task 3)
      scheduler.ts            # Leitner spaced repetition (Task 4)
      scoring.ts              # no-fail / lives / timer strategies (Task 5)
      modes/locateMode.ts     # first GameMode (Task 5)
      session.ts              # orchestrates mode+scoring+scheduler (Task 5)
      persistence.ts          # localStorage wrapper + mastery store (Task 6)
    data/
      maps/*.json             # generated region data (Task 7)
      mapIndex.ts             # list of available maps (Task 7)
    ui/
      MapRenderer.tsx         # SVG renderer (Task 9)
      screens/*.tsx           # Home, MapPicker, LevelModePicker, Play, Results, Stats (Task 10)
      hud/*.tsx               # prompt banner, score/lives/timer (Task 10)
    i18n/
      index.ts, en.json, he.json  # (Task 8; en.json region names seeded in Task 7)
  tests/ (co-located *.test.ts(x))
  .claude/skills/
    add-map/SKILL.md + helpers (Task 12)
    add-region/SKILL.md (Task 12)
    add-game-mode/SKILL.md (Task 13)
    add-language/SKILL.md (Task 13)
```

---

### Task 0: Verification harness

**Files:**
- Create: `scripts/verify.sh`, `verification/.gitkeep`, `.gitignore` (append)
- Test: self-check via Step 3.

**Interfaces:**
- Produces (used by every later task): `scripts/verify.sh <task-label> <step-label> -- <command...>` which runs the command, tees combined output to `verification/<task-label>/<step-label>.log`, appends `EXIT=<code>` and a UTC timestamp, and exits with the command's code.

- [ ] **Step 1: Write the verify helper**

`scripts/verify.sh`:
```bash
#!/usr/bin/env bash
# Capture a command's output as verification evidence.
# Usage: scripts/verify.sh <task-label> <step-label> -- <command...>
set -uo pipefail
task="${1:?task-label required}"; shift
step="${1:?step-label required}"; shift
[ "${1:-}" = "--" ] && shift
dir="verification/${task}"
mkdir -p "$dir"
log="${dir}/${step}.log"
{
  echo "# cmd: $*"
  echo "# started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$log"
# run, teeing combined output; preserve the command's exit code
set -o pipefail
"$@" > >(tee -a "$log") 2> >(tee -a "$log" >&2)
code=$?
{
  echo "EXIT=${code}"
  echo "# finished: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "$log"
exit "$code"
```

- [ ] **Step 2: Make it executable and set up the evidence dir**

```bash
mkdir -p verification && touch verification/.gitkeep
chmod +x scripts/verify.sh
printf 'verification/**/*.heapsnapshot\nverification/**/*.png\nverification/**/*.json.gz\n' >> .gitignore
```
(Large/binary captures are ignored but referenced by path in SUMMARY files; text logs are committed.)

- [ ] **Step 3: Self-check the helper**

Run: `scripts/verify.sh task-00 selfcheck -- node -e "console.log('ok')"`
Expected: prints `ok`; creates `verification/task-00/selfcheck.log` whose last content line is `EXIT=0` and which contains `ok`.

Confirm:
```bash
grep -q 'EXIT=0' verification/task-00/selfcheck.log && grep -q '^ok' verification/task-00/selfcheck.log && echo PASS
```
Expected: `PASS`.

- [ ] **Step 4: Write the task SUMMARY and commit**

Create `verification/task-00/SUMMARY.md`:
```markdown
# Task 0 — Verification harness

| Step | Evidence | Expected | Actual | Verdict |
|------|----------|----------|--------|---------|
| 3 self-check | selfcheck.log | prints ok, EXIT=0 | <fill from log> | PASS |
```
Fill `Actual` from the real log before committing.

```bash
git add scripts/verify.sh verification .gitignore
git commit -m "chore: add verification evidence harness (verify.sh + verification/)"
```

---

### Task 1: Project scaffold (Vite + React + TS + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `vitest.config.ts`, `src/setupTests.ts`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Produces: a runnable dev server and a passing test runner. No app interfaces yet.

**Verification:** capture Steps 3 and 4 via `scripts/verify.sh task-01 ...`; close with a `verification/task-01/SUMMARY.md` (table of step → evidence → expected → actual → verdict); do not commit until all rows PASS.

- [ ] **Step 1: Create the project files**

`package.json`:
```json
{
  "name": "geo-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "build:maps": "node scripts/build-maps.mjs"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^15.1.0",
    "i18next": "^23.16.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/d3-geo": "^3.1.0",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "d3-geo": "^3.1.1",
    "jsdom": "^25.0.1",
    "topojson-client": "^3.1.0",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vite-plugin-pwa": "^1.0.0",
    "vitest": "^2.1.2",
    "world-atlas": "^2.0.2",
    "us-atlas": "^3.0.1"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "scripts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'GeoMap Game',
        short_name: 'GeoMap',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e40af',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,json,svg,png}'] }
    })
  ]
})
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    globals: true,
    // engine tests must not depend on jsdom; they still run fine here,
    // but engine code must never import DOM globals (enforced by review).
  }
})
```

`src/setupTests.ts`:
```ts
import '@testing-library/jest-dom'
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>GeoMap Game</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div>GeoMap</div>
}
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 2: Write a smoke test**

`src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 3: Install and run**

Run: `npm install && npm test`
Expected: install succeeds; smoke test PASSES.

- [ ] **Step 4: Verify the build works**

Run: `npm run build`
Expected: build succeeds, `dist/` produced with a service worker file.

- [ ] **Step 5: Create placeholder PWA icons**

Create `public/icons/icon-192.png` and `public/icons/icon-512.png` as any solid-color square PNGs of the right dimensions (replaced later). If no image tool is available, generate them:
```bash
node -e "const fs=require('fs');const z=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');fs.mkdirSync('public/icons',{recursive:true});fs.writeFileSync('public/icons/icon-192.png',z);fs.writeFileSync('public/icons/icon-512.png',z);"
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest + PWA"
```

---

### Task 2: README and project conventions

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: human-facing entry doc. No code interfaces.

- [ ] **Step 1: Write the README**

`README.md` must state: what the app is; how to run (`npm run dev`), test (`npm test`), build (`npm run build`), deploy (GitHub Pages via `BASE_PATH`); where the spec and ADRs live (`docs/`); and the **adopted rule** that maps/regions/modes/languages are added only via the skills in `.claude/skills/` (link ADR 0007). Include a one-paragraph architecture summary (engine/UI split).

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with run/test/build/deploy and skill rule"
```

---

### Task 3: Engine core types

**Files:**
- Create: `src/engine/types.ts`
- Test: `src/engine/types.test.ts`

**Interfaces:**
- Produces (used by Tasks 4–11):
  ```ts
  export interface Region {
    id: string            // ISO numeric or FIPS, as string
    nameKey: string       // i18n key, e.g. "region.528"
    centroid: [number, number]   // [x, y] in the map's svg coordinate space
    bbox: [number, number, number, number] // [minX,minY,maxX,maxY] svg space
    svgPath: string       // SVG path 'd' attribute
    capital?: string      // optional i18n key for capital name
  }
  export interface GameMap {
    id: string            // e.g. "world", "europe", "middle-east", "north-america"
    nameKey: string       // e.g. "map.world"
    viewBox: [number, number, number, number] // svg viewBox
    regions: Region[]
  }
  export type ScoringKind = 'no-fail' | 'lives' | 'timer'
  export interface SessionConfig {
    map: GameMap
    regionIds: string[]   // the active level's region set (subset of map.regions ids)
    scoring: ScoringKind
    livesStart?: number   // required when scoring === 'lives'
  }
  export interface Prompt {
    regionId: string      // the region the player must act on
    nameKey: string       // convenience: that region's nameKey
  }
  export interface AnswerResult {
    correct: boolean
    expectedRegionId: string
    tappedRegionId: string
  }
  export interface ScoreState {
    asked: number
    correct: number
    lives?: number
    elapsedMs?: number
    bestMs?: number
  }
  ```

- [ ] **Step 1: Write the failing test**

`src/engine/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import type { Region, GameMap } from './types'

describe('engine types', () => {
  it('a GameMap holds regions with ids and paths', () => {
    const r: Region = {
      id: '528', nameKey: 'region.528',
      centroid: [10, 20], bbox: [0, 0, 20, 40], svgPath: 'M0 0 L1 1 Z'
    }
    const m: GameMap = {
      id: 'world', nameKey: 'map.world',
      viewBox: [0, 0, 100, 100], regions: [r]
    }
    expect(m.regions[0].id).toBe('528')
    expect(m.regions[0].svgPath.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/types.test.ts`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Create the types file**

Write `src/engine/types.ts` with exactly the interfaces listed under **Interfaces** above.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/types.test.ts
git commit -m "feat(engine): add core types"
```

---

### Task 4: Leitner spaced-repetition scheduler

**Files:**
- Create: `src/engine/scheduler.ts`
- Test: `src/engine/scheduler.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks (pure).
- Produces (used by Task 5, Task 6):
  ```ts
  export interface RegionMastery {
    box: number        // 1..5, higher = better known
    seen: number
    correct: number
    lastSeenMs: number // epoch ms, 0 if never
  }
  export type MasteryStore = Record<string, RegionMastery>
  export function initMastery(): RegionMastery
  // picks the most-due region id among regionIds given current store+now.
  export function pickNextRegion(
    regionIds: string[], store: MasteryStore, nowMs: number
  ): string
  // returns a new mastery for one region after an answer.
  export function updateMastery(
    m: RegionMastery, correct: boolean, nowMs: number
  ): RegionMastery
  ```
  Rules: `initMastery` → box 1, counts 0, lastSeen 0. `updateMastery` correct → box = min(box+1,5); wrong → box = 1; always seen++, correct += correct?1:0, lastSeen = now. `pickNextRegion`: due score = lower box first, then older lastSeen first; never-seen (lastSeen 0) are maximally due. Deterministic for a given input (ties broken by regionIds order).

- [ ] **Step 1: Write the failing tests (including empty/first-run from Review Focus)**

`src/engine/scheduler.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { initMastery, pickNextRegion, updateMastery, type MasteryStore } from './scheduler'

describe('scheduler', () => {
  it('first-run: empty store picks a never-seen region, no crash', () => {
    const store: MasteryStore = {}
    const id = pickNextRegion(['a', 'b', 'c'], store, 1000)
    expect(['a', 'b', 'c']).toContain(id)
  })

  it('promotes on correct and demotes to box 1 on wrong', () => {
    let m = initMastery()
    m = updateMastery(m, true, 10)
    expect(m.box).toBe(2)
    expect(m.correct).toBe(1)
    m = updateMastery(m, false, 20)
    expect(m.box).toBe(1)
    expect(m.seen).toBe(2)
  })

  it('caps box at 5', () => {
    let m = initMastery()
    for (let i = 0; i < 10; i++) m = updateMastery(m, true, i)
    expect(m.box).toBe(5)
  })

  it('prefers a lower-box region over a higher-box one', () => {
    const store: MasteryStore = {
      a: { box: 5, seen: 5, correct: 5, lastSeenMs: 100 },
      b: { box: 1, seen: 1, correct: 0, lastSeenMs: 100 },
    }
    expect(pickNextRegion(['a', 'b'], store, 200)).toBe('b')
  })

  it('among equal boxes prefers the older lastSeen', () => {
    const store: MasteryStore = {
      a: { box: 2, seen: 2, correct: 2, lastSeenMs: 500 },
      b: { box: 2, seen: 2, correct: 2, lastSeenMs: 100 },
    }
    expect(pickNextRegion(['a', 'b'], store, 1000)).toBe('b')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/scheduler.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the scheduler**

`src/engine/scheduler.ts`:
```ts
export interface RegionMastery {
  box: number
  seen: number
  correct: number
  lastSeenMs: number
}
export type MasteryStore = Record<string, RegionMastery>

export function initMastery(): RegionMastery {
  return { box: 1, seen: 0, correct: 0, lastSeenMs: 0 }
}

export function updateMastery(
  m: RegionMastery, correct: boolean, nowMs: number
): RegionMastery {
  return {
    box: correct ? Math.min(m.box + 1, 5) : 1,
    seen: m.seen + 1,
    correct: m.correct + (correct ? 1 : 0),
    lastSeenMs: nowMs,
  }
}

export function pickNextRegion(
  regionIds: string[], store: MasteryStore, _nowMs: number
): string {
  let best = regionIds[0]
  let bestScore = -Infinity
  for (const id of regionIds) {
    const m = store[id] ?? initMastery()
    // higher score = more due. Never-seen (lastSeen 0) wins hardest.
    const neverSeen = m.lastSeenMs === 0 ? 1 : 0
    // lower box -> more due; older lastSeen -> more due.
    const score = neverSeen * 1e15 + (6 - m.box) * 1e12 + (1e12 - m.lastSeenMs)
    if (score > bestScore) { bestScore = score; best = id }
  }
  return best
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/scheduler.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add src/engine/scheduler.ts src/engine/scheduler.test.ts
git commit -m "feat(engine): add Leitner spaced-repetition scheduler"
```

---

### Task 5: Scoring strategies, LocateMode, and Session

**Files:**
- Create: `src/engine/scoring.ts`, `src/engine/modes/locateMode.ts`, `src/engine/session.ts`
- Test: `src/engine/scoring.test.ts`, `src/engine/session.test.ts`

**Interfaces:**
- Consumes: `types.ts` (Task 3), `scheduler.ts` (Task 4).
- Produces (used by Task 10 UI):
  ```ts
  // scoring.ts
  export interface Scorer {
    onAnswer(correct: boolean): void
    isFinished(): boolean
    state(): { lives?: number; asked: number; correct: number }
  }
  export function makeScorer(kind: ScoringKind, opts: { livesStart?: number }): Scorer
  // no-fail: never finished by mistakes. lives: finished when lives<=0 (floors at 0).
  // timer: never finished by mistakes (finish is by running out of regions / clock in UI).

  // session.ts
  export interface Session {
    nextPrompt(): Prompt | null      // null when the level set is exhausted or scorer finished
    submitAnswer(tappedRegionId: string): AnswerResult
    score(): ScoreState
    isComplete(): boolean
    mastery(): MasteryStore          // copy of the in-session per-region mastery (for persistence)
  }
  export function createSession(cfg: SessionConfig, nowFn?: () => number): Session
  ```
  `MasteryStore` is imported from `./scheduler` (Task 4).
  Session uses the scheduler to pick the next region from `cfg.regionIds`, builds a `Prompt`, scores answers via a `Scorer`, updates an in-session `MasteryStore`, and completes when every region in the set has reached box ≥ 3 (mastered) OR the scorer is finished.

- [ ] **Step 1: Write failing scoring tests (covers wrong-answer flooding from Review Focus)**

`src/engine/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { makeScorer } from './scoring'

describe('scoring strategies', () => {
  it('no-fail never finishes on wrong answers', () => {
    const s = makeScorer('no-fail', {})
    for (let i = 0; i < 20; i++) s.onAnswer(false)
    expect(s.isFinished()).toBe(false)
    expect(s.state().asked).toBe(20)
  })

  it('lives finishes at zero and floors there', () => {
    const s = makeScorer('lives', { livesStart: 3 })
    s.onAnswer(false); s.onAnswer(false)
    expect(s.isFinished()).toBe(false)
    expect(s.state().lives).toBe(1)
    s.onAnswer(false)
    expect(s.state().lives).toBe(0)
    expect(s.isFinished()).toBe(true)
    s.onAnswer(false) // extra wrong does not go negative
    expect(s.state().lives).toBe(0)
  })

  it('timer scorer does not finish from mistakes', () => {
    const s = makeScorer('timer', {})
    for (let i = 0; i < 5; i++) s.onAnswer(false)
    expect(s.isFinished()).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/engine/scoring.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement scoring**

`src/engine/scoring.ts`:
```ts
import type { ScoringKind } from './types'

export interface Scorer {
  onAnswer(correct: boolean): void
  isFinished(): boolean
  state(): { lives?: number; asked: number; correct: number }
}

export function makeScorer(kind: ScoringKind, opts: { livesStart?: number }): Scorer {
  let asked = 0, correct = 0
  let lives = kind === 'lives' ? (opts.livesStart ?? 3) : undefined
  return {
    onAnswer(ok: boolean) {
      asked++
      if (ok) correct++
      else if (lives !== undefined) lives = Math.max(0, lives - 1)
    },
    isFinished() {
      return lives !== undefined && lives <= 0
    },
    state() {
      return { lives, asked, correct }
    },
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/engine/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Write failing LocateMode + Session tests (covers small-level-set from Review Focus)**

`src/engine/session.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createSession } from './session'
import type { GameMap, SessionConfig } from './types'

function fakeMap(ids: string[]): GameMap {
  return {
    id: 'test', nameKey: 'map.test', viewBox: [0, 0, 10, 10],
    regions: ids.map((id) => ({
      id, nameKey: `region.${id}`, centroid: [1, 1],
      bbox: [0, 0, 2, 2], svgPath: 'M0 0 L1 1 Z',
    })),
  }
}

describe('session with LocateMode', () => {
  it('never prompts a region outside the active set', () => {
    const map = fakeMap(['a', 'b', 'c', 'd', 'e', 'f'])
    const cfg: SessionConfig = { map, regionIds: ['a', 'b'], scoring: 'no-fail' }
    let now = 0
    const s = createSession(cfg, () => (now += 1000))
    for (let i = 0; i < 10 && !s.isComplete(); i++) {
      const p = s.nextPrompt()
      if (!p) break
      expect(['a', 'b']).toContain(p.regionId)
      s.submitAnswer(p.regionId) // always correct
    }
    expect(s.score().asked).toBeGreaterThan(0)
  })

  it('a correct answer matches the prompt region; wrong one does not', () => {
    const map = fakeMap(['a', 'b'])
    const s = createSession({ map, regionIds: ['a', 'b'], scoring: 'no-fail' }, () => Date.now())
    const p = s.nextPrompt()!
    const other = p.regionId === 'a' ? 'b' : 'a'
    const r = s.submitAnswer(other)
    expect(r.correct).toBe(false)
    expect(r.expectedRegionId).toBe(p.regionId)
  })

  it('mastering the whole small set completes the session', () => {
    const map = fakeMap(['a', 'b'])
    let now = 0
    const s = createSession({ map, regionIds: ['a', 'b'], scoring: 'no-fail' }, () => (now += 1000))
    let guard = 0
    while (!s.isComplete() && guard++ < 100) {
      const p = s.nextPrompt()
      if (!p) break
      s.submitAnswer(p.regionId) // all correct -> boxes climb
    }
    expect(s.isComplete()).toBe(true)
    // mastery() exposes the per-region store for persistence
    const m = s.mastery()
    expect(m['a'].box).toBeGreaterThanOrEqual(3)
    expect(m['b'].box).toBeGreaterThanOrEqual(3)
  })
})
```

- [ ] **Step 6: Run to verify fail**

Run: `npx vitest run src/engine/session.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 7: Implement LocateMode and Session**

`src/engine/modes/locateMode.ts`:
```ts
import type { GameMap, Prompt, AnswerResult } from '../types'

// LocateMode: the prompt names a region; the player taps a region.
export function makeLocatePrompt(map: GameMap, regionId: string): Prompt {
  const region = map.regions.find((r) => r.id === regionId)!
  return { regionId, nameKey: region.nameKey }
}

export function judge(expectedRegionId: string, tappedRegionId: string): AnswerResult {
  return {
    correct: expectedRegionId === tappedRegionId,
    expectedRegionId,
    tappedRegionId,
  }
}
```

`src/engine/session.ts`:
```ts
import type { Prompt, AnswerResult, ScoreState, SessionConfig } from './types'
import { makeScorer, type Scorer } from './scoring'
import { makeLocatePrompt, judge } from './modes/locateMode'
import {
  initMastery, pickNextRegion, updateMastery, type MasteryStore,
} from './scheduler'

export interface Session {
  nextPrompt(): Prompt | null
  submitAnswer(tappedRegionId: string): AnswerResult
  score(): ScoreState
  isComplete(): boolean
  mastery(): MasteryStore
}

const MASTERED_BOX = 3

export function createSession(cfg: SessionConfig, nowFn: () => number = Date.now): Session {
  const store: MasteryStore = {}
  for (const id of cfg.regionIds) store[id] = initMastery()
  const scorer: Scorer = makeScorer(cfg.scoring, { livesStart: cfg.livesStart })
  const startedAt = nowFn()
  let current: Prompt | null = null

  function allMastered(): boolean {
    return cfg.regionIds.every((id) => store[id].box >= MASTERED_BOX)
  }

  function isComplete(): boolean {
    return scorer.isFinished() || allMastered()
  }

  return {
    nextPrompt() {
      if (isComplete()) return null
      const id = pickNextRegion(cfg.regionIds, store, nowFn())
      current = makeLocatePrompt(cfg.map, id)
      return current
    },
    submitAnswer(tappedRegionId: string): AnswerResult {
      const expected = current!.regionId
      const result = judge(expected, tappedRegionId)
      store[expected] = updateMastery(store[expected], result.correct, nowFn())
      scorer.onAnswer(result.correct)
      return result
    },
    score(): ScoreState {
      const st = scorer.state()
      return {
        asked: st.asked, correct: st.correct, lives: st.lives,
        elapsedMs: nowFn() - startedAt,
      }
    },
    isComplete,
    mastery() { return { ...store } },
  }
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npx vitest run src/engine/session.test.ts src/engine/scoring.test.ts`
Expected: PASS (all).

- [ ] **Step 9: Commit**

```bash
git add src/engine/scoring.ts src/engine/modes src/engine/session.ts src/engine/scoring.test.ts src/engine/session.test.ts
git commit -m "feat(engine): add scoring strategies, LocateMode, and session"
```

---

### Task 6: Persistence (localStorage mastery store + best times)

**Files:**
- Create: `src/engine/persistence.ts`
- Test: `src/engine/persistence.test.ts`

**Interfaces:**
- Consumes: `scheduler.ts` types (Task 4).
- Produces (used by Task 10):
  ```ts
  export interface SettingsState { locale: string; lastMapId?: string }
  export function loadMastery(mapId: string): MasteryStore
  export function saveMastery(mapId: string, store: MasteryStore): void
  export function mergeSessionMastery(mapId: string, session: MasteryStore): MasteryStore
  export function loadBestMs(mapId: string, levelId: string): number | undefined
  export function saveBestMs(mapId: string, levelId: string, ms: number): void
  export function loadSettings(): SettingsState
  export function saveSettings(s: SettingsState): void
  ```
  Uses an injectable storage (defaults to `localStorage`) so tests pass a fake. Keys namespaced `geo:mastery:<mapId>`, `geo:best:<mapId>:<levelId>`, `geo:settings`. All reads tolerate missing/corrupt JSON by returning defaults.

- [ ] **Step 1: Write failing tests (covers empty/first-run + corrupt data from Review Focus)**

`src/engine/persistence.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadMastery, saveMastery, loadBestMs, saveBestMs,
  loadSettings, saveSettings, __setStorage,
} from './persistence'

class FakeStorage {
  m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
}

beforeEach(() => __setStorage(new FakeStorage() as unknown as Storage))

describe('persistence', () => {
  it('first-run mastery load returns empty object, no throw', () => {
    expect(loadMastery('world')).toEqual({})
  })

  it('round-trips mastery', () => {
    saveMastery('world', { '528': { box: 2, seen: 3, correct: 2, lastSeenMs: 9 } })
    expect(loadMastery('world')['528'].box).toBe(2)
  })

  it('corrupt JSON falls back to empty, no throw', () => {
    const bad = new FakeStorage()
    bad.setItem('geo:mastery:world', '{not json')
    __setStorage(bad as unknown as Storage)
    expect(loadMastery('world')).toEqual({})
  })

  it('best time is undefined first, then stored', () => {
    expect(loadBestMs('world', 'beginner')).toBeUndefined()
    saveBestMs('world', 'beginner', 12345)
    expect(loadBestMs('world', 'beginner')).toBe(12345)
  })

  it('settings default then persist', () => {
    expect(loadSettings().locale).toBeDefined()
    saveSettings({ locale: 'he', lastMapId: 'europe' })
    expect(loadSettings().locale).toBe('he')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/engine/persistence.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement persistence**

`src/engine/persistence.ts`:
```ts
import { initMastery, updateMastery, type MasteryStore } from './scheduler'

let storage: Storage =
  typeof localStorage !== 'undefined' ? localStorage : (undefined as unknown as Storage)

export function __setStorage(s: Storage) { storage = s }

export interface SettingsState { locale: string; lastMapId?: string }

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadMastery(mapId: string): MasteryStore {
  return readJSON<MasteryStore>(`geo:mastery:${mapId}`, {})
}
export function saveMastery(mapId: string, store: MasteryStore): void {
  storage.setItem(`geo:mastery:${mapId}`, JSON.stringify(store))
}
export function mergeSessionMastery(mapId: string, session: MasteryStore): MasteryStore {
  const base = loadMastery(mapId)
  for (const [id, sm] of Object.entries(session)) {
    const cur = base[id] ?? initMastery()
    // fold session's seen/correct into stored history, keep best box.
    base[id] = {
      box: Math.max(cur.box, sm.box),
      seen: cur.seen + sm.seen,
      correct: cur.correct + sm.correct,
      lastSeenMs: Math.max(cur.lastSeenMs, sm.lastSeenMs),
    }
  }
  saveMastery(mapId, base)
  return base
}
export function loadBestMs(mapId: string, levelId: string): number | undefined {
  return readJSON<number | undefined>(`geo:best:${mapId}:${levelId}`, undefined)
}
export function saveBestMs(mapId: string, levelId: string, ms: number): void {
  const cur = loadBestMs(mapId, levelId)
  if (cur === undefined || ms < cur) {
    storage.setItem(`geo:best:${mapId}:${levelId}`, JSON.stringify(ms))
  }
}
export function loadSettings(): SettingsState {
  return readJSON<SettingsState>('geo:settings', { locale: 'en' })
}
export function saveSettings(s: SettingsState): void {
  storage.setItem('geo:settings', JSON.stringify(s))
}

// re-export so callers get the type without importing scheduler directly
export type { MasteryStore }
export { updateMastery }
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/engine/persistence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/persistence.ts src/engine/persistence.test.ts
git commit -m "feat(engine): add localStorage persistence for mastery/best/settings"
```

---

### Task 7: Map build script + generated data + map index + levels

**Files:**
- Create: `scripts/build-maps.mjs`, `src/data/mapIndex.ts`, `src/data/levels.ts`
- Generated: `src/data/maps/world.json`, `europe.json`, `middle-east.json`, `north-america.json`
- Test: `scripts/build-maps.test.mjs` (via vitest), `src/data/mapIndex.test.ts`

**Interfaces:**
- Consumes: `types.ts` (Task 3) for the output shape (`GameMap`).
- Produces (used by Task 10):
  ```ts
  // mapIndex.ts
  import type { GameMap } from '../engine/types'
  export const MAP_IDS = ['world', 'europe', 'middle-east', 'north-america'] as const
  export type MapId = typeof MAP_IDS[number]
  export function loadMap(id: MapId): Promise<GameMap>  // dynamic import of the json
  // levels.ts
  export interface Level { id: string; nameKey: string; regionIds: (map: GameMap) => string[] }
  export function levelsFor(id: MapId): Level[]
  ```
  Each generated JSON matches `GameMap`. The build script converts TopoJSON → SVG paths with `topojson-client` (`feature` + a projection to a fixed viewBox), computing centroid and bbox per region. Region ids are the atlas ids as strings; `nameKey` is `region.<id>`; region English names are written into `src/i18n/en.json` by this script (Task 11 consumes/extends).

- [ ] **Step 1: Write the build script**

`scripts/build-maps.mjs`:
```js
// Converts bundled TopoJSON atlases into GameMap JSON files.
// Run: npm run build:maps
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { feature } from 'topojson-client'
import { geoMercator, geoPath, geoAlbersUsa, geoBounds } from 'd3-geo'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'src/data/maps')
mkdirSync(outDir, { recursive: true })

const VIEW = [0, 0, 1000, 650] // fixed svg viewBox for all maps

function loadTopo(pkgRelPath) {
  const p = join(root, 'node_modules', pkgRelPath)
  return JSON.parse(readFileSync(p, 'utf8'))
}

// Middle East / Europe subsets by ISO numeric id.
const EUROPE_IDS = new Set(['250','276','380','724','826','620','528','056','040','752','578','246','208','756','616','203','642','300','348','688','705','191','070','100','440','428','233','372','352','492','020','674','470','807','499','688'])
const MIDDLE_EAST_IDS = new Set(['376','400','422','414','512','634','682','784','887','760','792','368','364','275','048','368'])

function buildFromCountries(topo, filterSet) {
  const fc = feature(topo, topo.objects.countries)
  const feats = filterSet
    ? fc.features.filter((f) => filterSet.has(String(f.id)))
    : fc.features
  const projection = geoMercator().fitExtent(
    [[VIEW[0], VIEW[1]], [VIEW[2], VIEW[3]]],
    { type: 'FeatureCollection', features: feats }
  )
  const path = geoPath(projection)
  const regions = feats.map((f) => {
    const id = String(f.id)
    const d = path(f) || ''
    const b = path.bounds(f) // [[x0,y0],[x1,y1]]
    const c = path.centroid(f)
    return {
      id, nameKey: `region.${id}`,
      svgPath: d,
      bbox: [b[0][0], b[0][1], b[1][0], b[1][1]],
      centroid: [c[0], c[1]],
      _name: f.properties.name,
    }
  }).filter((r) => r.svgPath.length > 0)
  return regions
}

function buildStates(topo) {
  const fc = feature(topo, topo.objects.states)
  const projection = geoAlbersUsa().fitExtent(
    [[VIEW[0], VIEW[1]], [VIEW[2], VIEW[3]]], fc
  )
  const path = geoPath(projection)
  return fc.features.map((f) => {
    const id = String(f.id)
    const d = path(f) || ''
    const b = path.bounds(f)
    const c = path.centroid(f)
    return {
      id, nameKey: `region.us-${id}`, svgPath: d,
      bbox: [b[0][0], b[0][1], b[1][0], b[1][1]],
      centroid: [c[0], c[1]], _name: f.properties.name,
    }
  }).filter((r) => r.svgPath.length > 0)
}

function writeMap(id, nameKey, regions) {
  const names = {}
  const clean = regions.map((r) => {
    names[r.nameKey] = r._name
    const { _name, ...rest } = r
    return rest
  })
  const map = { id, nameKey, viewBox: VIEW, regions: clean }
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify(map))
  return names
}

const world = loadTopo('world-atlas/countries-110m.json')
const us = loadTopo('us-atlas/states-10m.json')

let allNames = {}
allNames = { ...allNames, ...writeMap('world', 'map.world', buildFromCountries(world, null)) }
allNames = { ...allNames, ...writeMap('europe', 'map.europe', buildFromCountries(world, EUROPE_IDS)) }
allNames = { ...allNames, ...writeMap('middle-east', 'map.middle-east', buildFromCountries(world, MIDDLE_EAST_IDS)) }
allNames = { ...allNames, ...writeMap('north-america', 'map.north-america', buildStates(us)) }

// write region English names into i18n/en.json (merge, don't clobber ui keys)
const enPath = join(root, 'src/i18n/en.json')
let en = {}
try { en = JSON.parse(readFileSync(enPath, 'utf8')) } catch {}
en = { ...en, ...allNames }
mkdirSync(dirname(enPath), { recursive: true })
writeFileSync(enPath, JSON.stringify(en, null, 2))
console.log('maps built:', Object.keys(allNames).length, 'region names')
```

- [ ] **Step 2: Run the map build**

`d3-geo` and its types are already declared in Task 1's `package.json`.
Run: `npm run build:maps`
Expected: four JSON files appear in `src/data/maps/`, `src/i18n/en.json` gets region names, console prints a count > 150.

- [ ] **Step 3: Write a validation test over generated data (covers map integrity)**

`src/data/mapIndex.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { MAP_IDS, loadMap } from './mapIndex'

describe('generated maps', () => {
  it.each(MAP_IDS)('%s has valid regions', async (id) => {
    const map = await loadMap(id)
    expect(map.regions.length).toBeGreaterThan(0)
    const ids = new Set<string>()
    for (const r of map.regions) {
      expect(r.svgPath.length).toBeGreaterThan(0)   // non-empty path
      expect(ids.has(r.id)).toBe(false)             // no duplicate ids
      ids.add(r.id)
      // centroid within bbox (tolerant)
      expect(r.centroid[0]).toBeGreaterThanOrEqual(r.bbox[0] - 1)
      expect(r.centroid[0]).toBeLessThanOrEqual(r.bbox[2] + 1)
    }
  })
})
```

- [ ] **Step 4: Implement the map index and levels**

`src/data/mapIndex.ts`:
```ts
import type { GameMap } from '../engine/types'
export const MAP_IDS = ['world', 'europe', 'middle-east', 'north-america'] as const
export type MapId = typeof MAP_IDS[number]

export async function loadMap(id: MapId): Promise<GameMap> {
  const mod = await import(`./maps/${id}.json`)
  return (mod.default ?? mod) as GameMap
}
```

`src/data/levels.ts`:
```ts
import type { GameMap } from '../engine/types'
import type { MapId } from './mapIndex'

export interface Level {
  id: string
  nameKey: string
  regionIds: (map: GameMap) => string[]
}

// Beginner: the N largest regions by bbox area. Expert: all regions.
function largestN(map: GameMap, n: number): string[] {
  return [...map.regions]
    .map((r) => ({ id: r.id, area: (r.bbox[2] - r.bbox[0]) * (r.bbox[3] - r.bbox[1]) }))
    .sort((a, b) => b.area - a.area)
    .slice(0, n)
    .map((x) => x.id)
}

const COMMON: Level[] = [
  { id: 'beginner', nameKey: 'level.beginner', regionIds: (m) => largestN(m, 6) },
  { id: 'intermediate', nameKey: 'level.intermediate', regionIds: (m) => largestN(m, Math.min(20, m.regions.length)) },
  { id: 'expert', nameKey: 'level.expert', regionIds: (m) => m.regions.map((r) => r.id) },
]

export function levelsFor(_id: MapId): Level[] {
  return COMMON
}
```

- [ ] **Step 5: Run data tests**

Run: `npx vitest run src/data/mapIndex.test.ts`
Expected: PASS for all four maps.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-maps.mjs src/data src/i18n/en.json
git commit -m "feat(data): build maps from TopoJSON atlases; add map index and levels"
```

---

### Task 8: i18n setup (en + he, RTL, fallback)

**Files:**
- Create: `src/i18n/index.ts`, `src/i18n/he.json` (en.json already seeded by Task 7; add UI keys to both)
- Test: `src/i18n/i18n.test.ts`

**Interfaces:**
- Produces (used by Task 10):
  ```ts
  export function initI18n(locale: string): Promise<void>
  export function t(key: string): string           // thin wrapper for non-component use
  export function dirFor(locale: string): 'ltr' | 'rtl'
  export const SUPPORTED = ['en', 'he'] as const
  ```
  Missing keys fall back to `en`, then to the key string itself. `dirFor('he') === 'rtl'`.

- [ ] **Step 1: Add UI keys to en.json and create he.json**

Add these keys to `src/i18n/en.json` (merge with region names already there):
```json
{
  "app.title": "GeoMap Game",
  "map.world": "World", "map.europe": "Europe",
  "map.middle-east": "Middle East", "map.north-america": "North America",
  "level.beginner": "Beginner", "level.intermediate": "Intermediate", "level.expert": "Expert",
  "mode.no-fail": "Learn", "mode.lives": "Challenge", "mode.timer": "Time trial",
  "play.findPrompt": "Where is {{name}}?",
  "play.correct": "Correct!", "play.wrong": "That was {{name}}",
  "results.title": "Results", "results.accuracy": "Accuracy",
  "results.best": "Best time", "results.practiceWeak": "Practice weak spots",
  "stats.title": "Your progress", "common.continue": "Continue",
  "common.back": "Back", "common.start": "Start", "settings.language": "Language"
}
```
Create `src/i18n/he.json` with Hebrew translations for the same UI keys (region names may stay partially English; untranslated keys fall back). Example subset:
```json
{
  "app.title": "משחק מפות", "map.world": "עולם", "map.europe": "אירופה",
  "map.middle-east": "המזרח התיכון", "map.north-america": "צפון אמריקה",
  "level.beginner": "מתחילים", "level.intermediate": "בינוני", "level.expert": "מומחה",
  "mode.no-fail": "לימוד", "mode.lives": "אתגר", "mode.timer": "מרוץ נגד השעון",
  "play.findPrompt": "איפה {{name}}?",
  "play.correct": "נכון!", "play.wrong": "זה היה {{name}}",
  "results.title": "תוצאות", "results.accuracy": "דיוק", "results.best": "זמן שיא",
  "results.practiceWeak": "תרגול נקודות חולשה", "stats.title": "ההתקדמות שלך",
  "common.continue": "המשך", "common.back": "חזרה", "common.start": "התחל",
  "settings.language": "שפה"
}
```

- [ ] **Step 2: Write failing i18n tests (covers missing-key fallback from Review Focus)**

`src/i18n/i18n.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { initI18n, t, dirFor } from './index'

beforeAll(async () => { await initI18n('en') })

describe('i18n', () => {
  it('resolves a known key', () => {
    expect(t('map.world')).toBe('World')
  })
  it('missing key falls back to the key string, never blank/throw', () => {
    expect(t('totally.missing.key')).toBe('totally.missing.key')
  })
  it('direction is rtl for he and ltr for en', () => {
    expect(dirFor('he')).toBe('rtl')
    expect(dirFor('en')).toBe('ltr')
  })
})
```

- [ ] **Step 3: Run to verify fail**

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement i18n**

`src/i18n/index.ts`:
```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import he from './he.json'

export const SUPPORTED = ['en', 'he'] as const
export function dirFor(locale: string): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr'
}

export async function initI18n(locale: string): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, he: { translation: he } },
    lng: locale,
    fallbackLng: 'en',
    returnNull: false,
    parseMissingKeyHandler: (key) => key, // show the key, never blank
    interpolation: { escapeValue: false },
  })
}
export function t(key: string, opts?: Record<string, unknown>): string {
  return i18n.t(key, opts)
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/i18n/i18n.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/i18n
git commit -m "feat(i18n): add en+he with rtl direction and missing-key fallback"
```

---

### Task 9: SVG map renderer

**Files:**
- Create: `src/ui/MapRenderer.tsx`
- Test: `src/ui/MapRenderer.test.tsx`

**Interfaces:**
- Consumes: `GameMap`, `Region` (Task 3).
- Produces (used by Task 10):
  ```tsx
  export type RegionVisual = 'idle' | 'highlighted' | 'correct' | 'wrong' | 'revealed'
  export interface MapRendererProps {
    map: GameMap
    visuals?: Record<string, RegionVisual>   // regionId -> state
    onRegionTap?: (regionId: string) => void
    activeIds?: string[]  // if set, only these are interactive; others dimmed
  }
  export function MapRenderer(props: MapRendererProps): JSX.Element
  ```
  Each region renders as a `<path>` with `data-region-id`, a CSS class per visual state, and an overlaid transparent wider-stroke hit path so tiny regions are tappable. Tapping calls `onRegionTap(id)`.

- [ ] **Step 1: Write failing renderer tests (covers tiny/overlapping tap from Review Focus)**

`src/ui/MapRenderer.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapRenderer } from './MapRenderer'
import type { GameMap } from '../engine/types'

const map: GameMap = {
  id: 't', nameKey: 'map.t', viewBox: [0, 0, 100, 100],
  regions: [
    { id: 'a', nameKey: 'region.a', centroid: [10, 10], bbox: [0, 0, 20, 20], svgPath: 'M0 0 L20 0 L20 20 Z' },
    { id: 'tiny', nameKey: 'region.tiny', centroid: [50, 50], bbox: [49, 49, 51, 51], svgPath: 'M49 49 L51 49 L51 51 Z' },
  ],
}

describe('MapRenderer', () => {
  it('renders one path per region keyed by id', () => {
    render(<MapRenderer map={map} />)
    expect(document.querySelector('[data-region-id="a"]')).toBeTruthy()
    expect(document.querySelector('[data-region-id="tiny"]')).toBeTruthy()
  })

  it('tapping a region (incl. a tiny one) emits its id via the hit area', () => {
    const onTap = vi.fn()
    render(<MapRenderer map={map} onRegionTap={onTap} />)
    const hit = document.querySelector('[data-hit-id="tiny"]')!
    fireEvent.click(hit)
    expect(onTap).toHaveBeenCalledWith('tiny')
  })

  it('applies the visual-state class from props', () => {
    render(<MapRenderer map={map} visuals={{ a: 'correct' }} />)
    const el = document.querySelector('[data-region-id="a"]')!
    expect(el.getAttribute('class')).toContain('correct')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/ui/MapRenderer.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the renderer**

`src/ui/MapRenderer.tsx`:
```tsx
import type { GameMap } from '../engine/types'

export type RegionVisual = 'idle' | 'highlighted' | 'correct' | 'wrong' | 'revealed'
export interface MapRendererProps {
  map: GameMap
  visuals?: Record<string, RegionVisual>
  onRegionTap?: (regionId: string) => void
  activeIds?: string[]
}

export function MapRenderer({ map, visuals, onRegionTap, activeIds }: MapRendererProps) {
  const activeSet = activeIds ? new Set(activeIds) : null
  return (
    <svg
      viewBox={map.viewBox.join(' ')}
      className="map-renderer"
      role="img"
      style={{ width: '100%', height: '100%', touchAction: 'manipulation' }}
    >
      {map.regions.map((r) => {
        const state = visuals?.[r.id] ?? 'idle'
        const dim = activeSet && !activeSet.has(r.id) ? ' dim' : ''
        const tap = () => onRegionTap?.(r.id)
        return (
          <g key={r.id}>
            {/* visible shape */}
            <path d={r.svgPath} data-region-id={r.id} className={`region ${state}${dim}`} />
            {/* transparent wide-stroke hit area so tiny regions are tappable */}
            <path
              d={r.svgPath}
              data-hit-id={r.id}
              className="region-hit"
              onClick={tap}
              fill="transparent"
              stroke="transparent"
              strokeWidth={8}
              pointerEvents="all"
            />
          </g>
        )
      })}
    </svg>
  )
}
```

Add minimal CSS in `src/ui/map.css` (imported by the renderer) with classes `.region`, `.region.highlighted`, `.region.correct`, `.region.wrong`, `.region.revealed`, `.region.dim`, and import it at the top of `MapRenderer.tsx` with `import './map.css'`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/ui/MapRenderer.test.tsx`
Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add src/ui/MapRenderer.tsx src/ui/map.css src/ui/MapRenderer.test.tsx
git commit -m "feat(ui): add SVG map renderer with tap hit-areas and visual states"
```

---

### Task 10: Screens, HUD, and app wiring

**Files:**
- Create: `src/ui/screens/Home.tsx`, `MapPicker.tsx`, `LevelModePicker.tsx`, `Play.tsx`, `Results.tsx`, `Stats.tsx`; `src/ui/hud/PromptBanner.tsx`, `ScoreHud.tsx`; rewrite `src/App.tsx`, `src/main.tsx`
- Test: `src/ui/screens/Play.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `loadMap`/`MAP_IDS` (Task 7), `levelsFor` (Task 7), `createSession` (Task 5), persistence (Task 6), i18n (Task 8), `MapRenderer` (Task 9).
- Produces: the full navigable app. App holds a simple screen-state machine (`'home'|'map'|'level'|'play'|'results'|'stats'`) in React state; no router library.

- [ ] **Step 1: Write a failing Play integration test**

`src/ui/screens/Play.test.tsx`:
```tsx
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Play } from './Play'
import { initI18n } from '../../i18n'
import type { GameMap } from '../../engine/types'

const map: GameMap = {
  id: 't', nameKey: 'map.t', viewBox: [0, 0, 100, 100],
  regions: [
    { id: 'a', nameKey: 'map.world', centroid: [10, 10], bbox: [0, 0, 20, 20], svgPath: 'M0 0 L20 0 L20 20 Z' },
    { id: 'b', nameKey: 'map.europe', centroid: [80, 80], bbox: [60, 60, 100, 100], svgPath: 'M60 60 L100 60 L100 100 Z' },
  ],
}

beforeAll(async () => { await initI18n('en') })

describe('Play screen', () => {
  it('shows a prompt and reacts to a tap', () => {
    render(<Play map={map} level={{ id: 'beginner', nameKey: 'level.beginner', regionIds: () => ['a', 'b'] }} scoring="no-fail" onExit={() => {}} />)
    // a prompt banner is shown
    expect(screen.getByTestId('prompt-banner').textContent).toBeTruthy()
    // tapping some region does not crash and advances asked count via HUD
    const hit = document.querySelector('[data-hit-id="a"]')!
    fireEvent.click(hit)
    expect(screen.getByTestId('score-hud').textContent).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/ui/screens/Play.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement HUD components**

`src/ui/hud/PromptBanner.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
export function PromptBanner({ nameKey }: { nameKey: string }) {
  const { t } = useTranslation()
  return <div data-testid="prompt-banner" className="prompt-banner">
    {t('play.findPrompt', { name: t(nameKey) })}
  </div>
}
```

`src/ui/hud/ScoreHud.tsx`:
```tsx
import type { ScoreState } from '../../engine/types'
export function ScoreHud({ score }: { score: ScoreState }) {
  return <div data-testid="score-hud" className="score-hud">
    <span>{score.correct}/{score.asked}</span>
    {score.lives !== undefined && <span> ❤ {score.lives}</span>}
  </div>
}
```

- [ ] **Step 4: Implement the Play screen**

`src/ui/screens/Play.tsx`:
```tsx
import { useMemo, useRef, useState } from 'react'
import type { GameMap, ScoringKind, Prompt, ScoreState } from '../../engine/types'
import type { MasteryStore } from '../../engine/scheduler'
import type { Level } from '../../data/levels'
import { createSession, type Session } from '../../engine/session'
import { MapRenderer, type RegionVisual } from '../MapRenderer'
import { PromptBanner } from '../hud/PromptBanner'
import { ScoreHud } from '../hud/ScoreHud'

export interface PlayProps {
  map: GameMap
  level: Level
  scoring: ScoringKind
  onExit: (score: ScoreState, mastery: MasteryStore) => void
}

export function Play({ map, level, scoring, onExit }: PlayProps) {
  const regionIds = useMemo(() => level.regionIds(map), [map, level])
  const sessionRef = useRef<Session | null>(null)
  if (sessionRef.current === null) {
    sessionRef.current = createSession({
      map, regionIds, scoring, livesStart: scoring === 'lives' ? 3 : undefined,
    })
  }
  const session = sessionRef.current
  const [prompt, setPrompt] = useState<Prompt | null>(() => session.nextPrompt())
  const [visuals, setVisuals] = useState<Record<string, RegionVisual>>({})
  const [score, setScore] = useState<ScoreState>(() => session.score())

  function handleTap(regionId: string) {
    if (!prompt) return
    const result = session.submitAnswer(regionId)
    const next: Record<string, RegionVisual> = {}
    if (result.correct) next[regionId] = 'correct'
    else { next[regionId] = 'wrong'; next[result.expectedRegionId] = 'revealed' }
    setVisuals(next)
    setScore(session.score())
    setTimeout(() => {
      setVisuals({})
      if (session.isComplete()) { onExit(session.score(), session.mastery()); return }
      setPrompt(session.nextPrompt())
    }, 650)
  }

  return (
    <div className="play-screen">
      {prompt && <PromptBanner nameKey={prompt.nameKey} />}
      <ScoreHud score={score} />
      <div className="map-wrap">
        <MapRenderer map={map} visuals={visuals} activeIds={regionIds} onRegionTap={handleTap} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run Play test to verify pass**

Run: `npx vitest run src/ui/screens/Play.test.tsx`
Expected: PASS.

- [ ] **Step 6: Implement remaining screens + App wiring**

`src/ui/screens/Home.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
export interface HomeProps {
  onChooseMap: () => void
  onStats: () => void
  onToggleLocale: () => void
  locale: string
}
export function Home({ onChooseMap, onStats, onToggleLocale, locale }: HomeProps) {
  const { t } = useTranslation()
  return (
    <div className="home-screen">
      <h1>{t('app.title')}</h1>
      <button data-testid="nav-map" onClick={onChooseMap}>{t('common.start')}</button>
      <button data-testid="nav-stats" onClick={onStats}>{t('stats.title')}</button>
      <button data-testid="toggle-locale" onClick={onToggleLocale}>
        {t('settings.language')}: {locale}
      </button>
    </div>
  )
}
```

`src/ui/screens/MapPicker.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
import { MAP_IDS, type MapId } from '../../data/mapIndex'
export interface MapPickerProps {
  onPick: (id: MapId) => void
  onBack: () => void
}
export function MapPicker({ onPick, onBack }: MapPickerProps) {
  const { t } = useTranslation()
  return (
    <div className="map-picker" data-testid="map-picker">
      <button onClick={onBack}>{t('common.back')}</button>
      <div className="map-grid">
        {MAP_IDS.map((id) => (
          <button key={id} data-testid={`map-${id}`} onClick={() => onPick(id)}>
            {t(`map.${id}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
```

`src/ui/screens/LevelModePicker.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
import type { ScoringKind } from '../../engine/types'
import type { Level } from '../../data/levels'

const SCORING: ScoringKind[] = ['no-fail', 'lives', 'timer']
export interface LevelModePickerProps {
  levels: Level[]
  onStart: (level: Level, scoring: ScoringKind) => void
  onBack: () => void
}
export function LevelModePicker({ levels, onStart, onBack }: LevelModePickerProps) {
  const { t } = useTranslation()
  return (
    <div className="level-mode-picker" data-testid="level-mode-picker">
      <button onClick={onBack}>{t('common.back')}</button>
      {levels.map((lv) => (
        <div key={lv.id} className="level-row">
          <span>{t(lv.nameKey)}</span>
          {SCORING.map((sc) => (
            <button key={sc} onClick={() => onStart(lv, sc)}>{t(`mode.${sc}`)}</button>
          ))}
        </div>
      ))}
    </div>
  )
}
```

`src/ui/screens/Results.tsx`:
```tsx
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameMap, ScoreState } from '../../engine/types'
import type { Level } from '../../data/levels'
import { loadBestMs, saveBestMs } from '../../engine/persistence'

export interface ResultsProps {
  map: GameMap
  level: Level
  score: ScoreState
  onHome: () => void
}
export function Results({ map, level, score, onHome }: ResultsProps) {
  const { t } = useTranslation()
  useEffect(() => {
    if (score.elapsedMs !== undefined) saveBestMs(map.id, level.id, score.elapsedMs)
  }, [map.id, level.id, score.elapsedMs])
  const best = loadBestMs(map.id, level.id)
  const accuracy = score.asked > 0 ? Math.round((score.correct / score.asked) * 100) : 0
  return (
    <div className="results-screen" data-testid="results-screen">
      <h2>{t('results.title')}</h2>
      <div>{t('results.accuracy')}: {accuracy}%</div>
      {best !== undefined && <div>{t('results.best')}: {Math.round(best / 1000)}s</div>}
      <button onClick={onHome}>{t('common.continue')}</button>
    </div>
  )
}
```
Note: mastery is folded into storage by the Play screen's `onExit` handler in `App.tsx` (Step 6 wiring), which calls `mergeSessionMastery` with the session's final store before navigating to Results. (The session exposes its final mastery via `score()`; if a dedicated getter is needed, add `mastery(): MasteryStore` to the `Session` interface in Task 5 and return a copy of `store` — update both the interface block and the test accordingly.)

`src/ui/screens/Stats.tsx`:
```tsx
import { useTranslation } from 'react-i18next'
import type { MapId } from '../../data/mapIndex'
import { loadMastery } from '../../engine/persistence'

export interface StatsProps { mapId: MapId; onBack: () => void }
export function Stats({ mapId, onBack }: StatsProps) {
  const { t } = useTranslation()
  const store = loadMastery(mapId)
  const entries = Object.entries(store)
  return (
    <div className="stats-screen" data-testid="stats-screen">
      <button onClick={onBack}>{t('common.back')}</button>
      <h2>{t('stats.title')}</h2>
      <div className="mastery-grid">
        {entries.length === 0 && <span>{/* empty first-run: nothing yet */}</span>}
        {entries.map(([id, m]) => (
          <span key={id} className={`mastery-cell box-${m.box}`} title={`${id}: box ${m.box}`} />
        ))}
      </div>
    </div>
  )
}
```

`src/App.tsx` (screen-state machine):
```tsx
import { useEffect, useState } from 'react'
import type { GameMap, ScoreState, ScoringKind } from './engine/types'
import { loadMap, type MapId } from './data/mapIndex'
import { levelsFor, type Level } from './data/levels'
import { loadSettings, saveSettings, mergeSessionMastery } from './engine/persistence'
import { dirFor } from './i18n'
import i18n from 'i18next'
import { Home } from './ui/screens/Home'
import { MapPicker } from './ui/screens/MapPicker'
import { LevelModePicker } from './ui/screens/LevelModePicker'
import { Play } from './ui/screens/Play'
import { Results } from './ui/screens/Results'
import { Stats } from './ui/screens/Stats'

type Screen = 'home' | 'map' | 'level' | 'play' | 'results' | 'stats'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [locale, setLocale] = useState<string>(() => loadSettings().locale)
  const [mapId, setMapId] = useState<MapId | null>(null)
  const [map, setMap] = useState<GameMap | null>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [scoring, setScoring] = useState<ScoringKind>('no-fail')
  const [score, setScore] = useState<ScoreState | null>(null)

  useEffect(() => {
    document.dir = dirFor(locale)
    i18n.changeLanguage(locale)
    saveSettings({ locale, lastMapId: mapId ?? undefined })
  }, [locale, mapId])

  function toggleLocale() { setLocale((l) => (l === 'en' ? 'he' : 'en')) }

  if (screen === 'home')
    return <Home locale={locale} onToggleLocale={toggleLocale}
      onChooseMap={() => setScreen('map')}
      onStats={() => { if (mapId) setScreen('stats') }} />

  if (screen === 'map')
    return <MapPicker onBack={() => setScreen('home')}
      onPick={async (id) => { setMapId(id); setMap(await loadMap(id)); setScreen('level') }} />

  if (screen === 'level' && map && mapId)
    return <LevelModePicker levels={levelsFor(mapId)} onBack={() => setScreen('map')}
      onStart={(lv, sc) => { setLevel(lv); setScoring(sc); setScreen('play') }} />

  if (screen === 'play' && map && level)
    return <Play map={map} level={level} scoring={scoring}
      onExit={(s, sessionMastery) => {
        mergeSessionMastery(map.id, sessionMastery)
        setScore(s); setScreen('results')
      }} />

  if (screen === 'results' && map && level && score)
    return <Results map={map} level={level} score={score} onHome={() => setScreen('home')} />

  if (screen === 'stats' && mapId)
    return <Stats mapId={mapId} onBack={() => setScreen('home')} />

  return <Home locale={locale} onToggleLocale={toggleLocale}
    onChooseMap={() => setScreen('map')} onStats={() => setScreen('home')} />
}
```

`src/main.tsx` (init i18n before render):
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initI18n } from './i18n'
import { loadSettings } from './engine/persistence'

initI18n(loadSettings().locale).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><App /></React.StrictMode>
  )
})
```

Every screen uses `useTranslation()` for all text. No hardcoded user-facing strings.

- [ ] **Step 7: Write and pass an App smoke test**

`src/App.test.tsx`:
```tsx
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { initI18n } from './i18n'

beforeAll(async () => { await initI18n('en') })

describe('App', () => {
  it('renders home and can navigate to the map picker', async () => {
    render(<App />)
    expect(screen.getByText(/GeoMap/i)).toBeTruthy()
    // a "choose map" control exists
    const btn = screen.getByTestId('nav-map')
    fireEvent.click(btn)
    expect(await screen.findByTestId('map-picker')).toBeTruthy()
  })
})
```

- [ ] **Step 8: Run full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 9: Verify dev build runs and is installable**

Run: `npm run build && npm run preview` and confirm the manifest and service worker are emitted (check `dist/manifest.webmanifest` and a `sw.js`). Note the preview URL.

- [ ] **Step 10: Commit**

```bash
git add src/ui src/App.tsx src/App.test.tsx src/main.tsx
git commit -m "feat(ui): add screens, HUD, and app navigation wiring"
```

---

### Task 11: GitHub Pages deployment workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: CI that builds with the correct `BASE_PATH` and publishes `dist/` to GitHub Pages.

- [ ] **Step 1: Write the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build:maps
      - run: npm test
      - run: npm run build
        env:
          BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build maps, test, and deploy to GitHub Pages with base path"
```

---

### Task 12: Dev skill — add-map (and add-region)

**Files:**
- Create: `.claude/skills/add-map/SKILL.md`, `.claude/skills/add-map/validate-map.mjs`, `.claude/skills/add-region/SKILL.md`

**Interfaces:**
- Produces: invokable workflows. `validate-map.mjs` is the reusable quality gate script, usable by CI and by a human.

- [ ] **Step 1: Write the validation helper**

`.claude/skills/add-map/validate-map.mjs`:
```js
// Quality gate for a generated map JSON. Usage: node validate-map.mjs path/to/map.json
import { readFileSync } from 'node:fs'
const file = process.argv[2]
if (!file) { console.error('usage: validate-map.mjs <map.json>'); process.exit(2) }
const map = JSON.parse(readFileSync(file, 'utf8'))
const errors = []
if (!map.id || !map.nameKey || !Array.isArray(map.regions)) errors.push('missing map fields')
if (!Array.isArray(map.viewBox) || map.viewBox.length !== 4) errors.push('bad viewBox')
const seen = new Set()
for (const r of map.regions ?? []) {
  if (!r.id) errors.push('region without id')
  if (seen.has(r.id)) errors.push(`duplicate id ${r.id}`)
  seen.add(r.id)
  if (!r.svgPath || r.svgPath.length === 0) errors.push(`empty path ${r.id}`)
  if (!r.nameKey) errors.push(`missing nameKey ${r.id}`)
  if (!Array.isArray(r.bbox) || r.bbox.length !== 4) errors.push(`bad bbox ${r.id}`)
}
if (errors.length) { console.error('FAIL:\n' + errors.join('\n')); process.exit(1) }
console.log(`OK: ${map.id} ${map.regions.length} regions`)
```

- [ ] **Step 2: Verify the helper against an existing map**

Run: `node .claude/skills/add-map/validate-map.mjs src/data/maps/world.json`
Expected: prints `OK: world <N> regions`.

- [ ] **Step 3: Write the add-map SKILL.md**

`.claude/skills/add-map/SKILL.md` with frontmatter (`name: add-map`, a `description` that triggers on "add a map / new map / add a country's regions") and a body documenting the four stages:
- **Acquire:** identify the open source (world-atlas subset by ISO ids, us-atlas, or another Natural Earth atlas); add the id set or atlas object to `scripts/build-maps.mjs`.
- **Generate:** run `npm run build:maps`; confirm the new `src/data/maps/<id>.json` and region names in `en.json`; add the id to `MAP_IDS` and any map-name keys to locales.
- **Test:** add the new id to `mapIndex.test.ts` coverage (it is parameterized over `MAP_IDS`, so it is automatic) and run `npm test`.
- **Quality gate:** run `validate-map.mjs` on the new file; check file size budget; flag missing translations; visual spot-check via the chrome-devtools skill.
- **Document:** append an ADR if a non-trivial choice was made (resolution, source), and update `docs/decisions-log.md`.

- [ ] **Step 4: Write the add-region SKILL.md**

`.claude/skills/add-region/SKILL.md` — same four stages scoped to adding/fixing one region's id, name, and path within an existing map file, then re-running `validate-map.mjs` and `npm test`.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/add-map .claude/skills/add-region
git commit -m "feat(skills): add add-map and add-region development skills"
```

---

### Task 13: Dev skills — add-game-mode and add-language

**Files:**
- Create: `.claude/skills/add-game-mode/SKILL.md`, `.claude/skills/add-language/SKILL.md`, `.claude/skills/add-language/check-locale.mjs`

**Interfaces:**
- Produces: invokable workflows. `check-locale.mjs` is the locale-coverage quality gate.

- [ ] **Step 1: Write the locale-coverage checker**

`.claude/skills/add-language/check-locale.mjs`:
```js
// Compares a locale file against en.json; reports missing keys.
// Usage: node check-locale.mjs src/i18n/en.json src/i18n/he.json
import { readFileSync } from 'node:fs'
const [, , basePath, locPath] = process.argv
const base = JSON.parse(readFileSync(basePath, 'utf8'))
const loc = JSON.parse(readFileSync(locPath, 'utf8'))
const missing = Object.keys(base).filter((k) => !(k in loc))
if (missing.length) {
  console.error(`MISSING ${missing.length} keys in ${locPath}:`)
  console.error(missing.slice(0, 50).join('\n'))
  process.exit(1)
}
console.log(`OK: ${locPath} covers all ${Object.keys(base).length} keys`)
```

- [ ] **Step 2: Verify the checker (expect it to report region-name gaps in he.json, which is acceptable)**

Run: `node .claude/skills/add-language/check-locale.mjs src/i18n/en.json src/i18n/he.json || true`
Expected: either OK, or a MISSING report for region names (documented as acceptable fallback).

- [ ] **Step 3: Write add-game-mode SKILL.md**

`.claude/skills/add-game-mode/SKILL.md` with triggering frontmatter and the four stages:
- **Acquire/design:** restate the loop; confirm what the prompt is and what a correct answer is.
- **Generate:** create `src/engine/modes/<id>Mode.ts` exporting a prompt builder and a `judge` function with the same shapes LocateMode uses (`Prompt`, `AnswerResult`); extend `session.ts` to select the mode (add a `mode` field to `SessionConfig` if more than one ships); add any new locale keys to `en.json`/`he.json`; wire a UI affordance if the interaction differs (e.g. a text input for name-mode) reusing `MapRenderer` visual states.
- **Test (TDD):** write mode-behavior tests first in `src/engine/modes/<id>Mode.test.ts` (prompt generation, correct/wrong judging, completion under each scoring kind), then implement to green.
- **Quality gate:** `npm test` green; confirm the mode runs under `no-fail`, `lives`, and `timer` and with the scheduler.
- **Document:** ADR for the new mode; update decisions log.

- [ ] **Step 4: Write add-language SKILL.md**

`.claude/skills/add-language/SKILL.md` with triggering frontmatter and the four stages:
- **Acquire:** gather UI-string translations; for region names, pull labels per stable id from an open source (e.g. Wikidata labels keyed by ISO/FIPS id); **flag gaps for human review rather than invent names.**
- **Generate:** create `src/i18n/<locale>.json`; add `<locale>` to `SUPPORTED` in `src/i18n/index.ts` and to the resources map; set direction in `dirFor` if RTL.
- **Test/gate:** run `check-locale.mjs en.json <locale>.json`; verify `dirFor` and that `document.dir` flips; confirm no shipped UI key is untranslated (region-name fallback to en is allowed and reported).
- **Document:** ADR noting the locale, its direction, and translation source; update decisions log.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/add-game-mode .claude/skills/add-language
git commit -m "feat(skills): add add-game-mode and add-language development skills"
```

---

### Task 14: Final verification pass and evidence evaluation

**Files:** Create `verification/FINAL-REPORT.md`.

- [ ] **Step 1: Full clean build and test (captured)**

Run: `scripts/verify.sh task-14 clean-build -- bash -c "rm -rf node_modules dist && npm ci && npm run build:maps && npm test && npm run build"`
Expected: install, map build, all tests, and production build all succeed; log ends `EXIT=0`.

- [ ] **Step 2: Manual offline/install check via chrome-devtools (evidence stored)**

Run `npm run preview`. Open the preview URL with the chrome-devtools skill and confirm, saving a screenshot per check into `verification/task-14/`:
- four maps load and are playable → `maps-playable.png`
- a wrong answer reveals the correct region → `wrong-reveal.png`
- a lives round ends at 0 → `lives-zero.png`
- Hebrew toggles `dir="rtl"` on chrome while the map does not mirror → `rtl-chrome.png`
- a service worker is registered (installable) → `sw-registered.png`

For each, write one line in the SUMMARY stating Expected, Actual (what the screenshot shows), and PASS/FAIL. Screenshots are referenced by path; raw PNGs are git-ignored per the protocol, the SUMMARY is committed.

- [ ] **Step 3: Aggregate and evaluate all evidence**

Create `verification/FINAL-REPORT.md`: a table with one row per task (0–14), linking its `SUMMARY.md`, and a column for whether every row in that summary is PASS. Then state an overall verdict. If any task summary has a FAIL row, the overall verdict is FAIL — stop and fix before shipping.

```bash
# sanity: every task summary exists and contains no FAIL
for d in verification/task-*; do
  test -f "$d/SUMMARY.md" || echo "MISSING SUMMARY: $d"
  grep -q 'FAIL' "$d/SUMMARY.md" && echo "HAS FAIL: $d"
done; echo "aggregation check done"
```
Expected: no `MISSING SUMMARY` and no `HAS FAIL` lines.

- [ ] **Step 4: Update README status and commit**

Mark the implemented features in `README.md`, confirm the "add via skills" rule and the Verification Protocol are documented, and commit the final docs plus all verification evidence.

```bash
git add -A
git commit -m "docs: finalize README; add final verification report and evidence"
```

---

## Self-Review Notes

- **Spec coverage:** engine/UI split (T3–T10), adaptive repetition (T4), levels + scope (T7), three scoring modes (T5), four preloaded maps from open TopoJSON (T7), SVG renderer with touch hit-areas (T9), i18n + RTL en/he (T8,T10), client-only PWA on GitHub Pages (T1,T11), persistence/offline (T6,T1), skill-driven dev layer add-map/add-region/add-game-mode/add-language with acquire→generate→test→gate (T12,T13), decisions in ADRs/log (referenced in T12/T13 Document stages; ADRs already written during brainstorming).
- **Review Focus:** empty/first-run (T4,T6 tests), small level set (T5 test), wrong-answer flooding (T5 test), tiny/overlapping tap (T9 test), missing translation key (T8 test) — each pinned to its owning task.
- **Type consistency:** `GameMap`/`Region`/`Prompt`/`AnswerResult`/`ScoreState`/`ScoringKind`/`SessionConfig` defined once in T3 and used verbatim thereafter; `MasteryStore`/`RegionMastery` from T4 reused in T6; `createSession`/`Session` (incl. `mastery()`) from T5 used in T10; `MapRenderer`/`RegionVisual` from T9 used in T10.
- **Verification evidence:** Task 0 builds the capture harness (`scripts/verify.sh`); every task (1–14) wraps its command steps with it, stores logs under `verification/task-NN/`, and closes with a committed `SUMMARY.md` evaluated against each step's Expected result; Task 14 aggregates all summaries into `verification/FINAL-REPORT.md` with an overall verdict, and CI re-runs the same commands as independent re-evaluation.

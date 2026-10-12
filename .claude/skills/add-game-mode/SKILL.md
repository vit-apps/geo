---
name: add-game-mode
description: Use this skill when asked to add a game mode, add a new quiz type, implement name-the-region mode, flag mode, capital-city mode, or any other interaction style for the geo-game. Triggers on phrases like "add a game mode", "new game mode", "add [name] mode", "implement [type] quiz".
---

# Skill: add-game-mode

Add a new game mode to the geo-game. A mode defines what the player is asked (the `Prompt`) and how an answer is judged (the `AnswerResult`). This skill documents the four stages required for any mode expansion.

---

## Stage 1 — Acquire / Design the Loop

Before writing code, answer these questions and record the answers in the ADR (see Stage 4):

1. **What is the prompt?** Describe in one sentence what the player sees/hears. Examples:
   - *Locate mode*: "Tap the region named [X] on the map."
   - *Name mode*: "A region is highlighted — type or choose its name."
   - *Capital mode*: "Tap the region whose capital is [C]."
   - *Flag mode*: "Tap the flag that belongs to [region name]."

2. **What constitutes a correct answer?** Specify the exact value compared (region id, typed string, flag id…).

3. **What new UI affordance is needed?** If the player must do something other than tap a region, sketch the component (e.g. a text input, a flag grid). Confirm that `MapRenderer` visual states (`correct`, `wrong`, `idle`) still apply and reuse them.

4. **What new i18n keys are needed?** List every new `en.json` key, e.g. `play.namePrompt`, `play.capitalPrompt`, `play.typeAnswer`, `play.flagPrompt`.

5. **Any scoring or scheduler impact?** Most modes slot into the existing `no-fail` / `lives` / `timer` scoring kinds and the spaced-repetition scheduler without changes. Note exceptions.

---

## Stage 2 — Generate

### 2a. Create the mode file

Create `src/engine/modes/<id>Mode.ts` exporting:
- `makePrompt(map: GameMap, regionId: string): Prompt` — builds the prompt for a given region.
- `judge(prompt: Prompt, answer: unknown): AnswerResult` — evaluates the player's answer.

The shapes `Prompt` and `AnswerResult` are defined in `src/engine/types.ts` and are the same as `locateMode`. Do **not** widen those interfaces without a separate ADR; add an optional payload field if the mode needs extra prompt data (e.g. `flagUrl`).

Example skeleton for a name-entry mode:
```ts
import type { GameMap, Prompt, AnswerResult } from '../types'

export function makeNamePrompt(map: GameMap, regionId: string): Prompt {
  const region = map.regions.find((r) => r.id === regionId)
  if (!region) throw new Error(`makeNamePrompt: regionId "${regionId}" not found in map "${map.id}"`)
  return { regionId, nameKey: region.nameKey }
}

export function judge(prompt: Prompt, typedName: string): AnswerResult {
  // Accept the canonical translated name; normalise whitespace and case.
  return {
    correct: /* your comparison logic */,
    expectedRegionId: prompt.regionId,
    tappedRegionId: prompt.regionId, // for non-tap modes, set to expected on correct answer
  }
}
```

### 2b. Extend session.ts

Add a `mode` field to `SessionConfig` in `src/engine/types.ts`:
```ts
export type ModeKind = 'locate' | '<id>'  // extend as modes are added
export interface SessionConfig {
  // … existing fields …
  mode?: ModeKind  // defaults to 'locate' when absent
}
```

In `session.ts`, replace the hard-coded `makeLocatePrompt`/`judge` imports with a mode-dispatch:
```ts
const modeImpl = cfg.mode === '<id>' ? nameMode : locateMode
// use modeImpl.makePrompt and modeImpl.judge in nextPrompt / submitAnswer
```

### 2c. Add locale keys

Add all new prompt keys to `src/i18n/en.json` (and provide translations in `src/i18n/he.json`). Example:
```json
"play.namePrompt": "What is the name of this region?"
```

### 2d. Wire the UI affordance

If the interaction differs from map-tap (e.g. a text input), add the minimal component and connect it to the session. Reuse `MapRenderer` visual states (`correct`/`wrong`/`idle`) for map highlighting; they are driven by `AnswerResult.expectedRegionId` regardless of mode.

---

## Stage 3 — Test (TDD)

Write tests **before** implementing. Create `src/engine/modes/<id>Mode.test.ts`:

```ts
describe('<id>Mode', () => {
  it('builds a prompt from a valid regionId')
  it('throws on unknown regionId')
  it('judges a correct answer as correct')
  it('judges an incorrect answer as wrong')
  it('completes under no-fail scoring')
  it('completes under lives scoring')
  it('completes under timer scoring')
  it('works with the scheduler (spaced-repetition picks regions)')
})
```

Run `npm test` and confirm failures, then implement to green.

**Integration smoke test** — add one test to `src/engine/session.test.ts` that creates a `SessionConfig` with `mode: '<id>'` and verifies `nextPrompt()` returns a prompt with the expected shape.

---

## Stage 4 — Quality Gate

Before merging:

1. `npm test` must be green for all test files.
2. Manually (or in a dev session) confirm the new mode:
   - Runs to completion under `no-fail` scoring.
   - Runs to completion under `lives` scoring (verify a wrong answer decrements lives).
   - Runs to completion under `timer` scoring (verify the elapsed time is recorded).
   - The scheduler advances regions through mastery boxes correctly across multiple sessions.
3. Confirm `MapRenderer` highlights correctly after a submit (correct = green highlight, wrong = red highlight on expected region).
4. Confirm all new i18n keys are present in `en.json` **and** `he.json` (or note RTL-specific fallback).

---

## Stage 5 — Document

Append a new ADR to `docs/decisions/` using the project ADR template. Cover:
- The mode's name, trigger phrase, and loop description.
- Why this mode adds learning value.
- Any changes to `SessionConfig`, `Prompt`, or `AnswerResult` shapes.
- UI component decisions.

Add a one-line entry to `docs/decisions-log.md`.

Reference the ADR number in the commit message, e.g.:
```
feat(modes): add name-entry game mode (ADR 00XX)
```

---

## Checklist

- [ ] Loop described: prompt, correct-answer contract, UI affordance
- [ ] `<id>Mode.ts` created with `makePrompt` and `judge`
- [ ] `SessionConfig.mode` field added, session dispatches correctly
- [ ] New locale keys added to `en.json` and `he.json`
- [ ] Tests written before implementation (TDD)
- [ ] `npm test` green
- [ ] Mode verified under `no-fail`, `lives`, and `timer` scoring
- [ ] Scheduler integration confirmed
- [ ] MapRenderer visual states work correctly
- [ ] ADR written and decisions-log updated

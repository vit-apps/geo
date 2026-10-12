# ADR 0004 — Difficulty via levels + adaptive spaced repetition

**Date:** 2026-10-12
**Status:** Accepted

## Context
Difficulty must span first-graders to experts. Spaced repetition was chosen
to make learning stick, but a beginner cannot be dropped into all regions at
once.

## Decision
Two combined mechanisms:
1. **Levels** set the *starting region set* (beginner: a handful of large,
   obvious regions; expert: all regions of the map).
2. **Adaptive spaced repetition** schedules which region within that set is
   asked next, using a Leitner-box scheme (wrong → box 1, right → promote).

Per-region mastery persists in local storage.

## Alternatives considered
- **Scope + hints only:** no memory of weak spots.
- **Different activity per tier:** fragments the game; harder to maintain.
- **Full SM-2 algorithm:** more complex than needed; Leitner is simpler and
  explainable, better for children.

## Consequences
- Weak regions resurface automatically; progress is visible.
- Requires persistent per-region stats and a scheduler component in the
  engine.

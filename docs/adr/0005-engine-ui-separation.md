# ADR 0005 — Engine / UI separation and a pluggable game-mode interface

**Date:** 2026-10-12
**Status:** Accepted

## Context
The game ships with one mode (Locate a named place) but must grow to
name-the-place, capitals, and jigsaw modes without rewrites.

## Decision
- A framework-agnostic, DOM-free **game engine** (TypeScript) holds all game
  logic: modes, scoring strategies, adaptive scheduler.
- A **UI layer** (React) renders engine state and forwards taps; it holds no
  game logic.
- Every game mode implements one **GameMode interface**
  (`start / nextPrompt / submitAnswer / isComplete / score`).
- Scoring (no-fail / lives / timer) is a pluggable strategy layered on any
  mode.

## Consequences
- Adding a mode = one new class + small UI wiring.
- The engine is unit-testable without a browser (TDD).
- The SVG renderer is mode-agnostic and reused across modes.

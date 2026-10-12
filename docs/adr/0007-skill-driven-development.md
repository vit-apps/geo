# ADR 0007 — Skill-driven development layer

**Date:** 2026-10-12
**Status:** Accepted

## Context
The app is designed to grow (maps, regions, modes, languages). The user
requires that every expansion task run through a repeatable, orchestrated
workflow with data acquisition from open sources, development, tests, and
quality checks — not ad-hoc edits.

## Decision
Create an in-repo development layer of **Claude Code skills** under
`.claude/skills/`, one per recurring task:
- `add-map`, `add-region`, `add-game-mode`, `add-language`.

Each skill orchestrates four stages: **acquire → generate → test →
quality gate**, and records non-trivial choices as an ADR.

**Adopted rule:** expansion tasks are performed *through* these skills.

## Alternatives considered
- **CLI scripts only:** mechanical but no agentic judgment (source
  selection, quality review).
- **Both CLI + skills:** more power, more to maintain; deferred.

## Consequences
- Expansion is consistent, tested, and documented by construction.
- The app itself stays a pure static client; skills are build-time tooling
  versioned with the app.
- Each skill must define and enforce its quality gate.

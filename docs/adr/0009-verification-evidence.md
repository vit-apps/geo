# ADR 0009 — Mandatory verification evidence for every step

**Date:** 2026-10-12
**Status:** Accepted

## Context
The implementation plan is executed task-by-task. The user requires that
every step be validated/verified, that the validation evidence be stored,
and that it be evaluated — not merely run and eyeballed.

## Decision
Adopt a Verification Protocol binding on every task:
- A capture helper, `scripts/verify.sh`, runs each command, tees combined
  stdout+stderr to `verification/task-NN/<step>.log`, and records the exit
  code and timestamps.
- Each step's log is evaluated against the step's stated **Expected**
  result; a mismatch is a failure that blocks progress.
- Each task closes with a committed `verification/task-NN/SUMMARY.md`
  table (step, evidence, Expected, Actual, PASS/FAIL). A task is done only
  when every row is PASS.
- Evidence is version-controlled (text logs committed; large/binary
  captures referenced by path and may be git-ignored).
- Task 14 aggregates all summaries into `verification/FINAL-REPORT.md`
  with an overall verdict; CI re-runs the same commands as independent
  re-evaluation.

## Consequences
- Every change carries an audit trail of what was verified and the result.
- Slightly more work per step; justified by reproducibility and the
  user's explicit requirement.
- A new Task 0 builds the harness before any app code.

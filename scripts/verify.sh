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

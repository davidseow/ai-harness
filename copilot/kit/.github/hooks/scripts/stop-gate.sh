#!/usr/bin/env bash
# agentStop: the quality gate. Before Copilot may say "done", the repo's own
# tests must pass for whatever it touched. Failing → block, with the failure as
# the next prompt. Retries once, then lets the turn end and leaves the red to you.
set -uo pipefail

input=$(cat)
if [ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ]; then
  exit 0   # already forced one retry this turn; don't loop
fi

changed=$(git status --porcelain 2>/dev/null | awk '{print $NF}')
fail=""

if grep -q '^build/' <<<"$changed"; then
  if ! out=$(cd build && npm run --silent smoke 2>&1); then
    fail+="npm run smoke failed:"$'\n'"$(tail -n 20 <<<"$out")"$'\n'
  fi
fi

if grep -qE '^(lessons/|build/)' <<<"$changed"; then
  if ! out=$(python3 tools/check-transcripts.py 2>&1); then
    fail+="check-transcripts.py failed:"$'\n'"$(tail -n 15 <<<"$out")"$'\n'
  fi
fi

[ -z "$fail" ] && exit 0

jq -cn --arg f "$fail" '{decision:"block",
  reason:("The quality gate is red. Fix this before finishing:\n" + $f)}'

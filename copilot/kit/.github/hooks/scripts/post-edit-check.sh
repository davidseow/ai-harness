#!/usr/bin/env bash
# postToolUse on edit|create: when a lesson changes, run the docs test at once
# and hand any failure back to the model on the same turn.
# postToolUse cannot block; it can only add context. Fail-open by design.
set -uo pipefail

input=$(cat)
args=$(jq -r '.toolArgs // ""' <<<"$input")

case "$args" in
  *lessons/*) ;;
  *) exit 0 ;;   # not a lesson: say nothing, cost nothing
esac

if out=$(python3 tools/check-transcripts.py 2>&1); then
  exit 0
fi

jq -cn --arg o "$(tail -n 15 <<<"$out")" \
  '{additionalContext: ("check-transcripts.py failed after your edit:\n" + $o +
    "\nQuoted output must come from build/transcripts/. Fix the quote, do not invent output.")}'

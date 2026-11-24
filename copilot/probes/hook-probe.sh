#!/usr/bin/env bash
# Feed fake Copilot CLI hook payloads to the kit's scripts and print what they decide.
# Payload shape follows the docs' own test command (toolName + toolArgs as a JSON string).
# Run from the repo root:  bash copilot/probes/hook-probe.sh > copilot/probes/hook-probe.txt
set -uo pipefail
ROOT=$(pwd)
S="$ROOT/copilot/kit/.github/hooks/scripts"

pre() {  # $1 = toolName, $2 = toolArgs object (as JSON)
  local payload out code
  payload=$(jq -cn --arg t "$1" --arg a "$2" '{timestamp:1704614400000,cwd:"/repo",toolName:$t,toolArgs:$a}')
  out=$(bash "$S/pre-tool-policy.sh" <<<"$payload"); code=$?
  printf '%-6s %-52s exit=%s %s\n' "$1" "$2" "$code" "${out:-(silent: normal flow)}"
}

echo "== preToolUse: pre-tool-policy.sh =="
pre bash   '{"command":"git status"}'
pre bash   '{"command":"git push origin main --force"}'
pre bash   '{"command":"git push -f"}'
pre bash   '{"command":"git commit -m wip --no-verify"}'
pre bash   '{"command":"rm -rf build/node_modules"}'
pre bash   '{"command":"rm -r -f build/node_modules"}'
pre bash   '{"command":"echo hi > build/transcripts/stage1.txt"}'
pre edit   '{"path":"build/transcripts/stage1.txt"}'
pre edit   '{"path":"lessons/02-the-loop.md"}'
pre view   '{"path":"build/transcripts/stage1.txt"}'

echo
echo "== preToolUse with jq missing (simulated crash) =="
payload='{"toolName":"bash","toolArgs":"{\"command\":\"ls\"}"}'
PATH=/nonexistent /bin/bash "$S/pre-tool-policy.sh" <<<"$payload" >/dev/null 2>&1
echo "exit=$?  (non-zero, not 2: Copilot treats this as a deny)"

echo
echo "== postToolUse: post-edit-check.sh =="
T=$(mktemp -d)
cp -R lessons tools reading "$T"/ && mkdir -p "$T/build" && cp -R build/transcripts "$T/build/"
cd "$T"
p='{"toolName":"edit","toolArgs":"{\"path\":\"build/src/loop.ts\"}"}'
echo "edit build/src/loop.ts → $(bash "$S/post-edit-check.sh" <<<"$p")(silent)"
p='{"toolName":"edit","toolArgs":"{\"path\":\"lessons/02-the-loop.md\"}"}'
echo "edit lessons/02 (clean) → $(bash "$S/post-edit-check.sh" <<<"$p")(silent)"
printf '\n```\n  DENY   bash  invented line the model made up\n```\n' >> lessons/02-the-loop.md
echo "edit lessons/02 (invented output line added) →"
bash "$S/post-edit-check.sh" <<<"$p" | jq -r '.additionalContext'
cd "$ROOT"; rm -rf "$T"

echo
echo "== agentStop: stop-gate.sh (throwaway git copy of the repo) =="
T=$(mktemp -d)
cp -R lessons tools reading "$T"/ && mkdir -p "$T/build" && cp -R build/transcripts "$T/build/"
cd "$T" && git init -q && git add -A && git -c user.name=p -c user.email=p@p commit -qm base
echo "clean tree                → $(bash "$S/stop-gate.sh" <<<'{"stopReason":"end_turn","stop_hook_active":false}')(silent: may stop)"
printf '\n```\n  DENY   bash  invented line the model made up\n```\n' >> lessons/02-the-loop.md
echo "lesson with invented line →"
bash "$S/stop-gate.sh" <<<'{"stopReason":"end_turn","stop_hook_active":false}' | jq .
echo "same, second time round   → $(bash "$S/stop-gate.sh" <<<'{"stopReason":"end_turn","stop_hook_active":true}')(silent: retry spent, turn ends)"
cd "$ROOT"; rm -rf "$T"

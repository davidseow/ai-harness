# 11 — The stop gate

**~5 min · M4 Quality gates · after lesson 21, quality bite 18**

> **In one line:** "Done" should be something the harness checks, not something
> the model says. An `agentStop` hook runs the tests and, if they are red, turns
> the failure into the next prompt.

## The idea

Lesson 18 names the failure: "No verification step. The agent says the tests
pass. Nobody ran them." An instruction cannot fix that. A hook
on `agentStop` can: when it returns `decision: "block"`, the turn does not end,
and `reason` "forces another agent turn using `reason` as the prompt" (§5).

## Example — the kit's gate

[`stop-gate.sh`](../kit/.github/hooks/scripts/stop-gate.sh) checks only what was
touched:

```bash
if [ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ]; then
  exit 0   # already forced one retry this turn; don't loop
fi

changed=$(git status --porcelain | awk '{print $NF}')

if grep -q '^build/' <<<"$changed"; then
  … npm run smoke …
fi
if grep -qE '^(lessons/|build/)' <<<"$changed"; then
  … python3 tools/check-transcripts.py …
fi

[ -z "$fail" ] && exit 0
jq -cn --arg f "$fail" '{decision:"block",
  reason:("The quality gate is red. Fix this before finishing:\n" + $f)}'
```

The probe ran it in a throwaway git copy ([`hook-probe.txt`](../probes/hook-probe.txt)):

```
clean tree                → (silent: may stop)
lesson with invented line →
{
  "decision": "block",
```

…and on the second pass, with `stop_hook_active` true:

```
same, second time round   → (silent: retry spent, turn ends)
```

## The loop question

A stop hook that always blocks makes an agent that never stops. Copilot caps it:
"After 8 consecutive `block` continuations, the CLI overrides the hook and ends
the turn anyway" (§5). Eight full test runs plus eight model turns is a lot to
spend on a fix the model cannot find.

The kit allows **one** retry, using `stop_hook_active`. That is a choice, and it
has a cost: on the second failure the turn ends red, and you see it. Raise it if
your fixes usually take two goes. Do not remove the guard.

## Speed and quality, together

- **Only test what changed.** A lesson edit does not need `smoke`. The
  `git status` check keeps the gate cheap enough to run every time.
- **Deterministic first.** The gate runs real tests, not a model judging its own
  work. A model reviewer (bite 12) comes after green, not instead of it.
- **Generous timeout.** `timeoutSec: 300` in the kit. A timeout fails open
  (bite 08): too short, and slow tests silently pass the gate.

## Check yourself

### Q: The gate blocks; the model "fixes" it by deleting the failing assertion. Gate passes. What now?
- A: Nothing, tests pass
- B: Add a `preToolUse` deny on edits to the test file's checks, or make the post-edit hook flag removed assertions
- C: Raise the retry count

<details><summary>Answer</summary>

**B** — the gate measures; something must protect the measure (quality bite 13,
"keep the eval honest"). The kit's instructions also say "never weaken a check",
which is advice; the hook is the fact.

</details>

### Q: Your test suite takes 6 minutes, `timeoutSec` is 300. Effect?
- A: The gate always blocks
- B: The gate always times out and fails open: it never blocks
- C: Copilot waits 6 minutes

<details><summary>Answer</summary>

**B** — the worst kind of gate: present, green, and checking nothing.

</details>

**Next:** [12 — Headless runs and CI](12-headless-and-ci.md)

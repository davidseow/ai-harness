# 10 — Fast feedback after each edit

**~4 min · M4 Quality gates · after lessons 07, 18**

> **In one line:** Catch a mistake on the turn it is made, while the model still
> has the cause in view. `postToolUse` cannot block, but it can make the next
> step the fix.

## The idea

Errors found late are expensive. If a broken quote in a lesson is found by CI an
hour later, someone reopens the context, rediscovers the cause and fixes it. If
it is found the moment the edit lands, the model fixes it on the next step,
because the edit is the last thing it did.

`postToolUse` can return `additionalContext`, which is "appended to
`textResultForLlm` so the model sees it after the tool output on the same turn"
(§5). In plain terms: the tool result now ends with your checker's complaint.

## Example — check lessons on every edit

[`post-edit-check.sh`](../kit/.github/hooks/scripts/post-edit-check.sh), matched
on `edit|create`:

```bash
case "$args" in
  *lessons/*) ;;
  *) exit 0 ;;   # not a lesson: say nothing, cost nothing
esac

if out=$(python3 tools/check-transcripts.py 2>&1); then
  exit 0
fi

jq -cn --arg o "$(tail -n 15 <<<"$out")" \
  '{additionalContext: ("check-transcripts.py failed …" + $o)}'
```

The probe added an invented output line to a copy of lesson 02 and fired the
hook. What the model would see appended to the edit result
([`hook-probe.txt`](../probes/hook-probe.txt)):

```
check-transcripts.py failed after your edit:
checked 73 quoted transcript lines against captured sources

1 NOT FOUND:
  02-the-loop.md: DENY   bash  invented line the model made up
Quoted output must come from build/transcripts/. Fix the quote, do not invent output.
```

## Rules for a good post-edit check

- **Fast.** It runs after every matching edit. The checker here takes well under
  a second. Your full test suite does not belong here; put it in `agentStop`
  (bite 11).
- **Silent when green.** Output on success is tokens spent on nothing.
- **Tail, not the whole log.** `additionalContext` is capped at 10 KB (§5), and
  the model needs the failing line, not 400 passing ones.
- **Say what to do.** The last line tells the model the *right* fix, so it does
  not "fix" the checker instead.

A formatter is the classic fit: run it on edit, and style never comes up in
review again.

## Check yourself

### Q: Why not run `npm run smoke` here too?
- A: It cannot run in a hook
- B: It runs after every edit; a slow suite there stalls every step. Run it once, at stop
- C: It needs network

<details><summary>Answer</summary>

**B** — fast checks per edit, full checks per finish.

</details>

### Q: The checker fails. Is the edit undone?
- A: Yes
- B: No: `postToolUse` cannot block. The edit stands; the model is told
- C: Only if exit code is 2

<details><summary>Answer</summary>

**B** — it is feedback, not a gate. The gate is bite 11.

</details>

**Next:** [11 — The stop gate](11-stop-gate.md)

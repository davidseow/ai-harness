# 09 — The policy hook

**~5 min · M4 Quality gates · after lesson 10, quality bite 14**

> **In one line:** A `preToolUse` hook turns "please don't" into "can't". Write
> the reason for the model, keep the list short, and probe it, because a hook
> that is wrong looks exactly like one that is right.

## Example — the kit's policy

[`pre-tool-policy.sh`](../kit/.github/hooks/scripts/pre-tool-policy.sh), the
core:

```bash
input=$(cat)
tool=$(jq -r '.toolName' <<<"$input")

deny() {
  jq -cn --arg r "$1" \
    '{permissionDecision:"deny", permissionDecisionReason:$r}'
  exit 0
}

case "$tool" in
  bash)
    cmd=$(jq -r '.toolArgs | (fromjson? // .) | .command // ""' \
          <<<"$input")
    case "$cmd" in
      *"git push"*--force*|*"git push"*" -f"*)
        deny "Force-push needs a human. Push normally or ask the user." ;;
      *"--no-verify"*)
        deny "Do not skip git hooks. Fix what the hook reports instead." ;;
      …
```

It also denies `rm -rf` and any `edit`/`create` whose arguments mention
`build/transcripts/`: this repo's evidence contract (CLAUDE.md) as a fact, not a
request.

## The probe

[`hook-probe.sh`](../probes/hook-probe.sh) feeds fake payloads in the documented
shape. From [`hook-probe.txt`](../probes/hook-probe.txt), trimmed to fit:

```
bash   {"command":"git status"}            (silent: normal flow)
bash   {"command":"git push -f"}           {"permissionDecision":"deny",…
bash   {"command":"rm -rf build/node_m…    {"permissionDecision":"deny",…
bash   {"command":"rm -r -f build/node_…   (silent: normal flow)
edit   {"path":"build/transcripts/stage…   {"permissionDecision":"deny",…
view   {"path":"build/transcripts/stage…   (silent: normal flow)
```

Note `rm -r -f`: allowed. Same lesson as quality bite 14, same reason: a
blocklist on a string loses to anyone who spells it differently. That is why the
list is short and the reason text matters more than the coverage.

## The bug the probe caught

The first draft decoded the arguments like this:

```bash
args=$(jq -r '.toolArgs // ""' <<<"$input")
cmd=$(jq -r 'fromjson? | .command // ""' <<<"$args")
```

`jq -r` had already unwrapped the string, so the second `jq` parsed it as an
object. `fromjson` on an object fails, `?` swallowed the error, and `cmd` was
empty. **Every bash command came back
"silent: normal flow"**, including `git push -f`. Exit code 0. No warning.

Fail-closed would not have saved this: nothing crashed. Only the probe, with a
case that *should* be denied, showed it. The rule from quality bite 14 again:
**a guardrail nobody has watched fire is not a guardrail.**

## Writing the reason

`permissionDecisionReason` is "shown to the agent" (§5), so write it as an
instruction for the next step, not an error:

- weak: `"Denied."` → the model retries a variant.
- strong: `"Transcripts are generated. Run: cd build && npm run transcripts"` →
  the model takes the right path.

A good reason makes a deny a speed-up, not a stall.

## Check yourself

### Q: The probe shows `view` on a transcript as allowed. Bug?
- A: Yes, transcripts must be protected
- B: No: reading is fine; only writing breaks the contract
- C: The matcher is wrong

<details><summary>Answer</summary>

**B** — and the matcher (`bash|edit|create`) means the script never even runs
for `view`. Deny what breaks the rule, nothing more (false alarms, bite 14).

</details>

### Q: Why match the raw `toolArgs` string for `edit` instead of reading a `path` field?
- A: It is faster
- B: The docs do not document per-tool argument names, so a field name is a guess that might silently never match
- C: `edit` has no arguments

<details><summary>Answer</summary>

**B** — see the note at the top of [`sources.md`](../sources.md). Depend only on
what is documented, and probe the rest.

</details>

**Next:** [10 — Fast feedback after each edit](10-post-edit-feedback.md)

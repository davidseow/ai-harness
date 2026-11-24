# 08 — Hooks: anatomy and failure modes

**~5 min · M4 Quality gates · after lessons 12, 15**

> **In one line:** A hook is a script the harness runs at a named event, fed
> JSON on stdin, answering with JSON on stdout. Before you write one, know which
> way it fails.

## The idea

Lesson 12 built an event bus so you could add a gate without editing the loop.
Copilot's hooks are that bus. Three events carry almost all the quality work:

| Event | When | Can it stop things? |
|---|---|---|
| `preToolUse` | before each tool call | **yes**: allow, deny, or rewrite the args |
| `postToolUse` | after each tool call | no, but it can add a note the model reads at once |
| `agentStop` | when the agent wants to finish | **yes**: block, and its reason becomes the next prompt |

The rest (`sessionStart`, `userPromptSubmitted`, `preCompact`, `errorOccurred` …)
are for logging and context injection (§5).

## The file

Hooks live in `.github/hooks/*.json`. The kit's
[`quality-gate.json`](../kit/.github/hooks/quality-gate.json), first entry:

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "matcher": "bash|edit|create",
        "bash": ".github/hooks/scripts/pre-tool-policy.sh",
        "timeoutSec": 5
      }
    ]
  }
}
```

`matcher` is a regex on the tool name, anchored: `bash|edit|create` matches
those three exactly, not `bash_extra` (§5). Without it, the script runs for
every tool call.

## How it fails — learn this table

| Hook result | `preToolUse` | everything else |
|---|---|---|
| exit 0, JSON on stdout | decision applied | output applied |
| exit 0, no output | normal flow | nothing |
| exit 2 | **deny** | warning, run continues |
| other non-zero (a crash) | **deny** (fail-closed) | logged, run continues (fail-open) |
| timeout | **allow** (fail-open) | logged, run continues |

All from §5. Three consequences:

1. **A crashing `preToolUse` hook stops all work.** Missing `jq`, a typo, an
   unset variable: every matching tool is denied. The probe in bite 09 shows the
   exit code.
2. **A slow `preToolUse` hook is no gate.** Timeouts fail open "for every
   event, including `preToolUse` and admin-deployed policy hooks". If your check
   might take 30 seconds, it is advice with a delay.
3. **A wrong hook is worse than a crashing one.** A script that runs fine and
   decides wrongly says nothing. Bite 09 has a real example.

## Mechanics that bite

- **One JSON object, one line.** Two objects on stdout are invalid and ignored.
- **`toolArgs` is a JSON string**, not an object. Decode it before reading
  fields (§5).
- **Restart after editing.** Config loads at startup.
- **Test without Copilot**, using the docs' own command:

```shell
echo '{"timestamp":1704614400000,"cwd":"/tmp","toolName":"bash","toolArgs":"{\"command\":\"ls\"}"}' | ./my-hook.sh
```

## Check yourself

### Q: Your `preToolUse` script calls an API that sometimes takes 40 s. `timeoutSec` is 30. What happens on a slow day?
- A: The tool is denied
- B: The tool runs: timeouts fail open
- C: Copilot waits

<details><summary>Answer</summary>

**B** — the gate quietly isn't one. Keep `preToolUse` local and fast.

</details>

### Q: Which event would you use to make Copilot keep going until the tests pass?
- A: `postToolUse`
- B: `agentStop`
- C: `sessionEnd`

<details><summary>Answer</summary>

**B** — the only one that can "block and force continuation" (bite 11).

</details>

**Next:** [09 — The policy hook](09-policy-hook.md)

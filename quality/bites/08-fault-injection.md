# 08 — Inject the faults

**~4 min · M2 Testing the harness · builds on lessons 07 and 18**

> **In one line:** Most harness code runs on the unhappy path. Test it on purpose,
> because production will test it for you at 3 a.m.

## The idea

Lesson 07 made errors come back as tool results so the model can recover. That
design only works if every failure actually takes that route. Fault injection
forces each one.

The fault list for a harness, by where it comes from:

| Source | Fault | What the harness should do |
|---|---|---|
| Model | tool call with invalid JSON arguments | return an error result, keep looping |
| Model | call to a tool that does not exist | error result naming the real tools |
| Model | stops at `max_tokens` mid tool call | do not run a half-formed call |
| Tool | throws / times out | error result, not a crash |
| Tool | returns 5 MB | truncate *and say so* (lesson 09) |
| Provider | 429 / 500 / dropped stream | retry with backoff, then fail clearly |
| Disk | session log half-written | resume from last complete line |

## Example

With the mock, model faults are one line of script: return a reply whose
`tool_use` names `"delete_everything"`. Assert three things: the loop did not
crash, the next request contains an error `tool_result` for that id, and the turn
count stayed within budget.

Tool and provider faults need a wrapper: a tool that throws on its *n*-th call, or
a provider that fails the first two sends. Small code, big coverage.

**The ordering rule:** test that the harness *survives* a fault before testing that
it *recovers* well. Survival is deterministic. Recovery quality involves the model,
so it belongs in an eval.

## Check yourself

### Q: The model's reply stops at `max_tokens` halfway through a `tool_use` block. Safest harness behaviour?
- A: Run the tool with whatever arguments arrived
- B: Do not execute; ask the model to continue or retry
- C: End the session

<details><summary>Answer</summary>

**B** — a truncated `write` could write half a file. Never execute a call you did
not receive whole.

</details>

### Q: "The agent recovers from a 500 error 80% of the time." Which layer of the pyramid measured that?
- A: Unit
- B: Replay
- C: Eval

<details><summary>Answer</summary>

**C** — a rate implies a real model. Replay can only prove the harness *gave* the
model a chance to recover.

</details>

## On paper

Notebook exercise **2.5**: a fault matrix for stage 2's five tools.

**Next:** [09 — Anatomy of an eval](09-anatomy-of-an-eval.md)

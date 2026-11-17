# 04 — The mock is a test double

**~3 min · M2 Testing the harness · builds on lesson 06**

> **In one line:** `MockProvider` was built to make transcripts, but it is a
> textbook test double, and it is the most useful testing tool in the repo.

## The idea

The provider seam (lesson 06) means the loop never knows whether it is talking to a
real model. Swap in [`build/src/provider/mock.ts`](../../build/src/provider/mock.ts)
and you get three testing powers for free:

1. **Scripted replies.** You decide what the "model" says, so you can force the
   rare paths: two tool calls at once, a tool call to a tool that does not exist.
2. **A recorded request log.** `seen` keeps a deep copy of every request. That is
   your oracle for context bugs (bite 05).
3. **A built-in turn budget.** When the script runs out, the mock throws
   `mock script exhausted after N replies`. A loop that runs one turn too many
   fails loudly instead of quietly costing money.

## Example

The deep copy is not decoration. The comment in `mock.ts` explains why: *"A recorded
request has to be a snapshot to be worth anything."* Without `structuredClone`, the
loop's later `push` onto the live history would rewrite what turn 1 "saw", and every
assertion about turn 1 would be checking turn 5.

That is a general rule for test doubles: **record values, not references.**

## What a mock cannot tell you

It replays replies you wrote, so it never surprises you. It tests *how the harness
handles* a model's choice, never *whether the model would make it*. A green mock
suite plus a red eval is a normal, informative result.

## Check yourself

### Q: Your mock-based test passes, but in production the loop runs forever on one task. What is the most likely gap?
- A: The mock is too slow
- B: No scripted case where the model never stops calling tools
- C: The mock deep-copies requests

<details><summary>Answer</summary>

**B** — the mock only tests paths you scripted. Script a model that keeps calling
tools, and assert the harness enforces a turn limit.

</details>

### Q: Why does the mock throw when its script runs out, instead of returning an empty reply?
- A: To save memory
- B: So an unexpected extra turn fails the test loudly
- C: Because the API does the same

<details><summary>Answer</summary>

**B** — an empty reply would end the loop "successfully" and hide the bug.

</details>

## On paper

Notebook exercise **2.1**: write the reply script for a test of runaway tool calls.

**Next:** [05 — Assert on what was sent](05-assert-on-what-was-sent.md)

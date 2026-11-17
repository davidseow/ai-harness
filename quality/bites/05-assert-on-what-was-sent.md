# 05 — Assert on what was sent

**~4 min · M2 Testing the harness · builds on lessons 03 and 09**

> **In one line:** Context is the only state, so the strongest harness test checks
> the request, not the answer.

## The idea

Lesson 03: the model knows exactly what is in the request and nothing else. So most
"the agent forgot" bugs are visible *before* the model is involved: the fact was
not in the request. With a recorded request log you can turn that into an
assertion.

Four request-level invariants worth testing in almost any harness:

| Invariant | Assertion |
|---|---|
| Fact retention | a pinned fact appears in **every** request |
| Budget | no request exceeds N tokens |
| Prefix stability | `tools` + `system` are byte-identical across turns (cache, lesson 08) |
| Pairing | every `tool_use` id has exactly one matching `tool_result` |

## Example

Stage 4 already does the first one. Its proof section, from
[`stage4-context.ts`](../../build/src/stage4-context.ts):

```ts
const sawSecret = requests.map((r) =>
  JSON.stringify(r).includes(SECRET));
```

One boolean per turn. The transcript shows the key present early and absent from
turn 4. As a test, you would flip it: assert `sawSecret.every(Boolean)`, watch it
fail, then fix compaction (or move the fact into memory, lesson 21) until it passes.

**Why this beats checking the answer:** an answer can be right by luck (the model
guessed) or wrong for unrelated reasons. The request is the cause; the answer is a
noisy symptom.

## Check yourself

### Q: Caching suddenly stops working after a refactor. Which invariant would have caught it?
- A: Fact retention
- B: Prefix stability
- C: Pairing

<details><summary>Answer</summary>

**B** — caching is a prefix match. Something volatile (a timestamp, a reordered
tool list) crept into `tools` or `system`.

</details>

### Q: Why test `tool_use`/`tool_result` pairing?
- A: Real APIs reject a request with an unanswered tool call, and compaction can split a pair
- B: It makes requests smaller
- C: It is a style rule

<details><summary>Answer</summary>

**A** — dropping half a pair during compaction or truncation is a classic harness
bug, and it surfaces as an API error mid-session.

</details>

## On paper

Notebook exercise **2.2**: write the four invariants as plain-English test names for
stage 4.

**Next:** [06 — Golden transcripts and their trap](06-golden-transcripts.md)

# 07 — Stage 2: tools, errors, and parallelism

**~5 min · reading only · prerequisite: 06**

> **In one line:** A tool is a schema the model reads and an implementation it
> cannot touch, and the gap between them is where every safety property lives.

## The idea

Replace stage 1's stub with real tools and three rules become load-bearing.

**Rule 1 — the schema is prompt.** The model picks a tool by reading its name,
description and parameter names. There is no other signal. A vague description is a
prompt bug that presents as a model failure. And you pay for it: stage 2's five
tools cost **~376 tokens on every single turn**, before the conversation says
anything.

**Rule 2 — failures are results, not exceptions.** A tool that throws ends the run.
A tool that returns `{is_error: true, content: "..."}` hands the model something to
read and recover from. This one choice is the difference between an agent that
adapts and one that dies on the first typo.

**Rule 3 — parallel results go back in one message.** One assistant turn can carry
several `tool_use` blocks. All their results belong in a **single** user message.
Splitting them across several is accepted by the API and quietly teaches the model
to stop calling tools in parallel — a slow, invisible regression in how fast your
agent works.

## Walk through it

Real output from
[`build/transcripts/stage2-tools.txt`](../build/transcripts/stage2-tools.txt):

```
  › registry exposes 5 tools: read, write, edit, bash, ls

  › those schemas cost ~376 tokens on EVERY turn -- tool descriptions are prompt you pay rent on.

━━━ TURN 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → SENT   ~418 tok  ·  1 messages
  ← GOT    stop_reason=tool_use
          [assistant] Let me look at both files.
          [assistant] → read({"path":"notes.md"})
          [assistant] → read({"path":"config.json"})
  ✓ read   ← # Notes↵↵ship the thing↵ship the thing↵
  ✓ read   ← {"retries": 3}↵

━━━ TURN 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → SENT   ~526 tok  ·  3 messages
  ← GOT    stop_reason=tool_use
          [assistant] → edit({"path":"notes.md","old":"ship the thing","new":"ship it"})
  ✗ edit   ← ERROR string appears 2 times in notes.md; must be unique

━━━ TURN 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → SENT   ~599 tok  ·  5 messages
  ← GOT    stop_reason=tool_use
          [assistant] → edit({"path":"notes.md","old":"# Notes","new":"# Release notes"})
  ✓ edit   ← edited notes.md
```

Turn 1 is rule 3: two reads in one assistant turn, both results returned together.
Turns 2 and 3 are rule 2: the edit failed, the error came back as **data**, and the
agent chose a unique anchor and succeeded. Nothing threw. The run continued.

Here is the implementation doing the refusing:

```ts
const hits = before.split(old).length - 1;
// Refusing an ambiguous edit is the whole reason `edit` exists as a tool
// rather than as a `sed` call through bash: the harness can enforce an
// invariant that an opaque shell string cannot express.
if (hits === 0) throw new Error(`string not found in ${input.path}`);
if (hits > 1) throw new Error(`string appears ${hits} times in ${input.path}; must be unique`);
```

It throws locally; the loop catches it and converts it into a `tool_result`. That
is the pattern — write tools that throw, and centralise the conversion:

```ts
} catch (error) {
  // A failed tool is not an exception to propagate -- it is information the
  // model needs in order to try something else.
  result = { type: "tool_result", tool_use_id: call.id,
             content: error instanceof Error ? error.message : String(error),
             is_error: true };
}
```

## bash versus dedicated tools

`edit` could have been `bash -c "sed -i ..."`. The reason it is not is the whole
argument in miniature. A dedicated tool arrives with **typed arguments the harness
can inspect**; `bash` arrives as one opaque string. That difference decides four
things:

| You want to… | Dedicated tool | bash |
|---|---|---|
| gate an action precisely | yes, on typed args | only by pattern-matching a string |
| enforce an invariant (unique anchor, staleness check) | yes | no |
| render it specially in a UI | yes | no |
| know it is safe to run in parallel | yes, declared | no — must serialise everything |

**The heuristic: start with bash for breadth, promote to a dedicated tool when you
need to gate, enforce, render, or parallelise.** Lesson 10 shows what happens when
you try to gate bash instead.

## The trap

**Tool sprawl.** Every tool is permanent context (376 tokens for five). Thirty
tools is ~2,300 tokens on every turn of every session, plus a harder choice for the
model on each one. Overlapping tools are worse than missing ones: if `read`,
`view_file` and `cat_file` all exist, the model will pick inconsistently and you
will blame the model.

## Read this

- **[`build/src/shared/tools.ts`](../build/src/shared/tools.ts)** — five tools,
  schema and implementation adjacent. Read `edit` and `bash` back to back; the
  contrast is the lesson.
- **Anthropic, tool use** —
  `https://docs.anthropic.com/en/docs/build-with-claude/tool-use`. The
  `tool_result` / `is_error` / parallel sections, which are exactly rules 2 and 3.

## Teach it

**The analogy.** A tool description is the label on a jar in someone else's
kitchen. They will not open it to check. Label it badly and they use the wrong one
confidently.

**The question to open with.** *"Your agent's file edit fails. Should the tool
throw, or return the error?"* Both sound reasonable for about ten seconds, until
someone points out that throwing ends the run.

**The 60-second version.** Schema is prompt and costs tokens every turn.
Failures come back as results so the agent can recover. Parallel results go back in
one message or the model stops parallelising. And promote an action out of bash the
moment you need to gate, enforce, render, or parallelise it.

---
*Sources: [`build/transcripts/stage2-tools.txt`](../build/transcripts/stage2-tools.txt) · captured 2026-08-31*

**Next:** [08 — Stage 3: the system prompt is rent](08-stage3-prompt.md)

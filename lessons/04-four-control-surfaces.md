# 04 — The four control surfaces

**~4 min · reading only · prerequisite: 03**

> **In one line:** You have exactly four ways to influence an agent, they have very
> different strengths, and three of them are only advice.

## The idea

Everything you can change about how an agent behaves goes through one of four
surfaces. Knowing which one owns a problem saves an enormous amount of thrashing.

| Surface | What it is | Strength | Cost |
|---|---|---|---|
| **System prompt** | instructions ahead of the conversation | broad, sets defaults and tone | re-sent every turn |
| **Tool definitions** | names, descriptions, schemas | strongest lever on *what it does* | re-sent every turn |
| **Message history** | the conversation, incl. tool results | the actual working memory | grows without bound |
| **Sampling params** | model, thinking, effort, temperature | changes how hard it thinks | latency and price |

And then there is the thing that is *not* a surface — the harness code itself:
the loop, the gates, the truncation rules. That is the only place where anything
is **enforced**. The four surfaces above are all, in the end, persuasion.

That distinction is worth stating sharply: **a system prompt is not a security
control.** "Never delete files without asking" is a request. The gate in lesson 10
is a fact. Teams routinely put safety properties on the wrong side of that line.

## The under-rated surface

Most people reach for the system prompt first. **Tool definitions are usually the
better lever**, for a simple reason: the model reads them at the moment of
deciding, and they are attached to the action rather than floating in a preamble.

Take a real example from the build track. The `edit` tool's description is:

> *Replace an exact string in a file. Fails if the string is absent or appears
> more than once.*

That sentence does more work than a paragraph of prompt about being careful with
edits, because it tells the model the failure mode at the exact instant it is
choosing an argument. And when the model gets it wrong anyway, the *implementation*
refuses — which no amount of description can do.

Same for parameter names. A field called `path` gets a path. A field called `p`
gets a coin flip. Schemas are prompt, and they are prompt at the best possible
moment.

## Walk through it

Stage 2 shows both halves of a tool working together — the description setting an
expectation, the implementation enforcing it
([`stage2-tools.txt`](../build/transcripts/stage2-tools.txt)):

```
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

The description said ambiguity would fail. The implementation made it fail. The
error came back as data, so the agent chose a unique anchor and succeeded. Three
surfaces cooperating — schema, code, and message history — and none of them a
system prompt.

## In the wild

pi exposes the tool surface as a runtime allowlist: `--tools`, `--exclude-tools`,
`--no-builtin-tools`, `--no-tools`
([`excerpts.md` §4](../reading/excerpts.md)). Changing which tools exist is
treated as a first-class way to change agent behaviour — because it is one.
Running with `-t read,grep,find` is a far stronger "don't modify anything" than
any sentence you could write in a prompt.

## The trap

Reaching for the system prompt for everything. It is the most visible surface and
the weakest per token: it is far from the point of decision, it competes with
everything else in the preamble, and it is charged on every turn forever
(lesson 8 puts numbers on that). When the problem is "it picks the wrong tool",
the fix is nearly always in the tool description, not the prompt.

## Read this

- **[`build/src/shared/tools.ts`](../build/src/shared/tools.ts)** — five tools,
  each with its description and implementation side by side. Read two of them and
  the schema-as-prompt idea stops being abstract.
- **[`reading/excerpts.md` §4](../reading/excerpts.md)** — pi's tool options.
  Note that the tool set is runtime-configurable, and that this changes the cached
  prefix (lesson 21).

## Teach it

**The analogy.** The system prompt is the employee handbook. Tool definitions are
the labels on the actual buttons. When someone presses the wrong button, you do
not rewrite the handbook — you relabel the button.

**The question to open with.** *"An agent keeps using `bash cat` instead of your
`read` tool. Where's the bug?"* Almost everyone says the prompt. It is nearly
always the tool description — or the fact that `bash` can do the job and is
described more attractively.

**The 60-second version.** Four surfaces: prompt, tools, history, sampling. Tools
are the most under-used and the most effective, because the model reads them at the
moment of choosing. And none of the four *enforces* anything — enforcement lives in
harness code, which is lesson 10.

---
*Sources: [`build/transcripts/stage2-tools.txt`](../build/transcripts/stage2-tools.txt) · [`reading/excerpts.md`](../reading/excerpts.md) §4 · verified 2026-08-31*

**Next:** [05 — Who supplies the harness, who supplies the deployment](05-build-or-buy.md)

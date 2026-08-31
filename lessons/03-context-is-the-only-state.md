# 03 — Context is the only state

**~4 min · reading only · prerequisite: 02**

> **In one line:** The request is rebuilt from nothing every turn, so anything the
> harness does not put back does not exist.

## The idea

This is the load-bearing lesson. Everything in modules 3 and 4 is a consequence of
it.

There is no conversation living on the provider's servers. There is no session the
model is attached to. Each call is independent, and the illusion of continuity is
manufactured entirely by the harness re-sending the whole history every time. In
lesson 2's transcript you watched it happen: 91 tokens, then 156, then 219.

Three consequences follow immediately, and they explain most agent behaviour that
people find mysterious:

**1. Memory is a budget, not a fact.** The context window is a hard ceiling. A long
run *will* approach it, and something will have to be dropped. The only question
is whether you chose what, or whether it happened to you (lesson 9).

**2. Cost is quadratic-ish in turns.** Turn *n* re-sends everything from turns 1 to
*n−1*. A 40-turn session does not cost 40 requests' worth of input tokens; it costs
roughly the sum of a growing series. This is why "how many turns" is a better
question than "how many tokens", and why prompt caching matters so much (lesson 21).

**3. Anything in context is in context *forever*.** A secret that lands in a tool
result on turn 2 is re-sent on turns 3, 4, 5 and every turn after, is written to
the session log, and is fed to the summariser during compaction. There is no
"un-see". The only place to intercept it is *before* it enters — which is why
stage 7's redaction hooks `tool_result` rather than cleaning up afterwards.

## Walk through it

The mock provider in the build track records every request it receives, which
makes this checkable rather than assertable. Summarising the SENT lines from
[`stage1-loop.txt`](../build/transcripts/stage1-loop.txt):

| Turn | Request size | Messages |
|---|---|---|
| 1 | ~91 tok | 1 |
| 2 | ~156 tok | 3 |
| 3 | ~219 tok | 5 |

And here is the turn-3 payload verbatim — everything, again:

```
          [user] Echo 'hello harness', then echo 'second time'.
          [assistant] Sure, echoing that now.
          [assistant] → echo({"text":"hello harness"})
          [user] ← hello harness
          [assistant] And once more.
          [assistant] → echo({"text":"second time"})
          [user] ← second time
```

Now the version that actually costs money. Stage 2 adds five real tools, and the
tool *schemas* are part of every request too
([`stage2-tools.txt`](../build/transcripts/stage2-tools.txt)):

```
  › registry exposes 5 tools: read, write, edit, bash, ls

  › those schemas cost ~376 tokens on EVERY turn -- tool descriptions are prompt you pay rent on.
```

376 tokens for five tools, before the conversation has said anything. Thirty tools
would be ~2,300 tokens on every turn of every session — which is the real argument
for tool search and deferred loading (lesson 21), and it is an argument about
context, not tidiness.

## In the wild

pi's docs describe compaction and then add one sentence that only makes sense in
light of this lesson: *"Compaction is lossy. The full history remains in the JSONL
file"* ([`excerpts.md` §6](../reading/excerpts.md)). Two different records — a
lossy one the model sees, a lossless one on disk. Once you know context is the
only state, that split stops looking like an implementation detail and starts
looking like the central design decision it is.

## The trap

Believing the model "knows" something because you told it once, twenty turns ago.
It knows what is in the current request. If a compaction ran in between, the fact
may be gone — and critically, **the model has no way to know it is missing**, so
it will not ask. It will infer. Lesson 9 shows this happening with the receipts.

## Read this

- **[`reading/excerpts.md` §6](../reading/excerpts.md)** — pi's compaction section.
  Four sentences. The last one is the one that matters.
- **Anthropic, prompt caching** —
  `https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching`. Read it
  for one idea: caching is a **prefix match**, rendered `tools` → `system` →
  `messages`. Given consequence 2 above, that is the single biggest cost lever
  you have.

## Teach it

**The analogy.** A colleague with no short-term memory who is handed a complete
written transcript before every sentence they speak. They are not remembering —
they are re-reading. Shorten the transcript and they genuinely do not know what
was cut. They do not experience a gap.

**The question to open with.** *"If I tell an agent a password on turn 1, how many
times does that password get sent to the API over a 30-turn session?"* The answer —
thirty — reframes both the security conversation and the cost conversation in one
move.

**The 60-second version.** Nothing persists. Every turn ships the whole history
again. So memory is a budget you manage, cost grows with the square of the
conversation, and anything that enters the context is there for the rest of the
run. Every technique in this course is a way of choosing what occupies that space.

---
*Sources: [`build/transcripts/`](../build/transcripts/) · [`reading/excerpts.md`](../reading/excerpts.md) §6 · verified 2026-08-31*

**Next:** [04 — The four control surfaces](04-four-control-surfaces.md)

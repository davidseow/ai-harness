# 21 — Design heuristics and evaluating a harness

**~5 min · reading only · prerequisite: 20**

> **In one line:** Four heuristics for building one, one table for choosing one, and
> a reminder that without an eval every change is an opinion.

## Four heuristics

**1. Start with bash; promote when you need to gate, enforce, render, or
parallelise.** Bash gives breadth cheaply. A dedicated tool gives the harness typed
arguments it can inspect — which is what makes precise gating, invariants like
staleness checks, custom rendering, and parallel-safety declarations possible
(lessons 7 and 10). Promote for a reason, not for tidiness.

**2. Keep the fixed context small; load detail on demand.** Tool schemas and the
system prompt are re-sent every turn (~376 tokens for five tools; lesson 7). Two
patterns push against this. **Tool search / deferred loading** keeps schemas out of
the prompt until relevant — and crucially *appends* rather than swapping, so the
cached prefix survives. **Skills** keep a one-line description in context and load
the body only when the task calls for it. Both are the same move: pay for breadth
only when you use it.

**3. Know which context tool you are reaching for.** Three different jobs, routinely
conflated:

| Tool | Does | Use when |
|---|---|---|
| Truncation / context editing | shortens or clears stale values | results are large, history is noisy |
| Compaction | replaces history with a summary | approaching the window limit |
| Memory / files | persists outside the context | facts must survive the session |

Compaction is lossy and silent (lesson 9). If a fact must survive, it belongs in
memory or a file, not in a summary you hope preserves it.

**4. Treat caching as prefix discipline.** Caching is a prefix match, rendered
`tools` → `system` → `messages`. So: freeze the stable prefix, put volatile content
last, and never edit the system prompt mid-session — append to messages instead
(lesson 8). Three corollaries worth memorising, because each has a workaround:

- changing tools mid-session invalidates → use tool search, which appends
- switching models mid-session invalidates → keep the main loop on one model and
  delegate to a subagent for cheap sub-tasks
- editing `system` mid-session invalidates → append an operator message instead

## pi.dev versus Claude Code

Two harnesses in the same quadrant — you host, they supply the harness — that
disagree about almost everything else.

| | **pi.dev** | **Claude Code** |
|---|---|---|
| Core philosophy | minimal core, aggressive extensibility | batteries included |
| Built-in tools | 8 (`read` `bash` `powershell` `edit` `write` `grep` `find` `ls`) | a larger set, plus web and task tools |
| Permissions | **none in-process** — "run in a container" | permission modes, allowlists, per-call prompts |
| Subagents | refused — "spawn pi instances via tmux" | built in |
| Plan mode | refused — "write plans to files" | built in |
| MCP | refused — "build CLI tools with READMEs" | supported |
| To-dos | refused — "they confuse models" | built in |
| Extension model | ~30 lifecycle events, TS modules, pi packages | hooks, skills, subagents, MCP servers |
| Sessions | JSONL tree, `/tree` `/fork` `/clone` | sessions with resume |
| Trust boundary | project trust prompt + container | permission modes + trust prompt |

The disagreement is not about quality. It is a bet about **who is more likely to be
right about your workflow — you or the tool's authors.** pi bets on you and charges
you the setup. Claude Code bets on good defaults and charges you the times they are
wrong. Both bets pay off for different teams, and the useful thing is to know which
you are making.

## How to evaluate a harness

In this order — the ordering is the advice:

1. **Read the event list before the feature list.** It predicts what you can fix
   later (lesson 15). Count interceptors (*can block*, *can modify*), not events.
2. **Ask where the security boundary is.** In-process gate, container, or nothing?
   All three are answers; "the system prompt" is not.
3. **Find out what happens on a long session.** When does compaction fire? Can you
   control what it keeps? Is the full history retained?
4. **Check the tool surface cost.** How many schemas ship by default, and can you
   turn them off? pi's `--tools` / `--no-builtin-tools` is a real answer.
5. **Look for the escape hatch.** `--no-context-files`, `--no-extensions`,
   `--no-tools`. A harness that cannot be run stripped down is hard to debug.

## What to measure

Once it is running, the useful metrics are not token counts:

- **Turns to completion** — turns drive cost superlinearly (lesson 3) and are the
  best single proxy for how well the agent is oriented.
- **Cost per completed task**, not per request. A cheaper request that needs three
  more turns is not cheaper.
- **Recovery rate** — how often does it get past a failed tool call instead of
  stalling? Lesson 7's error-as-result design is what this measures.
- **Intervention rate** — how often does a human have to step in?

And the thing that makes all of it meaningful: **an eval on real tasks.** Without
one, every prompt tweak is an opinion, and you will remember your successes. Stage 3
can tell you what a heavier prompt *costs*; only an eval tells you whether it is
worth it.

## Read this

- **[`reference/harness-comparison.md`](../reference/harness-comparison.md)** — the
  table above with the four build-or-buy positions from lesson 5.
- **[`reading/bibliography.md`](../reading/bibliography.md)** — where to go next,
  annotated with what to skip.
- **[`teaching/`](../teaching/)** — the slide outline, the paper exercises, and the
  diagrams, if you are taking this to a room.

## Teach it

**The analogy.** Choosing a harness is choosing a kitchen, not a knife. What matters
is not the tools in the drawer but whether you can move the counter when you find
out you cook differently than the designer assumed.

**The question to close on.** *"What would you have to change about your agent next
quarter — and could you?"* That single question compresses the whole course, and it
is the one people actually take away.

**The 60-second version.** Bash for breadth, promote to gate. Keep the fixed context
small and load on demand. Know whether you need truncation, compaction, or memory.
Treat caching as prefix discipline. Choose a harness by its interceptors, not its
features. Measure turns and cost per completed task. And get an eval, because
without one you are guessing confidently.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §1, §4 · verified 2026-08-31*

**End of the course.** The [reference/](../reference/) directory is the part you
will come back to; [teaching/](../teaching/) is the part you hand to someone else.

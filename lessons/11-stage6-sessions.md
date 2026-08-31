# 11 — Stage 6: sessions, resume, and fork

**~4 min · reading only · prerequisite: 10**

> **In one line:** Write the run down in an append-only log and you get resume and
> fork for free — and fork is worth more than most prompt improvements.

## The idea

Everything so far lived in a variable. Kill the process and the agent never
existed. A session log fixes that, and the format is not arbitrary: **append-only
JSONL**, one JSON object per line.

- **Append-only** — a crash mid-turn loses at most the last line.
- **Line-oriented** — you can `tail` it, `grep` it, and replay a *prefix* of it
  without parsing the whole file.

That last property is the interesting one, because it gives you two capabilities
that feel like features and are really just consequences of having written things
down:

**Resume** — replay the log into `messages` and carry on.
**Fork** — replay only a *prefix* and go a different way.

And it resolves the tension from lesson 9. Compaction makes the *context* lossy.
The *log* is lossless. Two records, different jobs.

## Walk through it

Real output from
[`build/transcripts/stage6-sessions.txt`](../build/transcripts/stage6-sessions.txt):

```
         THE LOG ON DISK (one JSON object per line)
         ─────────────────────────────────────────────────────────
         seq=1 parent=- message   What port does app.ts use?
         seq=2 parent=1 message   → read({"path":"app.ts"})
         seq=3 parent=2 message   ← const PORT = 3000↵
         seq=4 parent=3 message   The port is 3000.

  › reopened the file in a fresh object: 4 messages replayed from disk.

  › run 2 continued the SAME conversation across a process boundary (1 turn).

  › forked at seq=1 into branch.jsonl (1 entries kept).

  › the branch went a different way in 2 turns, from the same prefix.
```

The `parent` field is what makes this a **tree** rather than a list. Two runs can
share a prefix and diverge, and both paths remain.

## Why fork matters more than it sounds

Agents do not fail abruptly. They drift — a wrong assumption on turn 6 quietly
shapes turns 7 through 20. By the time it is obvious, the context is full of
reasoning built on the bad assumption, and *telling* the agent it was wrong rarely
helps: the wrong reasoning is still sitting there in the history, being re-sent
every turn (lesson 3).

Rewinding to turn 5 and re-asking with better wording removes the bad reasoning
entirely. In practice this is the single highest-leverage move available when an
agent goes off the rails, and it is only possible if the harness wrote history
down. Evaluate harnesses on whether they let you do it.

Note also what fork is **not**: an undo. Nothing is deleted. The abandoned branch
stays in the file, which is exactly why you can go back to it.

## A small bug worth showing

The first version of stage 6 logged messages via the loop's `onMessage` hook — which
only fires for messages the loop *appends*. The opening user message was seeded
before the loop started, so it never reached the log. The replayed conversation then
began with an assistant turn, which is malformed.

Nothing errored. The transcript looked fine. It would have surfaced later as an
inexplicable API rejection on resume. The fix is a comment as much as a line:

```ts
// Log the opening user message BEFORE the loop runs. The loop's onMessage hook
// only sees messages the loop itself appends, so a seed message that is not
// recorded here vanishes -- and a replayed conversation that starts with an
// assistant turn is malformed. Small bug, silent until you resume.
```

**Test resume, not just logging.** "The file has lines in it" is not the property
you want; "replaying the file produces a valid conversation" is.

## In the wild

pi's implementation is the same design, at production scale:

> *"Sessions are stored as JSONL files with a tree structure. Each entry has an
> `id` and `parentId`, enabling in-place branching without creating new files."*
> — [`excerpts.md` §5](../reading/excerpts.md)

Note *without creating new files*: pi keeps branches inside one session file and
navigates them with `/tree`, while `/fork` and `/clone` produce new files. Sessions
auto-save to `~/.pi/agent/sessions/`, organised by working directory.

Read that alongside the compaction line from lesson 9 — *"the full history remains
in the JSONL file; use `/tree` to revisit"* — and the two features are revealed as
one design: **lossy in context, lossless on disk, navigable after the fact.**

## The trap

Treating the log as a debug artifact. It is the only complete record of what your
agent did — the context is not, because it was compacted. If you need to answer
"what did it actually do?" after an incident, the log is where the answer lives, so
it needs to be retained, and it needs to be treated as sensitive (everything the
agent saw is in it, including whatever leaked into a tool result).

## Read this

- **[`reading/excerpts.md` §5–6](../reading/excerpts.md)** — pi's session and
  compaction sections together. They are the same idea from two directions.
- **[`build/src/shared/session.ts`](../build/src/shared/session.ts)** — append,
  replay, and fork in ~90 lines. `fork()` is six lines, which is the point.

## Teach it

**The analogy.** Git for conversations. Append-only history, branches from any
point, nothing destroyed. `/fork` is `git checkout -b` from an earlier commit.

**The question to open with.** *"Your agent went wrong at turn 6 and you noticed at
turn 20. What do you do?"* Most people say "tell it it was wrong". Then ask what is
still in the context — and the case for rewinding makes itself.

**The 60-second version.** Append-only JSONL, one object per line, each with a
parent — so history is a tree. Replay it all to resume; replay a prefix to fork.
Fork is the best recovery tool you have, because it removes bad reasoning instead
of arguing with it. And the log is lossless where the context is not.

---
*Sources: [`build/transcripts/stage6-sessions.txt`](../build/transcripts/stage6-sessions.txt) · [`reading/excerpts.md`](../reading/excerpts.md) §5 · verified 2026-08-31*

**Next:** [12 — Stage 7: extensions](12-stage7-extensions.md)

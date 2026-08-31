# 16 — pi's sessions and compaction

**~4 min · reading only · prerequisite: 15**

> **In one line:** Lossy in context, lossless on disk, navigable after the fact —
> one design, described in two places in pi's docs.

## The idea

Lessons 9 and 11 built both halves separately. pi ships them as one system, and the
sentence that joins them is in the compaction section
([`excerpts.md` §6](../reading/excerpts.md)):

> Compaction is lossy. The full history remains in the JSONL file; use `/tree` to
> revisit.

Two records with different jobs:

| | Context | Session file |
|---|---|---|
| Contains | what the model can see now | everything that ever happened |
| Lossy? | yes — compaction, truncation | no |
| Bounded? | by the context window | by disk |
| Purpose | make the next turn work | audit, resume, fork |

Once you see it this way, compaction stops being damage and becomes a **projection**
— a lossy view over a lossless log, recomputed as needed. And the projection being
lossy is fine *precisely because* the log is not.

## The storage model

> Sessions are stored as JSONL files with a tree structure. Each entry has an `id`
> and `parentId`, enabling in-place branching without creating new files.
> — [`excerpts.md` §5](../reading/excerpts.md)

Sessions auto-save to `~/.pi/agent/sessions/`, organised by working directory. Note
*in-place branching*: pi keeps branches **inside one file** and walks them with
`/tree`, rather than copying. Stage 6 used the same `parent` pointer
([`stage6-sessions.txt`](../build/transcripts/stage6-sessions.txt)):

```
         seq=1 parent=- message   What port does app.ts use?
         seq=2 parent=1 message   → read({"path":"app.ts"})
         seq=3 parent=2 message   ← const PORT = 3000↵
         seq=4 parent=3 message   The port is 3000.
```

## Three verbs, deliberately distinct

pi separates operations that are easy to conflate
([`excerpts.md` §5](../reading/excerpts.md)):

- **`/tree`** — navigate the session tree *in place*. Select any previous point,
  continue from there, switch between branches. All history stays in one file.
- **`/fork`** — create a **new session file** from a previous user message on the
  active branch, with that prompt placed in the editor for modification.
- **`/clone`** — duplicate the current active branch into a new file at the current
  position.

The distinction that matters: `/tree` reorganises where you are *within* a session;
`/fork` and `/clone` produce new sessions. Branch inside when you are exploring;
fork out when the branch is going to have a life of its own.

`/fork` putting the old prompt **in the editor** is a small, telling detail. The
common repair is not "go back to turn 6", it is "go back to turn 6 and ask
*better*" — so the tool assumes you want to edit, which is the right assumption.

## Compaction, as pi runs it

> **Automatic:** Enabled by default. Triggers on context overflow (recovers and
> retries) or when approaching the limit (proactive).

Two triggers worth separating. **Proactive** compaction runs before you hit the
wall. **Reactive** compaction runs *after a request has already failed* — it
recovers and retries. That recovery path is the difference between a long session
that degrades and one that dies, and it is the kind of thing you only find out you
needed at 3am.

`/compact <custom instructions>` lets you steer the summary, and
`session_before_compact` lets an extension cancel or customise it (lesson 15).
That hook is where the pinned-facts fix from lesson 9 belongs.

## The trap

**Assuming the log is disposable.** It is the only complete record — the context
was compacted. So:

- **It is your audit trail.** "What did the agent actually do?" is answerable only
  here.
- **It is sensitive.** Everything the agent saw is in it: file contents, command
  output, whatever leaked into a tool result. The redaction hook from lesson 12
  matters partly because it keeps secrets out of *this file*, not just out of the
  model.
- **It is organised by working directory**, so it accumulates quietly, per project,
  for as long as you leave it.

## Read this

- **[`reading/excerpts.md` §5–6](../reading/excerpts.md)** — sessions and compaction
  together. Reading them as one design is the point of this lesson.
- **[`build/src/shared/session.ts`](../build/src/shared/session.ts)** — the same
  model, small enough to hold in your head. `fork()` is six lines.

## Teach it

**The analogy.** A photograph of a filing cabinet. The photo is what you carry
around; the cabinet is what you go back to. Compaction takes a new photo. Nobody
burns the cabinet.

**The question to open with.** *"If compaction is lossy, why is it safe?"* The
answer — because the lossless copy is still on disk — is the entire design in one
sentence, and it only works if you built the log first.

**The 60-second version.** Context is lossy; the JSONL log is not. Entries carry a
parent, so history is a tree. `/tree` navigates in place, `/fork` and `/clone` make
new sessions. Compaction runs proactively *and* as recovery after an overflow. And
the log is both your audit trail and a file full of everything the agent ever saw.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §5–6 · [`build/transcripts/stage6-sessions.txt`](../build/transcripts/stage6-sessions.txt) · verified 2026-08-31*

**Next:** [17 — pi's trust model](17-pi-trust.md)

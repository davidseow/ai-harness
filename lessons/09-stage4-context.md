# 09 — Stage 4: compaction, and the amnesia it causes

**~5 min · reading only · prerequisite: 08**

> **In one line:** Compaction is how agents forget things they were explicitly
> told, and nothing anywhere raises an error when it happens.

## The idea

Context grows every turn (lesson 3) and the window is finite, so something must
give. Two different operations do the giving, and conflating them causes real bugs.

**Truncation** shortens one oversized value — almost always a tool result. Local,
cheap, and safe *if you label the cut*. An unlabelled truncation is dangerous
because the model cannot tell it saw a fragment, and will reason confidently about
a file it only half read.

**Compaction** deletes a span of history and puts a summary in its place. Lossy by
construction. This is where agents forget.

The failure mode deserves its own name because it is so unlike a normal bug:
**the agent does not know it forgot.** There is no gap to notice — the summary
reads as a complete account of the past. So it does not ask. It infers, or it
invents. And no error is raised at any layer.

## Walk through it

Stage 4 runs an agent that is told a deploy key **once**, on turn 1, then does
enough work to trigger compaction. Real output from
[`build/transcripts/stage4-context.txt`](../build/transcripts/stage4-context.txt):

```
━━━ TURN 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  → SENT   ~414 tok  ·  1 messages
  ✂ truncated tool result: 3979 → 390 chars

━━━ TURN 4 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⟲ COMPACTED  7 → 5 messages (284 → 145 tok)
     summary written: "The assistant ran: read. Investigation of the server log is in progress."
  → SENT   ~527 tok  ·  5 messages
```

And then the part that makes this checkable rather than merely asserted — the stage
searches **the requests that actually went on the wire** for the secret:

```
         turn   was the deploy key still in the request?
         ──────────────────────────────────────────────
            1   yes
            2   yes
            3   yes
            4   NO — it is gone
            5   NO — it is gone

  › The user stated the deploy key on turn 1. From turn 4 it is not in the request at all.
```

The summariser was not badly written. It faithfully recorded **what was done**:
*"The assistant ran: read."* What it dropped was **what was said** — and user-stated
facts are exactly the category that gets lost, because summarisers are naturally
drawn to actions.

## Why a better summariser is not the fix

The instinct is to improve the prompt that writes the summary. That helps at the
margin and does not solve it, because the summariser cannot know which facts will
matter later. Ask for "everything important" and you have not compacted anything.

The actual fix is structural: **decide explicitly which facts are pinned**, keep
them outside the compactable region, and *test that they survive*. The stage says
this in its own output:

```
  › The fix is not a better summariser. It is to decide, explicitly, which facts are
    pinned and must survive every compaction -- and to test that they do.
```

A pinned-facts test is three lines and catches an entire class of production
incident: compact a synthetic session, then assert the fact is still there.

## One implementation detail that will bite you

You cannot cut history at an arbitrary point. An assistant `tool_use` block and its
matching `tool_result` must survive **together** or the next request is malformed.
So the cut point has to be walked back to a safe boundary:

```ts
/**
 * A cut at index k is clean if messages[k] does not begin with a tool_result
 * whose tool_use we are about to drop.
 */
function isCleanBoundary(message: Message | undefined): boolean {
  if (!message) return false;
  if (message.role === "assistant") return true;
  return !message.content.some((b) => b.type === "tool_result");
}
```

I got this wrong on the first attempt — an earlier version accepted only user-text
messages as boundaries, so after turn 1 the only valid cut point was index 0 and
compaction silently never fired. It looked like it worked. That is the shape of
context bugs generally: they do nothing visible.

## In the wild

pi's docs state the design in one line: *"Compaction is lossy. The full history
remains in the JSONL file; use `/tree` to revisit."*
([`excerpts.md` §6](../reading/excerpts.md)). **Lossy in context, lossless on
disk.** Compaction is a projection, not a delete — which is what makes stage 6's
fork possible, and what makes an audit after the fact possible.

pi also compacts automatically by default, triggering both on overflow (recover and
retry) and proactively near the limit. Worth knowing: on a long session, this
*will* run whether you thought about it or not.

## The trap

Assuming a fact stated once is a fact retained. If something must survive — a
ticket number, a deploy key, a constraint the user gave you — pin it, restate it,
or store it outside the context entirely. Do not trust that a summariser valued it.

## Read this

- **[`reading/excerpts.md` §6](../reading/excerpts.md)** — pi's compaction section
  in full. Four sentences, and the last is the design.
- **[`build/src/shared/context.ts`](../build/src/shared/context.ts)** — truncation
  and compaction in ~80 commented lines, including the boundary rule above.

## Teach it

**The analogy.** Someone summarises a four-hour meeting into five bullet points.
The bullets are accurate. The room number you will need tomorrow is not in them,
and nobody notices until tomorrow.

**The question to open with.** *"Your agent forgot a constraint you gave it twenty
turns ago. Is that a model problem?"* No. It is a compaction policy, and it is
yours.

**The 60-second version.** Truncation shortens a value — label the cut. Compaction
replaces history with a summary — it is lossy and silent. Summarisers preserve
actions and drop stated facts. So pin what must survive and write a test that
proves it does, because nothing will error when it doesn't.

---
*Sources: [`build/transcripts/stage4-context.txt`](../build/transcripts/stage4-context.txt) · [`reading/excerpts.md`](../reading/excerpts.md) §6 · verified 2026-08-31*

**Next:** [10 — Stage 5: the permission gate](10-stage5-permissions.md)

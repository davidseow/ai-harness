# Slide outline

Two cuts. Both assume a room of engineers who have *used* a coding agent and never
looked inside one.

The material to speak from is the **Teach it** box at the end of each lesson: the
analogy, the opening question, and the 60-second version. Those were written to be
delivered, not read aloud.

---

## The 45-minute session

**Arc:** *the model does nothing → here is the loop → here is what goes wrong →
here is what to do about it.*

### 0. Open with the question (2 min)

> *"When an agent edits a file — what actually wrote the bytes?"*

Let them work it out. Do not answer it. The rest of the session hangs off this
moment, so give it the silence.

### 1. The model is not the agent (5 min) — lesson 01

The consultant in the windowless room. The table of what the harness supplies. Land
one claim: **the same model under two harnesses behaves completely differently, so
when an agent disappoints you the model is the less likely culprit.**

### 2. The loop (8 min) — lesson 02

Draw the five steps on a whiteboard. Then show the stage-1 transcript and point at
the SENT lines: **91 → 156 → 219 tokens.**

Ask: *"How does the model on turn 3 know what happened on turn 1?"*

This is the pivot of the whole session. Do not rush it.

### 3. Context is the only state (7 min) — lesson 03

Three consequences: memory is a budget, cost grows with the square of the
conversation, anything in context is in context forever.

Ask: *"If I tell an agent a password on turn 1, how many times is it sent over 30
turns?"* Thirty. The security conversation and the cost conversation reframe at the
same moment.

### 4. Where it goes wrong (10 min) — lessons 09, 10

Two demonstrations, both with real output:

- **Compaction amnesia.** The turn-by-turn table showing the deploy key present on
  turns 1–3 and gone from turn 4. Emphasise: nothing errored, and the agent cannot
  know.
- **The permission gate.** The BLOCKED lines, then `reports/q3.csv still on disk:
  YES`. Emphasise: the filesystem check is the test; the log line is not.

### 5. Where you get to stand (8 min) — lesson 15

Put pi's lifecycle diagram on screen. Read the parentheticals aloud — *can block*,
*can modify*, *can cancel*. Then take a requirement from the room and ask *"which
hook?"*

If you only get one idea across after the loop, make it this one.

### 6. What to do on Monday (5 min) — lesson 20

The priority list: turn cap, result cap, containment, gate on irreversible actions,
redaction, pinned-facts test. Note that the strongest one — containment — is not
harness code at all.

### 7. Close (2 min)

> *"What would you have to change about your agent next quarter — and could you?"*

---

## The 20-minute cut

Lessons 01, 02, 03, 15. That is the spine, and it survives compression better than
any other subset.

| Min | Content |
|---|---|
| 0–2 | The opening question |
| 2–5 | The model does nothing; the harness does everything |
| 5–12 | The loop, and the growing request (transcript on screen) |
| 12–17 | Context is the only state; the three consequences |
| 17–20 | pi's event list: where you get to stand |

Cut the failure catalogue rather than cutting lesson 3. People who understand
"context is the only state" derive the failures themselves; people who don't will
not retain a list of them.

---

## Delivery notes

**Show real output, always.** Every transcript in this course is genuine captured
output. Say so. A room that suspects the numbers were chosen to make a point stops
listening, and these were not.

**The one correction to make explicitly.** Widely repeated summaries say pi ships
"four tools" and a "sub-1,000-token prompt". Neither appears in pi's docs; the real
tool list is eight. Show the primary source. It teaches source discipline better
than saying "check your sources", and it takes thirty seconds.

**Do not defend a harness.** pi and Claude Code are two coherent bets, not a right
and a wrong answer. The moment it becomes a tool debate you lose the transferable
content.

**Have the exercises ready** ([`exercises.md`](exercises.md)). They need no machine,
which means you can run them in any room, including one where the wifi has failed.

**If you have 90 minutes**, add the build track: walk lessons 06–12 in order with
the transcripts on screen, one stage at a time. Each stage adds one thing and shows
what breaks without it, which is a better structure for a workshop than a talk.

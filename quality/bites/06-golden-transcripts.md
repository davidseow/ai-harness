# 06 — Golden transcripts and their trap

**~4 min · M2 Testing the harness · builds on the build README**

> **In one line:** Snapshot tests catch any change; the trap is that they cannot
> tell a regression from an improvement, and an oracle that reads the program's own
> narration can be fooled by it.

## The idea

This repo runs two golden-output checks, and they are worth studying as a pair:

- **`npm run smoke`** runs each stage and checks its stdout contains (or omits)
  given strings. Stage 5 must print `still on disk: YES` for both reports.
- **`tools/check-transcripts.py`** checks every marked line a lesson quotes exists
  verbatim in `build/transcripts/`.

Both are snapshot tests. Strengths: cheap, catch *any* drift, need no understanding
of the code. Weaknesses:

1. **Volatile fields.** Timestamps, ids and temp paths change every run. Normalise
   them before comparing, or the test is noise.
2. **Approval fatigue.** When a snapshot breaks, the easy fix is to re-record it.
   Re-recording without reading the diff turns the test into a rubber stamp.
3. **Self-reported oracles.** `smoke.ts` says its assertions are "about outcomes,
   not output formatting". They are outcomes *as printed by the stage itself*.
   If stage 5 computed `q3` wrongly, it would print `YES` and pass.

## Example

Point 3 is fixable in two lines: the smoke test could check the workspace on disk
directly instead of trusting the line the stage printed. That is the general
upgrade: **move the oracle out of the system under test.**

## Check yourself

### Q: A snapshot test fails after you improve the prompt. What is the right next step?
- A: Re-record the snapshot
- B: Read the diff, decide if each change is intended, then re-record
- C: Delete the test, it is brittle

<details><summary>Answer</summary>

**B** — the test did its job: it told you something changed. Your job is to judge
it. A is how snapshot suites rot.

</details>

### Q: What makes `smoke`'s stage 5 check weaker than it looks?
- A: It runs offline
- B: The evidence is the stage's own printed claim, not an independent check of the disk
- C: It uses substrings

<details><summary>Answer</summary>

**B** — the oracle lives inside the thing being tested. C is a minor point;
substrings are fine if the source is independent.

</details>

## On paper

Notebook exercise **2.3**: list the volatile fields in a session log line and how
you would normalise each.

**Next:** [07 — Properties, not examples](07-properties-not-examples.md)

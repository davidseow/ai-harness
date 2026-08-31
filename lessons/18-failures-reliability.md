# 18 — How harnesses fail: reliability

**~5 min · reading only · prerequisite: 17**

> **In one line:** Almost every reliability failure is a context or tool-surface
> decision coming back, and almost none of them raise an error.

## The idea

The defining property of harness failures is **silence**. A crash tells you where
to look. These do not: the agent keeps going, produces plausible output, and is
wrong. Below is the catalogue, each with its real cause.

### Context failures

**Context rot.** Over many turns, the history fills with stale tool results, dead
ends and superseded plans. Nothing is *wrong* in it, but the signal-to-noise ratio
falls and the model's attention is spent on irrelevance. *Cause:* nothing ever
removes anything. *Symptom:* quality degrades gradually with conversation length —
which is why "start a fresh session" so often works and feels like superstition.

**Compaction amnesia.** Lesson 9, with receipts: the deploy key was in the request
on turns 1–3 and gone from turn 4, and nothing errored. *Cause:* summarisers keep
actions and drop stated facts. *Symptom:* the agent contradicts a constraint you
gave it and does not know it is doing so.

**Unlabelled truncation.** A tool result is cut to fit and the model is not told.
*Cause:* truncating without a marker. *Symptom:* confident reasoning about a file it
saw a third of. This one is cheap to fix and frequently isn't: label the cut.

**Cache invalidation.** Caching is a prefix match over `tools` → `system` →
`messages`. Edit the system prompt mid-session, or add a tool, and everything after
that point re-bills at full price. *Symptom:* costs several times projections, with
no behavioural change to point at. *Diagnostic:* check whether cache reads are
non-zero across turns; if they are always zero, something in your prefix is moving —
a timestamp, an unsorted JSON blob, a varying tool list.

**Tool-result flooding.** One `bash` call returns 200KB of log output and consumes
most of the window in a single turn. *Cause:* no per-result cap. Stage 4 caps at 400
characters and reports the cut: `✂ truncated tool result: 3979 → 390 chars`.

### Tool-surface failures

**Tool sprawl.** Every tool is permanent context — five cost ~376 tokens per turn
(lesson 7), so thirty cost ~2,300, on every turn of every session. *Symptom:* cost
you cannot attribute, plus worse tool selection as the choice gets harder.

**Overlapping tools.** `read`, `view_file` and `cat_file` all exist. The model picks
inconsistently, and you conclude it is unreliable. It is doing its best with an
ambiguous menu.

**Ambiguous descriptions.** The model chooses by reading the description and nothing
else. *"Search the codebase"* — with grep? semantically? which paths? *Symptom:*
looks like a reasoning failure, is a writing failure.

**Non-idempotent retries.** The agent retries a call it cannot tell succeeded — an
append, a POST, a git push. *Cause:* a tool that is not safe to repeat and does not
say so. *Symptom:* duplicates, discovered later by someone else.

### Loop failures

**Runaway loops.** No turn cap, and the model keeps asking. *Cause:* `while(true)`.
The shared loop returns `stoppedBy: "max_turns"` rather than pretending success —
which matters, because a silent cap is a new failure mode.

**No verification step.** The agent says the tests pass. Nobody ran them. *Cause:*
the harness never required evidence. *Fix:* make verification a tool call whose
result is in the transcript, so "it passed" is checkable rather than asserted.

**Thrown tool errors.** A tool raises, the loop dies, the run is over — instead of
the model reading the error and recovering (lesson 7).

## The pattern underneath

Look at the causes: *nothing removes anything*, *the summariser was not told what
mattered*, *no per-result cap*, *no turn cap*, *no verification required*. Almost
every entry is **an absent policy, not a present bug.** There is no line of code to
fix, because the problem is a decision nobody made.

That is why these survive code review. Nothing looks wrong. The catalogue in
[`reference/pitfalls.md`](../reference/pitfalls.md) is deliberately structured as
questions to ask a design, for that reason.

## The trap

**"We'll fix it with a better prompt."** Prompts are advice. None of the failures
above is fixed by advice: they are fixed by a truncation cap, a pinned-facts rule, a
turn limit, a verification requirement. Reaching for the prompt is how a team spends
three weeks on something a fifteen-line change would have fixed — and lesson 1 is
about why that reach is so instinctive.

## Read this

- **[`reference/pitfalls.md`](../reference/pitfalls.md)** — the full catalogue in
  one scannable table, including the trust failures from lesson 19.
- **[`build/transcripts/stage4-context.txt`](../build/transcripts/stage4-context.txt)** —
  two of these failures happening, with the proof. Worth rereading now that you have
  names for them.

## Teach it

**The analogy.** A slow leak, not a burst pipe. Nothing alarms. You notice the bill.

**The question to open with.** *"Name a way an agent could be wrong without anything
erroring."* The room will generate half this list unprompted — and having generated
it themselves, they remember it.

**The 60-second version.** Reliability failures are silent: context rot, compaction
amnesia, unlabelled truncation, cache invalidation, result flooding, tool sprawl,
ambiguous descriptions, unsafe retries, runaway loops, unverified claims. Nearly
every one is an absent policy rather than a bug — which is why a prompt change never
fixes them.

---
*Sources: [`build/transcripts/`](../build/transcripts/) · verified 2026-08-31*

**Next:** [19 — How harnesses fail: trust](19-failures-trust.md)

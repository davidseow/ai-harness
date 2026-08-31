# 00 — Orientation

**~3 min · reading only**

> **In one line:** This course is about the software *around* the model, because
> that is what determines whether an agent is any good.

## How to read this

Twenty-one lessons, three to five minutes each, in five modules. They are ordered,
and each assumes the one before it. There is no code you need to run: every
example was executed already and its **real output is printed in the lesson**.

| Module | Lessons | What you get |
|---|---|---|
| 1 · Foundations | 01–05 | What a harness is, and the loop at the centre of it |
| 2 · Build one, on paper | 06–12 | Seven stages, each adding one capability, with transcripts |
| 3 · Deep dive: pi.dev | 13–17 | A real harness dissected, quoted from its own docs |
| 4 · Pitfalls & guardrails | 18–20 | How these systems fail, and what actually prevents it |
| 5 · Practice & teaching | 21 | Design heuristics, evaluation, and the contrast table |

**If you have 20 minutes:** lessons 1, 2, 3, and 15. That is the spine.

**If you are going to teach this:** every lesson ends with a **Teach it** box —
the analogy, the question to open with, and the 60-second version. Those boxes are
the actual teaching kit; the rest is your preparation.

## What you should already know

That LLMs exist and you have used a coding agent once. Nothing else. Lesson 1
starts from "what is the model actually doing", and the code is TypeScript kept
deliberately plain — if you can read one language you can read it.

## The one idea, up front

An agent is a **stateless** model wrapped in a loop that rebuilds its entire
memory from scratch on every single turn. Almost every surprising behaviour —
forgetting a fact it was told, redoing work, ignoring an instruction that was
"definitely in the prompt", costing ten times what you expected — follows from
that sentence. Most of this course is working out the consequences.

## What this course is not

It is not a survey of agent frameworks, and it is not a recommendation to build
your own harness. Lesson 5 is explicit that you probably should not. Understanding
how one works and building one are different goals, and only the first is
generally useful.

## On sources

Everything claimed about pi.dev is quoted from pi's own repository in
[`reading/excerpts.md`](../reading/excerpts.md), fetched on 2026-08-31, so you can
check any claim without a network connection. Where a widely repeated fact turned
out to be unsupported by the primary source, the course says so rather than
repeating it — there is one such correction, noted at the top of that file.

Every transcript in Module 2 is genuine captured output, committed in
[`build/transcripts/`](../build/transcripts/). None of it was written by hand.

---

**Next:** [01 — The model is not the agent](01-model-is-not-the-agent.md)

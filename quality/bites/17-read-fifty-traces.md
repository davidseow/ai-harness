# 17 — Read fifty traces

**~4 min · M5 Production · builds on lesson 18**

> **In one line:** Before you build dashboards, read the failures yourself and sort
> them into piles. The piles tell you what to measure.

## The idea

**Error analysis** is the highest-value hour in agent quality work, and the most
skipped. The method:

1. Sample ~50 failed or human-corrected runs.
2. For each, write one line: *what went wrong first?* (the first error, not the
   final symptom)
3. Group the lines into piles. Name each pile.
4. Count. Fix the biggest pile. Repeat next month.

Use lesson 18's categories as starting labels (context, tool surface, loop) plus
lesson 19's (trust), and add "model judgement" and "task was impossible". Let new
piles appear; the surprises are the point.

## Then set targets (SLOs)

Once you know your piles, pick a handful of numbers to watch, each with a target:

| Metric | Example target |
|---|---|
| task success (sampled, graded) | ≥ 85% |
| turns to completion, p50 / p95 | ≤ 8 / ≤ 25 |
| cost per completed task | ≤ £0.40 |
| human intervention rate | ≤ 10% |
| gate denials per 100 runs | watch the trend |

Lesson 21 explains why these, not token counts. A sudden rise in denials is
interesting either way: an attack, or a false alarm that will make users switch
the gate off.

## Example

Fifty traces from a support agent. Piles: wrong customer record fetched (19),
answer correct but tone wrong (11), tool timeout not retried (8), other (12). The
team had been tuning tone. The biggest pile was a context bug: the search tool
returned the first match for a name, not the customer in the session.

## Check yourself

### Q: Why write the *first* error rather than the final symptom?
- A: It is shorter
- B: Later errors are often consequences; fixing the first removes them too
- C: The last error is usually the model's fault

<details><summary>Answer</summary>

**B** — one wrong file read can cause ten wrong edits. Count it once.

</details>

### Q: Before error analysis, what should you avoid?
- A: Fixing the issue you assumed was biggest
- B: Reading traces
- C: Sampling failures

<details><summary>Answer</summary>

**A** — the example team spent weeks on tone while a context bug was the top pile.

</details>

## On paper

Notebook exercise **5.2**: sort twelve one-line failure notes into piles.

**Next:** [18 — Release gates](18-release-gates.md)

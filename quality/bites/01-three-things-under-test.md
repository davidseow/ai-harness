# 01 — Three things under test

**~3 min · M1 Foundations · builds on lessons 01 and 05**

> **In one line:** When an agent fails, it was the model, the harness or the
> deployment. Only one of the three is deterministic, and that is where testing starts.

## The idea

Lesson 01 split the agent into a model and a harness. Lesson 05 added who supplies
the deployment. For quality work, those are three different systems under test:

| Layer | Example failure | Deterministic? | Test with |
|---|---|---|---|
| Model | picks the wrong file to edit | no | evals, many trials |
| Harness | drops a fact during compaction | **yes** | ordinary tests |
| Deployment | prompt file missing, wrong tool allowlist | **yes** | config tests |

Teams new to agents test everything as if it were the model: run it a few times,
eyeball the result, tweak the prompt. That treats a deterministic bug as bad luck.

## Example

Stage 4 of the build loses a deploy key by turn 4. Run it a thousand times and it is
lost a thousand times. That is a harness defect (compaction keeps the wrong things),
not a model that "forgot". No prompt tweak fixes it, and one cheap test catches it
forever.

**The triage question:** *would this failure reproduce with a scripted model?* If
yes, it is harness or deployment, and it deserves a real test, not an eval.

## Check yourself

### Q: The agent ignores an instruction in `AGENTS.md`. Logs show the file was never loaded because of a path typo. Which layer failed?
- A: Model
- B: Harness
- C: Deployment

<details><summary>Answer</summary>

**C** — the harness loads context files correctly; the deployment pointed it at the
wrong place. Deterministic, so a config test catches it.

</details>

### Q: Which question best separates a model failure from a harness failure?
- A: Does it happen on the biggest model too?
- B: Would it reproduce with a scripted (mock) model?
- C: Does a better prompt fix it?

<details><summary>Answer</summary>

**B** — if a scripted model triggers it, the model's judgement is not involved.
A and C can both "fix" a harness bug by accident and hide it.

</details>

## On paper

Notebook exercise **1.1**: sort ten failures into the three layers.

**Next:** [02 — One run is an anecdote](02-one-run-is-an-anecdote.md)

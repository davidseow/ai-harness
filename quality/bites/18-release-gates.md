# 18 — Release gates

**~4 min · M5 Production · closes the track**

> **In one line:** Every change to a harness is one of a few kinds, and each kind
> has a different, known set of checks it must pass before shipping.

## The idea

| Change | Must pass | Then |
|---|---|---|
| harness code (loop, context, tools) | unit + replay suite | ship |
| gate / policy | unit matrix incl. old misses (bite 14) | ship |
| system prompt or tool descriptions | replay + regression eval + cost check | canary |
| model version | full regression + capability eval, paired (bite 12) | canary |
| new tool | unit + fault matrix (bite 08) + gate review + eval | canary |

**Canary** means: route a small share of real traffic to the new version, compare
the SLOs from bite 17 against the old one, then widen or roll back.

## Version everything that changes behaviour

Prompts, tool descriptions, policies and model ids all change what the agent does.
If they are not versioned and logged in the trace, you cannot answer "what
changed?" when quality drops, and you cannot roll back.

A useful rule: **a prompt change is a code change.** Same review, same version
control, same tests.

## Example

A tool description gets reworded for clarity. No code changed, so CI skips the
evals. Next day, cost per task is up 30%: the model now calls the tool twice to
"confirm". Under the table above, this was a prompt-class change and needed the
cost check and a canary.

## Check yourself

### Q: You upgrade the model id. What is the minimum before full rollout?
- A: Unit tests
- B: Paired regression and capability evals, then a canary
- C: A demo

<details><summary>Answer</summary>

**B** — the model is the stochastic layer; only evals and real traffic tell you
how it behaves inside your harness.

</details>

### Q: Why do tool descriptions count as prompt changes?
- A: They are sent to the model every turn and steer its choices
- B: They are written in English
- C: They are stored in the same file

<details><summary>Answer</summary>

**A** — lesson 07: schemas are part of the request. Changing them changes
behaviour.

</details>

## On paper

Notebook **capstone**: a one-page test plan for the seven-stage harness.

**Next:** [the notebook](../notebook.md) · [back to the track](../README.md)

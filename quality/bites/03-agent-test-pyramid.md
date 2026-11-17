# 03 — The agent test pyramid

**~3 min · M1 Foundations · builds on lesson 04**

> **In one line:** Many cheap deterministic tests at the bottom, a few expensive
> stochastic evals at the top, and production monitoring above that.

## The idea

```
              ┌─────────────────────┐
              │ production traces   │  real users, sampled review
              ├─────────────────────┤
              │ evals (real model)  │  stochastic · slow · £ per run
              ├─────────────────────┤
              │ replay / contract   │  mock model · whole loop · fast
              ├─────────────────────┤
              │ unit                │  tools, gate, truncation, session log
              └─────────────────────┘
```

Each layer answers a different question:

- **Unit:** does this function keep its promise? (the gate denies `rm -rf`)
- **Replay:** given *these* model replies, does the loop do the right thing?
  (a failed edit comes back as a result and the loop continues)
- **Eval:** given a *real* model, how often does the task succeed?
- **Production:** is what we measured in evals what users actually get?

## Example

Map the four control surfaces from lesson 04 to the cheapest layer that tests them:

| Surface | Cheapest layer |
|---|---|
| Context assembly | replay — assert on the recorded request |
| Tools | unit — call the tool directly |
| Permissions | unit — feed calls to the policy |
| Loop control | replay — scripted replies, count turns |

None of these need a real model. Evals are for the one thing that does: whether the
model, *inside* your harness, chooses well.

**The smell:** if most of your quality signal comes from evals, you are paying a
dice-roll price for questions a unit test answers for free.

## Check yourself

### Q: You want to know whether the harness re-sends the system prompt on every turn. Cheapest layer?
- A: Eval
- B: Replay with a mock model
- C: Production traces

<details><summary>Answer</summary>

**B** — record the requests and look. It is mechanical, so a real model adds cost
and noise and nothing else.

</details>

### Q: Which question can only an eval answer?
- A: Does compaction keep the last 4 messages?
- B: Does the model pick `edit` over `write` for a small change?
- C: Does the gate log every decision?

<details><summary>Answer</summary>

**B** — it is the model's choice. A and C are harness behaviour.

</details>

## On paper

Notebook exercise **1.3**: draw the pyramid for an agent you use and place five
tests on it.

**Next:** [04 — The mock is a test double](04-mock-is-a-test-double.md)

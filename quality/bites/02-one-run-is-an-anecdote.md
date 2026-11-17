# 02 — One run is an anecdote

**~4 min · M1 Foundations · builds on lesson 02**

> **In one line:** The model part is a dice roll, so quality is a rate, and
> "works for me once" and "works every time" are wildly different numbers.

## The idea

Run the same task twice and you can get two different tool sequences. So the
question "does it work?" has no yes/no answer. It has a probability, *p*, the chance
one attempt succeeds.

Two ways to turn *p* into a number that matters:

- **pass@k** — at least one of *k* attempts succeeds: `1 − (1 − p)^k`.
  Right when a human picks the best attempt (code suggestions, drafts).
- **pass^k** — all *k* attempts succeed: `p^k`.
  Right when the agent runs unattended and every run has to work.

## Example

An agent that succeeds 90% of the time (`p = 0.9`):

| k | pass@k | pass^k |
|---|---|---|
| 1 | 0.90 | 0.90 |
| 3 | 0.999 | 0.73 |
| 10 | ≈1.00 | 0.35 |

Same agent. Sold as "nearly always gets there" (pass@3) or "fails one in three
batches of three" (pass^3). A nightly job that runs it ten times succeeds end to end
about a third of the time.

To get pass^10 above 0.9 you need `p ≥ 0.99`. Reliability engineering for agents
is mostly the work of moving *p* from 0.9 to 0.99, and you cannot even see that
difference without many trials.

## Check yourself

### Q: An unattended agent triages 5 tickets per run. Each ticket succeeds with p = 0.8. Roughly how often is a whole run clean?
- A: 80%
- B: 33%
- C: 99%

<details><summary>Answer</summary>

**B** — `0.8^5 ≈ 0.33`. Unattended means pass^k. A is the per-ticket rate; C is
pass@5, which would only matter if a human picked the best ticket.

</details>

### Q: A demo works on the first try. What have you learned about p?
- A: p is high
- B: p is probably above 0.5
- C: Almost nothing; one success is consistent with p = 0.3

<details><summary>Answer</summary>

**C** — a single trial cannot distinguish 0.3 from 0.99. You need repeated trials,
which is what bite 12 does properly.

</details>

## On paper

Notebook exercise **1.2**: compute pass@k and pass^k by hand for two agents.

**Next:** [03 — The agent test pyramid](03-agent-test-pyramid.md)

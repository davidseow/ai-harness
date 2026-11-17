# 13 — Keep the eval honest

**~3 min · M3 Evals**

> **In one line:** Two kinds of eval, two failure modes: regression suites go stale
> by passing, capability suites go stale by being tuned against.

## The idea

| | Regression eval | Capability eval |
|---|---|---|
| Purpose | stop things that worked from breaking | measure how far we can push |
| Expected score | ~100% | well below 100% |
| A drop means | ship blocker | look into it |
| Grows from | every fixed bug | new ambitions |

Keep them separate. Mixed together, a real regression hides inside the noise of
hard tasks that were always flaky.

## How evals rot

- **Saturation.** Every task passes; the suite can no longer tell you anything
  about improvements. Fine for regression, useless for capability. Add harder tasks.
- **Overfitting.** You tune the prompt until the eval passes. The prompt now
  encodes the eval. Keep a **held-out set** you look at rarely, and trust it more.
- **Drift.** Your users' tasks change; your eval does not. Refresh from recent
  production failures (bite 17).
- **Grader rot.** The world changes (a dependency updates) and correct solutions
  start failing. Re-check failures by hand before believing a drop.

## Example

A team adds "always run tests before finishing" to the system prompt because three
eval tasks failed without it. Score goes up. On the held-out set: flat, and cost per
task up 20% from extra test runs. The change fixed the eval, not the agent.

## Check yourself

### Q: Your capability eval hits 98%. What now?
- A: Celebrate and stop
- B: Move it to regression, and build harder capability tasks
- C: Delete it

<details><summary>Answer</summary>

**B** — a saturated capability suite is a fine regression suite.

</details>

### Q: Why keep a held-out set you rarely look at?
- A: It is cheaper
- B: Anything you tune against stops measuring generalisation
- C: Regulators require it

<details><summary>Answer</summary>

**B** — looking is tuning. The held-out set is your check on yourself.

</details>

## On paper

Notebook exercise **3.5**: sort eight tasks into regression vs capability.

**Next:** [14 — Test the gate with a matrix](14-test-the-gate.md)

# 09 — Anatomy of an eval

**~4 min · M3 Evals · builds on lesson 21**

> **In one line:** An eval is five parts: tasks, an environment, a grader, trials
> and a metric. Most bad evals are missing one and do not know it.

## The idea

| Part | Question it answers | Common mistake |
|---|---|---|
| **Tasks** | what are we asking it to do? | invented tasks nobody actually has |
| **Environment** | where does it run? | shared state leaks between tasks |
| **Grader** | did it succeed? | grading the transcript, not the result |
| **Trials** | how many times each? | one trial (bite 02) |
| **Metric** | what number do we report? | an average that hides the bad tasks |

## Where tasks come from

Not from imagination. From **failures you have already seen**: support tickets,
traces where a human stepped in, bugs filed against the agent. Twenty real failures
beat two hundred synthetic tasks, because they are the shape of your actual
distribution.

Each task needs a written **success criterion before you run it.** "Fixes the bug"
is not one. "`npm test` passes and no file outside `src/` changed" is.

## Example

The environment matters more than people expect. The build's `freshWorkspace()` in
[`workspace.ts`](../../build/src/shared/workspace.ts) gives every stage a clean
directory. An eval needs the same: a fresh sandbox per **trial**, not per task.
Otherwise trial 2 sees trial 1's half-finished edit and your "variance" is
contamination.

## Check yourself

### Q: Which is a usable success criterion?
- A: The agent writes good code
- B: The agent fixes the login bug
- C: `pytest tests/test_login.py` passes and `git diff --stat` touches only `auth/`

<details><summary>Answer</summary>

**C** — a machine can check it, and it bounds side effects. A and B need a judge
and invite argument.

</details>

### Q: Five trials of one task share a workspace. Results: pass, pass, fail, fail, fail. What is the first suspicion?
- A: The model got worse
- B: Earlier trials left state that broke later ones
- C: Normal variance

<details><summary>Answer</summary>

**B** — a pattern that degrades in order points at contamination. Fix isolation
before interpreting anything.

</details>

## On paper

Notebook exercise **3.1**: turn three vague tasks into checkable ones.

**Next:** [10 — Grade the outcome, not the path](10-grade-the-outcome.md)

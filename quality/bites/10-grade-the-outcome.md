# 10 — Grade the outcome, not the path

**~3 min · M3 Evals · builds on lesson 02**

> **In one line:** Check the state of the world after the run. Checking which steps
> the agent took punishes good solutions you did not anticipate.

## The idea

Graders come in three kinds. Prefer them in this order:

1. **Code** — inspect the end state: tests pass, file exists, row in database,
   nothing outside the allowed directory changed. Fast, free, repeatable.
2. **Model** — an LLM judge with a rubric, for outputs code cannot check
   (a summary, an explanation). Next bite.
3. **Human** — the gold standard, used to calibrate 2 and to sample production.

And grade the **outcome**, not the **path**. A path grader says "the agent must call
`grep`, then `read`, then `edit`". The model finds the file with `ls` and passes the
task, and your grader fails it.

## When the path *does* matter

Some path properties are real requirements, and they are usually **negative**:

- never called a denied tool
- never wrote outside the workspace
- finished within 20 turns or £0.50

Write those as constraints alongside the outcome check, not as a required sequence.

## Example

Task: "rename `getUser` to `fetchUser` everywhere".

- Path grader: *expects one `bash` call running `sed`.* Fails an agent that used
  five `edit` calls correctly.
- Outcome grader: *zero matches for `getUser`, the build passes, the diff only
  touches `.ts` files.* Passes both correct solutions, fails the wrong ones.

## Check yourself

### Q: Which is a good path constraint?
- A: Must call `read` before `edit`
- B: Must not modify any file under `migrations/`
- C: Must use exactly three tool calls

<details><summary>Answer</summary>

**B** — it forbids a harmful effect without prescribing a method.

</details>

### Q: Why prefer a code grader where possible?
- A: It is more lenient
- B: It is deterministic, so grader noise does not add to model noise
- C: Models cannot grade code

<details><summary>Answer</summary>

**B** — with a stochastic grader you have two dice rolls per trial and cannot
tell which one moved.

</details>

## On paper

Notebook exercise **3.2**: rewrite three path graders as outcome graders.

**Next:** [11 — The judge needs a judge](11-llm-judge.md)

# 11 — The judge needs a judge

**~4 min · M3 Evals**

> **In one line:** An LLM judge is a model under test too. Give it a narrow rubric,
> ask for pass/fail, and measure how often it agrees with a human before trusting it.

## The idea

When the output is prose, code cannot grade it, so you use a model. That judge has
the same failure modes as any model, plus some of its own:

- **Position bias** — prefers whichever answer it saw first (or second)
- **Verbosity bias** — longer reads as better
- **Self-preference** — rates text from its own model family higher
- **Vague rubric drift** — "is this helpful? 1–10" means something different each call

## Making it trustworthy

1. **One criterion per question, pass/fail.** "Does the summary mention the
   deadline? yes/no" beats "rate the summary 1–10".
2. **Show it the evidence.** Give the judge the source document, not just the
   output, or it grades plausibility.
3. **Calibrate.** Have a human label 30–50 outputs. Run the judge on the same set.
   Measure agreement, and look hard at the disagreements: that is where the rubric
   is ambiguous.
4. **Swap the order** for pairwise comparisons and only count verdicts that survive
   the swap.

## Example

A judge agrees with the human on 45 of 50 labels. Sounds like 90%. But if 40 of
the 50 were passes, a judge that says "pass" to everything scores 80%. Always
compare against that lazy baseline, and check the judge catches the *failures*:
how many of the 10 human fails did it flag?

## Check yourself

### Q: Your judge scores answer A over B. You swap the order and it now prefers B. What do you record?
- A: A wins
- B: B wins
- C: No reliable preference (a tie)

<details><summary>Answer</summary>

**C** — the verdict tracked position, not quality.

</details>

### Q: Which rubric item is best for an LLM judge?
- A: Rate the overall quality from 1 to 10
- B: Does the reply state the refund amount from the order record? yes/no
- C: Is this a good reply?

<details><summary>Answer</summary>

**B** — one criterion, binary, checkable against evidence you supply.

</details>

## On paper

Notebook exercise **3.3**: compute judge agreement and catch rate from a 2×2 table.

**Next:** [12 — Small numbers lie](12-small-numbers-lie.md)

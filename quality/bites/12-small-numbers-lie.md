# 12 — Small numbers lie

**~5 min · M3 Evals · paper-heavy**

> **In one line:** With 20 tasks, 14 versus 16 passes is not a difference. Know the
> error bar before you celebrate a prompt change.

## The idea

A pass rate from *n* tasks has a standard error of roughly

```
SE = √( p(1 − p) / n )
```

and a rough 95% range is **p ± 2·SE**.

| n | p = 0.7 → ± | p = 0.9 → ± |
|---|---|---|
| 20 | ± 0.20 | ± 0.13 |
| 100 | ± 0.09 | ± 0.06 |
| 400 | ± 0.05 | ± 0.03 |

At 20 tasks, a 70% agent could plausibly score anywhere from 50% to 90%. A prompt
tweak that moves you from 14/20 to 16/20 is inside that noise.

## Use paired comparisons

Run old and new on the **same** tasks. Then ignore the tasks where both passed or
both failed: they carry no information about the difference. Count only the
**flips**:

- old fail → new pass: **wins**
- old pass → new fail: **losses**

If wins and losses are 2 and 0, that could easily be chance. If they are 12 and 1,
it almost certainly is not. As a rough rule: with fewer than about 10 flips in
total, do not claim a difference.

## Example

Old prompt: 14/20. New prompt: 16/20. Flips: 4 wins, 2 losses. Net +2, but six flips
split 4–2 is what a coin gives you often. Verdict: no evidence yet. Add tasks or
trials, or stop arguing about it.

## Check yourself

### Q: 100 tasks, pass rate 0.9. Roughly what range is plausible?
- A: 0.89–0.91
- B: 0.84–0.96
- C: 0.70–1.00

<details><summary>Answer</summary>

**B** — `SE = √(0.09/100) = 0.03`, so ± 0.06.

</details>

### Q: Paired comparison on 50 tasks: 40 both-pass, 5 both-fail, 4 wins, 1 loss. What do you conclude?
- A: The new version is clearly better
- B: Only 5 flips; suggestive at best, gather more
- C: The new version is worse

<details><summary>Answer</summary>

**B** — the 45 agreeing tasks say nothing about the difference. Five flips is
too few to call.

</details>

## On paper

Notebook exercise **3.4**: error bars and a paired comparison, by hand.

**Next:** [13 — Keep the eval honest](13-keep-the-eval-honest.md)

# 14 — Test the gate with a matrix

**~5 min · M4 Trust testing · builds on lesson 10**

> **In one line:** A permission gate is a classifier. Score it like one: what it
> caught, what it missed, and what it blocked for no reason.

## The idea

Every gate decision lands in one of four boxes:

|  | gate **denied** | gate **allowed** |
|---|---|---|
| **should deny** | caught ✓ | **missed** ✗ (dangerous) |
| **should allow** | **false alarm** ✗ (annoying) | ok ✓ |

Misses cost you data. False alarms cost you trust: users who get blocked for
nothing switch the gate off, which turns every future miss into a sure thing.

## Example — probing stage 5's policy

[`quality/probes/gate-probe.ts`](../probes/gate-probe.ts) feeds 17 commands to
`defaultPolicy` from [`permissions.ts`](../../build/src/shared/permissions.ts).
Excerpt of the captured output ([`gate-probe.txt`](../probes/gate-probe.txt)):

```
deny   want=deny   caught       rm  -rf x
allow  want=deny   MISSED       $(echo rm) -rf x
allow  want=deny   MISSED       rm --recursive x
allow  want=deny   MISSED       git push -f
allow  want=deny   MISSED       > data.csv
deny   want=allow  FALSE ALARM  echo 'nc is fine'

caught 7 · missed 7 · false alarms 1 · correctly allowed 2
write tool emptying reports/q3.csv → allowed
```

The source file predicted the first miss in its own comment: *"blocklists lose"*.
The probe adds the specifics. Long flags (`--recursive`), short flags (`-f`),
shell redirection and other languages all walk past. And the last line is the
biggest finding: the policy only looks at `bash`, so the `write` tool can empty a
file the gate was meant to protect.

## Read the score carefully

"7 caught, 7 missed" is not the gate's miss rate. **You chose the cases**, and a
tester picks hard ones. The matrix tells you *which kinds* of input fail, not how
often real traffic will hit them. For that you need real traffic (bite 16).

## Check yourself

### Q: Why is `echo 'nc is fine'` denied?
- A: `echo` is blocked
- B: `\bnc\b` matches the word "nc" anywhere in the string, even inside quotes
- C: Quotes are blocked

<details><summary>Answer</summary>

**B** — pattern matching on an opaque string cannot tell a command from text.
That is the lesson 10 argument for typed tools.

</details>

### Q: What is the most serious finding in the probe?
- A: The false alarm on `echo`
- B: `git push -f` is allowed
- C: The policy never inspects non-bash tools, so `write` can destroy the same data

<details><summary>Answer</summary>

**C** — it is a whole category, not a single pattern. Adding regexes to the bash
list cannot fix it.

</details>

## On paper

Notebook exercise **4.1**: extend the probe with your own five cases and predict
each box before checking.

**Next:** [15 — Canaries and incidents](15-canaries-and-incidents.md)

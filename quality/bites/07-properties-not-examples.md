# 07 — Properties, not examples

**~4 min · M2 Testing the harness · builds on lesson 09**

> **In one line:** State what must *always* be true, then sweep the inputs. It finds
> the bug your three hand-picked examples walked past.

## The idea

An example test says "for input X, expect Y". A **property** says "for every input,
this holds". Harness code is full of properties:

- truncation: `output.length ≤ max`
- workspace paths: the resolved path stays inside the workspace root
- session log: replaying the log reproduces the same messages
- compaction: never splits a `tool_use` from its `tool_result`

## Example — a real bug in this repo

`truncateMiddle` in [`context.ts`](../../build/src/shared/context.ts) keeps the head
and tail and inserts a marker. At its default `max` of 400 it works. The probe in
[`quality/probes/truncate-probe.ts`](../probes/truncate-probe.ts) sweeps `max`.
Captured output ([`truncate-probe.txt`](../probes/truncate-probe.txt)):

```
max=400  input=1000  output= 389  holds
max= 62  input=1000  output=  51  holds
max= 61  input=1000  output=1050  BROKEN
max= 40  input=1000  output=2030  BROKEN
```

Below 62, "truncating" makes the text *longer* than the original. The reason is
`s.slice(-keep)`: when `keep` is 0, `slice(-0)` is `slice(0)`, the whole string.
At 40, `keep` goes negative and slices go wrong both ends.

Nobody calls it with `max = 40` today, so no example test would try it. A property
sweep tries it in a second. That is the point: properties test the edges you did
not think to think about.

## Check yourself

### Q: Which is a property rather than an example?
- A: `read("a.txt")` returns "hello"
- B: For any path, the resolved path starts with the workspace root
- C: The gate denies `rm -rf /`

<details><summary>Answer</summary>

**B** — it quantifies over all inputs. A and C are single examples.

</details>

### Q: Why does `slice(-0)` return the whole string?
- A: `-0` equals `0`, and `slice(0)` means "from the start"
- B: JavaScript treats negative indexes as errors
- C: It is a bug in Node

<details><summary>Answer</summary>

**A** — the "count from the end" trick breaks exactly at zero. A classic edge
that a sweep finds and a reviewer misses.

</details>

## On paper

Notebook exercise **2.4**: write three properties for the session log and a fix
for `truncateMiddle`.

**Next:** [08 — Inject the faults](08-fault-injection.md)

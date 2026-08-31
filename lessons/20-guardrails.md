# 20 — The guardrail catalogue

**~5 min · reading only · prerequisite: 19**

> **In one line:** Every guardrail attaches to a hook point and needs a test that
> proves it fires — an untested guardrail is a belief.

## The idea

Lessons 18 and 19 named the failures. This one is the answer sheet, and it is
organised around a claim: **a guardrail is not a control until you have watched it
refuse something.**

Three columns matter for each one — where it attaches, what it does, and how you
know it works. The third is the one that gets skipped, and it is the one that turns
a policy into a control.

## The catalogue

| Failure | Control | Hook point | How you verify it |
|---|---|---|---|
| Result flooding | per-result byte cap, **with a visible marker** | `tool_result` | feed a 4KB result; assert the model saw a labelled cut |
| Unlabelled truncation | the marker itself | `tool_result` | assert the marker string is present in the result |
| Compaction amnesia | pinned facts kept outside the compactable span | `session_before_compact` | compact a synthetic session; assert the fact survives |
| Context rot | drop superseded tool results; cap history | `context` / `before_request` | assert token count stays under budget over N turns |
| Cache invalidation | freeze the prefix; append, never edit `system` | `before_request` | assert cache reads > 0 across turns |
| Tool sprawl | fewer tools; defer/search rather than declare all | tool registry | count schema tokens per turn; watch it as a budget |
| Ambiguous descriptions | name the failure mode in the description | tool schema | eval on tasks where two tools plausibly apply |
| Unsafe retries | make tools idempotent, or return "already done" | tool impl | call twice; assert one effect |
| Runaway loops | turn cap that reports itself | the loop | assert `stoppedBy == "max_turns"` is surfaced, not swallowed |
| Unverified claims | require the check as a tool call | tool design | assert the transcript contains the run, not the claim |
| Destructive action | typed tool + gate; deny by default | `tool_call` | **attempt it; assert the side effect is absent** |
| Exfiltration | egress allowlist at the network layer | outside the process | attempt a POST to a non-allowed host; assert it fails |
| Secrets in context | redact before results enter history | `tool_result` | assert the secret is absent from the request *and the log* |
| Untrusted repo code | trust prompt before loading project config | `project_trust` | open an untrusted repo; assert its extension did not run |
| Malicious package | review; pin versions; prefer first-party | install time | — (process control, not a runtime one) |
| Prompt injection | containment + egress + typed gates; mark untrusted content | several | red-team with an injected file; assert no egress |

Read the hook-point column vertically and you are looking at lesson 15's event list
again. That is the payoff of reading a harness's events first: **the event list
determines which of these rows you can implement at all.** A harness without a
`tool_result` interceptor cannot do redaction, no matter how much you want it to.

## Three verification patterns worth internalising

**1. Assert the absence of the side effect, not the presence of the message.**
Stage 5 is built on this:

```ts
if (!q3 || !q4) throw new Error("GUARDRAIL FAILED: the delete went through");
```

Checking that a denial was *logged* tests your logging. Checking that the file is
*still there* tests the guardrail.

**2. Assert against the request that went on the wire.** Stage 4 proves compaction
amnesia by searching the recorded requests — not by reasoning about the code:

```
         turn   was the deploy key still in the request?
            3   yes
            4   NO — it is gone
```

A provider that records requests (lesson 6) is a testing tool, not just a
development convenience.

**3. Make the negative test part of the suite.** Both of the above run in
`npm run smoke`, with the API key deliberately removed from the environment. The
check for stage 7 asserts that the string `PROD-7741` **never appears in the
output** — a guardrail expressed as an absence.

## What to do first

If you have limited time, in this order:

1. **A turn cap.** Cheapest, prevents the most expensive failure.
2. **A per-result cap with a marker.** Prevents one tool call eating the window.
3. **Containment.** A container and scoped credentials outrank every in-process
   control, because they hold when your reasoning about attacks was wrong.
4. **A gate on irreversible actions**, with a negative test.
5. **Redaction at `tool_result`**, if secrets can plausibly enter.
6. **Pinned-facts survival test**, once sessions run long enough to compact.

Note that (3) is not code you write in the harness at all. The strongest control in
the list lives outside the program — which is exactly pi's argument
([`excerpts.md` §2](../reading/excerpts.md)).

## The trap

**A guardrail that has never been exercised.** Policies rot: a regex stops matching
after a refactor, a hook stops being called after the loop is reorganised, a gate is
bypassed by a new code path. Nothing tells you. The negative test is what tells you,
and it only works if it runs.

Stage 5's `afterTool` hook was originally skipped on the deny path, so denials
executed correctly but appeared **nowhere in the transcript**. The control worked and
was invisible — which is one refactor away from the control being gone and equally
invisible.

## Read this

- **[`reference/guardrails.md`](../reference/guardrails.md)** — this table with
  implementation notes.
- **[`reference/pitfalls.md`](../reference/pitfalls.md)** — the failures side,
  phrased as questions to ask a design.
- **[`build/scripts/smoke.ts`](../build/scripts/smoke.ts)** — what these tests look
  like when they are real. Note `mustNotContain`.

## Teach it

**The analogy.** A fire drill. Having extinguishers is not a fire plan. Having
walked everyone out of the building once is.

**The question to open with.** *"How would you prove your agent can't delete the
repo?"* Watch how long it takes before someone says "try it and see". That
instinct is the lesson.

**The 60-second version.** Every guardrail has a hook point and a verification.
Assert the absence of the side effect, not the presence of a log line. Test against
the request that actually went on the wire. Put the negative tests in the suite. And
if you only do four things: turn cap, result cap, containment, gate on irreversible
actions.

---
*Sources: [`build/scripts/smoke.ts`](../build/scripts/smoke.ts) · [`build/transcripts/`](../build/transcripts/) · verified 2026-08-31*

**Next:** [21 — Design heuristics and evaluating a harness](21-heuristics-and-evaluation.md)

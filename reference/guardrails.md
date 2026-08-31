# Guardrails — control, hook point, and how to verify

The third column is the one that matters. A guardrail you have not watched refuse
something is a belief, not a control.

IDs map to [`pitfalls.md`](pitfalls.md).

---

## Context

| Pitfall | Control | Hook point | Verify |
|---|---|---|---|
| C1 rot | drop superseded tool results; cap history tokens | `context` / `before_request` | assert token count stays under budget across N turns |
| C2 amnesia | pin required facts outside the compactable span; restate them into the summary | `session_before_compact` | compact a synthetic session; assert the pinned fact is still in the request |
| C3 truncation | cut head+tail, insert an explicit marker | `tool_result` | assert the marker string appears in the result the model receives |
| C4 flooding | per-result byte cap (start ~2–4KB; the build track uses 400 chars to make it visible) | `tool_result` | feed an oversized result; assert length ≤ cap and marker present |
| C5 cache | freeze the prefix; append operator messages instead of editing `system`; use tool search rather than swapping tools | `before_request` | assert cache-read tokens > 0 on turns ≥ 2 |
| C6 growth | history budget with compaction below it | `before_request` | run a long synthetic session; assert no request exceeds the window |
| C7 secrets | redact **before** results enter history | `tool_result` | assert the secret is absent from the request **and** the session log |

## Tool surface

| Pitfall | Control | Hook point | Verify |
|---|---|---|---|
| T1 sprawl | fewer tools; defer loading / tool search | registry | measure schema tokens per turn; treat as a budget line |
| T2 overlap | one tool per job; delete the others | registry | eval on tasks where two tools plausibly apply; assert consistent choice |
| T3 descriptions | name the failure mode in the description ("Fails if the string appears more than once") | tool schema | eval; measure wrong-tool rate |
| T4 bash gating | promote the action to a typed tool; gate on arguments; container as the backstop | `tool_call` + environment | attempt via an obfuscated command; assert the side effect is absent |
| T5 retries | make tools idempotent, or return "already done" rather than repeating | tool impl | call twice; assert exactly one effect |
| T6 thrown errors | catch centrally; convert to `tool_result` with `is_error` | loop | make a tool throw; assert the run continues |
| T7 parallel safety | declare `parallelSafe` per tool | registry | assert unsafe tools are serialised |

## Loop

| Pitfall | Control | Hook point | Verify |
|---|---|---|---|
| L1 runaway | turn cap | loop | assert the loop exits at the cap |
| L2 silent cap | return a distinct `stoppedBy` and surface it | loop | assert `stoppedBy == "max_turns"` reaches the caller and the UI |
| L3 verification | make the check a tool call whose result is in the transcript | tool design | assert the transcript contains the run, not the claim |
| L4 unknown blocks | round-trip unrecognised blocks untouched (`OpaqueBlock`) | provider adapter | round-trip a synthetic unknown block; assert byte equality |
| L5 seed messages | log seed messages before the loop starts | session | resume from the log; assert the conversation is well-formed |

## Trust

| Pitfall | Control | Hook point | Verify |
|---|---|---|---|
| S1 injection | containment + egress allowlist + typed gates; mark untrusted content as data | several + environment | red-team with an injected file; assert no egress and no destructive call |
| S2 repo prompts | know the discovery order; print the assembled prompt; `--no-context-files` to isolate | startup | assert the assembled prompt matches expectation for a given cwd |
| S3 exfiltration | **network egress allowlist** — the strongest single control | outside the process | attempt a POST to a non-allowed host; assert it fails |
| S4 persistence | deny writes to files that are auto-loaded as instructions | `tool_call` | attempt to write `AGENTS.md`; assert denial |
| S5 repo code | trust prompt **before** loading project config; fail closed non-interactively | `project_trust` | open an untrusted repo; assert its extension did not execute |
| S6 supply chain | review source; pin versions; prefer first-party | install time | process control — review, not a runtime test |
| S7 MCP | treat added servers as prompt authors; allowlist them | config | audit which servers can contribute tool descriptions |
| S8 evidence | retain and read the session log | session | assert logs are retained and access-controlled |

## Process

| Pitfall | Control | Verify |
|---|---|---|
| P1 untested | a negative test per guardrail, in CI | the test fails when you delete the guardrail — *check this* |
| P2 invisible | emit denials to the transcript and audit log | assert the denial appears in both |
| P3 no eval | an eval on real tasks | it distinguishes two known-different configurations |
| P4 prompt-first | ask "advice or policy?" before editing a prompt | — |
| P5 logs | retention policy, access control | — |

---

## Priority order

If you do six things:

1. **Turn cap** (L1) — cheapest, prevents the most expensive failure
2. **Per-result cap with marker** (C4, C3) — prevents one call eating the window
3. **Containment** (S1, S3, T4) — a container, scoped credentials, egress allowlist.
   *Outranks every in-process control, because it holds when your model of the
   attack was wrong.*
4. **Gate on irreversible actions** (T4) — with a negative test
5. **Redaction at `tool_result`** (C7) — if secrets can plausibly enter
6. **Pinned-facts survival test** (C2) — once sessions run long enough to compact

Note that #3 is not harness code at all. The strongest control lives outside the
program — which is exactly pi's argument, and the reason its "no permission system"
stance is coherent rather than careless.

---

## Test patterns

**Assert the absence of the side effect, not the presence of the message.**

```ts
if (!q3 || !q4) throw new Error("GUARDRAIL FAILED: the delete went through");
```

**Assert against the request that went on the wire.** A provider that records
requests turns claims into checks:

```ts
const sawSecret = requests.map((r) => JSON.stringify(r).includes(SECRET));
```

**Express guardrails as absences in the suite.** From `build/scripts/smoke.ts`:

```ts
{ stage: "stage7-extensions",
  mustContain: ["registry is now 6 tools", "[redacted]", "1 call(s) denied"],
  mustNotContain: ["PROD-7741"] }
```

**Delete the guardrail and confirm the test fails.** A negative test that passes
either way is worse than none, because it is reassuring.

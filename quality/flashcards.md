# Flashcards

One idea per card. The phone app (`harness-qe.html`) turns this table into a
flip-card deck. On paper: fold a page in half, fronts left, backs right, and
cover the right side.

| Front | Back |
|---|---|
| The triage question for any agent failure | Would it reproduce with a scripted (mock) model? Yes → harness or deployment, write a real test. (bite 01) |
| Three systems under test | Model (stochastic), harness (deterministic), deployment (deterministic config). (bite 01) |
| pass@k | At least one of k attempts succeeds: 1 − (1 − p)^k. Use when a human picks the best attempt. (bite 02) |
| pass^k | All k attempts succeed: p^k. Use for unattended runs. (bite 02) |
| p = 0.9, pass^10 ≈ ? | 0.35. You need p ≥ 0.99 for pass^10 above 0.9. (bite 02) |
| The four layers of the agent test pyramid | Unit → replay (mock model) → eval (real model) → production traces. (bite 03) |
| Three testing powers of MockProvider | Scripted replies, a recorded request log (`seen`), and a turn budget (throws when the script runs out). (bite 04) |
| Why `structuredClone` in the mock | Record values, not references. Otherwise later history mutation rewrites what turn 1 "saw". (bite 04) |
| Four request-level invariants | Fact retention, token budget, prefix stability, tool_use/tool_result pairing. (bite 05) |
| Why assert on the request, not the answer | The request is the cause; the answer is a noisy symptom that can be right by luck. (bite 05) |
| Snapshot test trap | Approval fatigue: re-recording without reading the diff turns the test into a rubber stamp. (bite 06) |
| What is weak about `smoke`'s stage 5 check | It trusts the stage's own printed claim. Move the oracle out of the system under test. (bite 06) |
| Property vs example | Example: input X gives Y. Property: for every input, this holds. Properties find edges you did not think of. (bite 07) |
| The `truncateMiddle` bug | Below max = 62 the output is longer than the input: `slice(-0)` is the whole string. (bite 07) |
| Never execute a tool call that… | …arrived truncated (stop_reason max_tokens mid tool_use). (bite 08) |
| Survive vs recover | Survival from a fault is deterministic (test it). Recovery quality involves the model (eval it). (bite 08) |
| Five parts of an eval | Tasks, environment, grader, trials, metric. (bite 09) |
| Where eval tasks come from | Real failures: tickets, traces with human intervention, bugs. Twenty real beat two hundred invented. (bite 09) |
| Grader preference order | Code (end state) → model (rubric judge) → human (calibration and sampling). (bite 10) |
| A good path constraint is usually… | Negative: never touched X, never called a denied tool, within N turns. (bite 10) |
| Four LLM-judge biases | Position, verbosity, self-preference, vague-rubric drift. (bite 11) |
| How to trust a judge | One binary criterion per question, give it the evidence, calibrate against 30–50 human labels, check catch rate on failures. (bite 11) |
| Standard error of a pass rate | √(p(1 − p)/n). Rough 95% range: p ± 2·SE. (bite 12) |
| Paired comparison: what counts | Only the flips (wins and losses). Fewer than ~10 flips: do not claim a difference. (bite 12) |
| Regression vs capability eval | Regression: expect ~100%, a drop blocks shipping. Capability: below 100%, measures ambition. (bite 13) |
| Four ways evals rot | Saturation, overfitting, drift, grader rot. (bite 13) |
| Gate confusion matrix boxes | Caught, missed, false alarm, correctly allowed. (bite 14) |
| Biggest finding of the gate probe | The policy only inspects `bash`; the `write` tool can destroy the same data. (bite 14) |
| Canary | A planted instruction with a harmless, detectable effect. Pass = effect absent. (bite 15) |
| Test injection containment how? | Script the mock to obey the injection, assert the harness blocks the effect. (bite 15) |
| Trace → ? → ? | Trace → replay with mock → regression test. (bite 16) |
| Error analysis in four steps | Sample ~50 failures, write the first error, group into piles, fix the biggest. (bite 17) |
| A prompt change is a… | …code change: same review, versioning and tests. Tool descriptions count. (bite 18) |
| Canary release | Route a small share of real traffic to the new version, compare SLOs, widen or roll back. (bite 18) |

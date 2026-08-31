# Pitfalls — the catalogue

Phrased as **questions to ask a design**, because almost every entry here is an
absent policy rather than a present bug. There is no line of code to review; there
is a decision nobody made.

Pair with [`guardrails.md`](guardrails.md), which answers each one.

---

## Context

| # | Failure | Ask | Symptom |
|---|---|---|---|
| C1 | **Context rot** | What ever *removes* anything from history? | quality degrades with session length; "start a fresh session" fixes it |
| C2 | **Compaction amnesia** | Which facts must survive compaction, and who guarantees it? | agent contradicts a constraint it was given; does not know it forgot |
| C3 | **Unlabelled truncation** | When you cut a result, does the model know? | confident reasoning about a file it saw a third of |
| C4 | **Result flooding** | What is the per-result byte cap? | one `bash` call consumes most of the window |
| C5 | **Cache invalidation** | Does anything in the prefix change mid-session? | cost several times projection, no behaviour change; cache reads always zero |
| C6 | **Unbounded growth** | What is the history token budget, and what happens at it? | requests fail at the window limit, late, mid-task |
| C7 | **Secrets in context** | Once a secret enters history, how does it leave? | it doesn't — it is re-sent every turn, logged, and summarised |

## Tool surface

| # | Failure | Ask | Symptom |
|---|---|---|---|
| T1 | **Tool sprawl** | How many schema tokens ship on every turn? | unattributable cost; worse tool selection |
| T2 | **Overlapping tools** | Could two tools plausibly do the same job? | inconsistent choices blamed on the model |
| T3 | **Ambiguous descriptions** | Does the description name the failure mode? | looks like a reasoning failure; is a writing failure |
| T4 | **bash-as-everything** | Which actions need gating, and can you gate them? | you are pattern-matching shell strings — a losing blocklist |
| T5 | **Non-idempotent retries** | Is every tool safe to call twice? | duplicate appends, double POSTs, found later by someone else |
| T6 | **Thrown tool errors** | Does a failing tool end the run? | one bad path and the agent dies instead of recovering |
| T7 | **Undeclared parallel safety** | Can the harness tell a safe `grep` from an unsafe `push`? | everything serialised, or worse, nothing is |

## Loop

| # | Failure | Ask | Symptom |
|---|---|---|---|
| L1 | **Runaway loop** | What is the turn cap? | cost with no output |
| L2 | **Silent cap** | When the cap is hit, does anyone find out? | truncated work reported as complete |
| L3 | **No verification** | Is "the tests pass" a claim or a transcript entry? | confident false completion |
| L4 | **Dropped unknown blocks** | Are unrecognised content blocks round-tripped? | inexplicable API errors several turns later |
| L5 | **Seed messages unlogged** | Does the log capture messages the loop did not append? | resume produces a malformed conversation |

## Trust

| # | Failure | Ask | Symptom |
|---|---|---|---|
| S1 | **Prompt injection** | Which content reaching the model was written by someone else? | agent follows instructions you did not give |
| S2 | **Auto-loaded repo prompts** | Whose `AGENTS.md` is in your prompt right now? | behaviour changes per repo, silently |
| S3 | **Exfiltration** | Which tools can reach the network, and can they be reached? | secrets leave via curl, a URL, a push, a webhook |
| S4 | **Persistence** | Can the agent write to a file it will later read as instruction? | compromise survives the session |
| S5 | **Repo code on open** | What executes when you open an untrusted repository? | project extensions and settings run before review |
| S6 | **Extension supply chain** | What does a third-party package get access to? | everything — full system access, in-process |
| S7 | **MCP tool descriptions** | Who can write into your system prompt? | any server you added |
| S8 | **Trusting the agent's report** | After an incident, what is the evidence? | a summary written by the compromised system |

## Process

| # | Failure | Ask | Symptom |
|---|---|---|---|
| P1 | **Untested guardrail** | Have you watched it refuse something? | it stopped working at some refactor; nothing said so |
| P2 | **Invisible control** | Does the denial appear in the transcript? | working and unobservable — one step from gone and unobservable |
| P3 | **No eval** | How do you know that change helped? | you don't; you remember your successes |
| P4 | **Prompt-first debugging** | Is this fixable by advice, or does it need a policy? | three weeks on a fifteen-line problem |
| P5 | **Unretained logs** | Can you answer "what did it do" next month? | no |

---

## The five that cause the most damage

If you audit nothing else:

1. **L1 — no turn cap.** Cheapest to fix, most expensive to skip.
2. **C4 — no result cap.** One command can end a session.
3. **T4 — gating bash by pattern.** Feels like a control; is a blocklist.
4. **C2 — compaction amnesia.** Silent, and it looks like the model is stupid.
5. **P1 — untested guardrails.** Everything above is theatre without this.

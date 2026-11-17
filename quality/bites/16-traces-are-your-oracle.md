# 16 — Traces are your oracle

**~4 min · M5 Production · builds on lessons 11 and 15**

> **In one line:** In production you have no expected output. A good trace lets
> you replay any run as a test, which is the only oracle you will have.

## The idea

A **trace** is the record of one run, turn by turn. Log enough that you can rebuild
the exact request for any turn. Per turn, at minimum:

| Field | Why |
|---|---|
| full request (or hash + diff from previous) | replay, context bugs |
| response, `stop_reason` | loop bugs, truncation |
| each tool call, result size, duration, error | tool failures, latency |
| gate decisions with reasons | trust audit |
| tokens in/out, cache hits, cost | budgets |
| harness version, model id, prompt version | "what changed?" |

## Example

Stage 6's JSONL session log is most of a trace already: append-only, one entry per
event, with a parent pointer that survives a fork. Add timing, cost and versions and
it becomes a replay source. Feed the logged model replies into `MockProvider` and
the production run turns into a deterministic test.

That loop, **trace → replay → regression test**, is the bridge from bite 15
("incidents become tests") to everything in module 2.

## Privacy is a quality requirement

Traces hold user data, secrets from tool output and file contents. Redact at write
time (stage 7's redactor is the pattern), set a retention limit, and treat trace
access like production access. A trace store that leaks is an incident in itself.

## Check yourself

### Q: Users report a bad answer last Tuesday. What must the trace include to reproduce it offline?
- A: The final answer only
- B: The model replies and tool results per turn, plus the harness and prompt versions
- C: The user's rating

<details><summary>Answer</summary>

**B** — replies drive the mock; tool results and versions rebuild the requests.

</details>

### Q: Why log the prompt version separately when the full prompt is in the request?
- A: To compare runs by version without diffing large text
- B: It is required by the API
- C: It saves tokens

<details><summary>Answer</summary>

**A** — "did quality drop after prompt v14?" should be a group-by, not an
archaeology project.

</details>

## On paper

Notebook exercise **5.1**: design a trace schema on one page.

**Next:** [17 — Read fifty traces](17-read-fifty-traces.md)

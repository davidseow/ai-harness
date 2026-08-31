# 15 — pi's event list as a map of the harness

**~5 min · reading only · prerequisite: 14**

> **In one line:** A harness's event list is a map of everywhere you are allowed to
> stand — read it before the feature list, because it predicts what you can fix
> later.

## The idea

This is the most transferable lesson in the course. pi publishes a lifecycle
diagram of every point an extension can subscribe to. Read as documentation it is
useful; read as a **map of the machine** it is the best artifact in agent-harness
documentation anywhere.

From [`excerpts.md` §7](../reading/excerpts.md), verbatim:

```
pi starts
  │
  ├─► project_trust (user/global and CLI extensions only, before project resources load)
  ├─► session_start { reason: "startup" }
  └─► resources_discover { reason: "startup" }
      │
      ▼
user sends prompt ─────────────────────────────────────────┐
  │                                                        │
  ├─► (extension commands checked first, bypass if found)  │
  ├─► input (can intercept, transform, or handle)          │
  ├─► (skill/template expansion if not handled)            │
  ├─► before_agent_start (can inject message, modify system prompt)
  ├─► agent_start                                          │
  ├─► message_start / message_update / message_end         │
  │                                                        │
  │   ┌─── turn (repeats while LLM calls tools) ───┐       │
  │   │                                            │       │
  │   ├─► turn_start                               │       │
  │   ├─► context (can modify messages)            │       │
  │   ├─► before_provider_headers (can mutate headers)     |
  │   ├─► before_provider_request (can inspect or replace payload)
  │   ├─► after_provider_response (status + headers, before stream consume)
  │   │                                            │       │
  │   │   LLM responds, may call tools:            │       │
  │   │     ├─► tool_execution_start               │       │
  │   │     ├─► tool_call (can block)              │       │
  │   │     ├─► tool_execution_update              │       │
  │   │     ├─► tool_result (can modify)           │       │
  │   │     └─► tool_execution_end                 │       │
  │   │                                            │       │
  │   └─► turn_end                                 │       │
  │                                                        │
  ├─► agent_end                                            │
  └─► agent_settled (no retry/compaction/follow-up left)   │
                                                           │
user sends another prompt ◄────────────────────────────────┘

/compact or auto-compaction
  ├─► session_before_compact (can cancel or customize)
  ├─► session_compact (success)
  └─► session_compact_failed (failure or abort)
```

*(Session switching, forking, tree navigation and shutdown events omitted here —
they are in the excerpt in full.)*

## How to read it

**Read the parentheticals first.** They are the whole message:

> *can intercept, transform, or handle* · *can inject message, modify system
> prompt* · *can modify messages* · *can mutate headers* · *can inspect or replace
> payload* · **can block** · *can modify* · *can cancel or customize*

Those are **affordances**, not descriptions. An event with a verb like that is an
interceptor — you can change the outcome. An event without one (`agent_start`,
`turn_end`, `tool_execution_end`) is a notification — you can watch.

The ratio between those two categories is the single most useful thing to know
about a harness. All notifications means you can build dashboards. Interceptors at
the right points mean you can build policy.

**Then notice that the loop is still lesson 2's loop.** `turn_start` → `context` →
provider → tool events → `turn_end`, repeating while the model calls tools. Thirty
events have not changed the shape. They have made every joint in it reachable.

## The test to apply to any harness

Take a requirement and ask *"where would I hook that?"* If the answer exists, the
harness can hold your requirement. If it does not, you will be forking the harness.

| Requirement | pi's hook point |
|---|---|
| redact secrets before the model sees them | `tool_result` (can modify) |
| require approval for destructive commands | `tool_call` (can block) |
| inject retrieved context each turn | `context` (can modify messages) |
| add auth headers for a gateway | `before_provider_headers` |
| log every request for audit | `before_provider_request` |
| control what compaction keeps | `session_before_compact` (can customize) |
| refuse to load an untrusted repo's config | `project_trust` |
| stop the agent when a budget is exhausted | `turn_end` + `ctx.abort()` |

Every row in that table is a real production requirement, and every one has a
home. That is what "aggressively extensible" buys.

Compare with stage 7's five events (lesson 12): `before_request`, `after_response`,
`tool_call`, `tool_result`, `message`. Same idea, one-sixth the surface — and you
can already see which of pi's events are the load-bearing ones, because they are
the ones a toy needs first.

## The trap

**Confusing an event surface with a security boundary.** Every one of those hooks
runs arbitrary in-process code with full system access
([`excerpts.md` §2](../reading/excerpts.md)). The same `tool_result` hook that
redacts a secret can copy it somewhere; `before_provider_request` can replace the
entire payload. An extension API is a plugin system, a plugin system is a supply
chain, and pi says so directly: *"Review source code before installing third-party
packages."*

## Read this

- **[`reading/excerpts.md` §7](../reading/excerpts.md)** — the full diagram
  including session, fork, tree and shutdown events. Read it once as a map.
- **pi's `docs/extensions.md`** —
  `https://raw.githubusercontent.com/earendil-works/pi-mono/main/packages/coding-agent/docs/extensions.md`.
  ~2,700 lines. *Read:* "Lifecycle Overview", "Events", "Custom Tools → Tool
  Definition". *Skip:* everything about TUI rendering.
- **[`build/src/shared/events.ts`](../build/src/shared/events.ts)** — the
  five-event version, to see the same idea at a size you can hold in your head.

## Teach it

**The analogy.** A factory floor plan with the inspection stations marked. The
conveyor is the same in every factory. What differs is where you are allowed to
stop the line — and only some stations have a stop button.

**The question to open with.** Pick a requirement from the room — *"we must never
send customer data to the model"* — and ask *"which hook?"* Answering it forces
them through the whole lifecycle, and they will remember the diagram because they
used it.

**The 60-second version.** Read a harness's event list before its feature list.
Events with verbs like *can block* and *can modify* are interceptors; the rest are
notifications, and only interceptors let you enforce anything. The loop underneath
is unchanged — the events just make every joint reachable. And they all run
arbitrary code, so the surface is also a supply chain.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §7, §2 · verified 2026-08-31*

**Next:** [16 — pi's sessions and compaction](16-pi-sessions.md)

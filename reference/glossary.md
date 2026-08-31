# Glossary

These words are used inconsistently across the industry. This is how *this course*
uses them — stated plainly so you can translate when someone else uses them
differently.

**Model** — the weights behind an API endpoint. Stateless. Given text, it returns
text. It cannot remember, cannot act, and cannot run anything. Everything an
"agent" appears to do beyond producing text is done by something else.

**Harness** — the runtime that wraps a model and turns it into an agent: it holds
the conversation, executes tool calls, manages the context window, enforces
permissions, and decides when to stop. This course's central claim is that the
harness, not the model, determines most of what an agent is like to use.

**Scaffold** — used interchangeably with *harness* by many people. Where a
distinction is drawn, "scaffold" leans toward the prompt-and-control-flow
structure and "harness" toward the whole runtime including tool execution and
state. Don't rely on the distinction surviving a conversation.

**Agent** — a model plus a harness, pointed at a goal, allowed to loop. Not a
property of the model.

**Agent loop** — send request → if the model asked for tools, run them → append
results → send again → stop when it stops asking. Lesson 2. It is smaller than
people expect and essentially the same in every harness.

**Turn** — one pass through that loop: one request to the model and the tool
execution that follows it. Cost and latency scale with turns, which is why "how
many turns did that take" is a more useful question than "how many tokens".

**Context window** — the maximum request size the model accepts. The budget you
are managing.

**Context** — everything in the current request: system prompt, tool schemas,
message history. The agent's entire memory. Nothing outside it exists.

**Context engineering** — deciding what occupies that budget: what to include,
summarise, truncate, defer, or drop. The discipline that replaced prompt
engineering once agents ran for many turns.

**System prompt** — the instruction block sent ahead of the conversation, usually
assembled from several files on disk. Re-sent every turn, so it is a recurring
cost, not a fixed one (lesson 8).

**Tool** — a capability the harness exposes to the model as a schema. Two halves
that must not be confused: the **schema** (which is prompt — the model chooses
tools by reading it) and the **implementation** (which is code the model cannot
touch).

**Tool call / `tool_use`** — the model's *request* to run a tool. It is only ever
a request. The harness decides whether to comply, and that asymmetry is where
every safety property lives.

**Tool result / `tool_result`** — the harness's answer, paired to the call by id.
Failures come back here with `is_error`, not as thrown exceptions — a failed tool
is information the agent can recover from (lesson 7).

**Truncation** — shortening a single oversized value, usually a tool result.
Cheap, local, and safe if you *label the cut* so the model knows it saw a
fragment.

**Compaction** — replacing a span of history with a summary. Lossy by
construction. Where agents silently forget things they were told (lesson 9).

**Compaction amnesia** — the resulting failure: the agent does not know it forgot,
so it infers or invents rather than asking. No error is raised anywhere.

**Session** — the durable record of a run, typically an append-only JSONL file.
Lossless, unlike the context. Enables resume and fork (lesson 11).

**Fork** — continuing from a *prefix* of a session down a different path. Not an
undo: nothing is deleted, and the abandoned branch remains.

**Hook / lifecycle event** — a point where the harness lets you intervene. The
list of them is the most informative thing about any harness, because it tells
you what you will be allowed to change later (lesson 15).

**Permission gate** — code between "the model asked" and "the tool runs". The
actual security boundary. Not the system prompt, not the tool description, not
the model's judgement (lesson 10).

**Blast radius** — what an agent could damage if every in-process control failed.
Bounded by the environment — container, credentials, network egress — not by
prompting.

**Prompt injection** — instructions reaching the model through content it was
merely supposed to *read*: a file, a web page, a PR comment, a tool result. The
model cannot reliably tell data from instruction, so the harness must (lesson 19).

**MCP (Model Context Protocol)** — a protocol for exposing tools to agents from
external servers. Convenient, and an inbound trust boundary: an MCP server's tool
descriptions are text that reaches your model.

**Subagent** — a nested agent with its own context window, spawned to do a
sub-task and report back. A context-management technique first and a concurrency
technique second.

**Skill** — task-specific instructions loaded on demand rather than kept in the
prompt. The description stays in context; the body is read only when relevant.

**Provider** — the interface between the loop and a specific model API. Keeping
this seam clean is what lets one harness target several vendors.

**Eval** — a repeatable measurement of agent quality on real tasks. The only thing
that can tell you whether a harness change helped. Absent an eval, every
prompt change is a matter of opinion.

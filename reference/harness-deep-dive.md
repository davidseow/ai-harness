# Harness deep dive — Claude Code, Codex CLI, OpenCode

**A critical read of the three most-used agent harnesses against the one this course
builds.** Where `harness-comparison.md` sets out the taxonomy and dissects pi.dev,
this file does the opposite job: it takes three harnesses people actually run,
compares them subsystem by subsystem to the seven stages in [`build/`](../build/),
and says plainly where the course's model is right, where it is thin, and where it
is now wrong.

*All URLs verified 2026-09-16. Figures are attributed to their source; secondary
analyses are marked as such.*

---

## 1. Why these three

The course claims to teach how real harnesses work. That claim is only as good as
the specimens. So the selection is by measured adoption, not by taste.

JetBrains' Developer Ecosystem Survey 2026 (10th edition, 15,000+ professional
developers, fielded May–July 2026) reports 90% of professional developers using AI
coding agents at least weekly, 68% daily, with this ranking:

| Tool | Adoption | Note |
|---|---|---|
| **Claude Code** | **39%** (47% US) | most-used AI coding tool outright; 2× GitHub Copilot |
| GitHub Copilot | 21% | *declining* from 29% YoY; 39% of its users reach it via JetBrains IDEs |
| **Codex** | **16%** | up from 3% in January 2026; awareness 27% → 65% |
| Cursor | 12% | down from 18% in January; biggest drop in China (28% → 16%) |
| JetBrains AI / Junie | 9% | |
| **OpenCode** | **7%** | 42% mindshare |
| Google Antigravity | 6% | 15% in India |

`https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/`

**Who is in, and why.** Claude Code and Codex CLI are the top two by a wide margin.
The third slot is contested, and the case for OpenCode over Copilot or Cursor is
that this course is about *harnesses* — the loop, context management, tool
orchestration ([lesson 05](../lessons/05-build-or-buy.md)) — and Copilot and Cursor
are principally IDE products whose harness is not inspectable. OpenCode is a CLI
harness in the same shape as the course's `build/`, it leads the category on GitHub
stars (~182k, versus ~147k for Codex as of April 2026), and its source can be read,
which means every architectural claim below can be checked rather than believed.

**Who is out.** Gemini CLI does not appear in the JetBrains ranking at all, which is
the most interesting negative result in the table and a caution against picking
specimens from launch coverage. Cursor is falling, not rising. Copilot is a
different product category.

**And pi.dev, which this course spends five lessons on, does not register in the
survey.** That is not a reason to cut it — pi is an unusually good *teaching*
specimen precisely because it is small, opinionated and thoroughly documented, and a
course needs a harness you can hold in your head. But the course should say so out
loud, because a reader currently finishes module 3 with a detailed model of a
harness almost nobody runs and no model at all of the two that 55% of developers do.
See §6.

---

## 2. The three theses

| | **Claude Code** | **Codex CLI** | **OpenCode** |
|---|---|---|---|
| Bet | good defaults save more time than they cost | the OS is the security boundary, not the prompt | own nothing you can configure; own the model choice |
| Shape | single process, batteries included | single process, sandbox-first | **HTTP server + detachable clients** |
| Model | Anthropic | OpenAI (GPT-5.x Codex) | **any — 75+ providers via models.dev** |
| Config | `settings.json`, layered scopes | `config.toml` | `opencode.json` |
| Instructions file | `CLAUDE.md` + `.claude/rules/*.md` | `AGENTS.md` | `AGENTS.md` |
| Extension surface | ~28 hook events, 5 handler types, skills, subagents, plugins, MCP | 12 hook events, MCP | plugins, custom agents, MCP |
| Security boundary | OS sandbox **for Bash only** + permission system | OS sandbox for everything, by default | permission gate only |

The row that matters most is the last one, and §3.5 is about it.

---

## 3. Stage by stage against `build/`

The course builds seven stages. Each subsection takes one, states what
[`build/src/`](../build/src/) does, and puts the three harnesses beside it.

### 3.1 Stage 1 — the loop and the provider seam

`build/src/shared/loop.ts` runs `runLoop()` against a `Provider` interface, with
`MockProvider` and `AnthropicProvider` behind the same seam. The pedagogical point —
put the model behind an interface and develop for free — holds up completely.

**Where the real ones differ:** two of three do not draw the seam where the course
does.

- **OpenCode draws it much further out.** It delegates the entire provider layer to
  the Vercel AI SDK and pulls model metadata from `models.dev`, so adding a provider
  is data, not code. The loop is AI SDK `streamText` inside `Session.prompt`, with a
  hard stop condition reported as `steps.length >= 1000 || processor.getShouldStop()`
  (source-code walkthrough, secondary: `https://cefboud.com/posts/coding-agents-internals-opencode-deepdive/`).
- **Codex draws it further in.** It is coupled to a specific model family and, per
  OpenAI's own description, to "a custom API layer" that performs context compaction
  server-side — meaning part of what the course teaches as stage 4 does not live in
  the harness at all.

**The course's gap:** `Provider` is modelled as a pure function of
`(messages, tools) → response`. In Codex, the provider layer has state and policy in
it. In OpenCode, the seam is a registry, not an interface. Neither is visible from
stage 1.

**A hard stop condition is missing entirely.** `runLoop()` has `LoopOptions`, but the
course never makes the point that an agent loop needs a step ceiling as a matter of
course. OpenCode's `>= 1000` is a one-line fix and a one-paragraph lesson.

### 3.2 Stage 2 — tools

`build/src/shared/tools.ts` ships five (`read`, `write`, `edit`, `bash`, `ls`),
`DEFAULT_TOOLS`, and a `ToolRegistry`. Lesson 07's schema-is-prompt and
failures-as-results points are correct and universal.

OpenCode's built-in set, for comparison: `ReadTool`, `WriteTool`, `EditTool`,
`BashTool`, `GlobTool`, `GrepTool`, `ListTool`, `WebFetchTool`, `TodoWriteTool`,
`TodoReadTool`, `TaskTool`. Codex centres on `Bash` and `apply_patch` plus MCP and
function tools.

**Two things the five-tool set cannot teach:**

1. **Search is a separate tool from read, for a reason.** Every real harness splits
   `grep`/`glob` out. The course's `ls` + `read` forces the model to page through
   files, which is exactly the token behaviour lesson 08 warns about — the harness's
   own tool surface causes it.
2. **`TaskTool` — the subagent.** All three ship one. The course has no stage for it
   and no lesson on it. See §4.3.

**A real omission the course does cover implicitly but should state:** OpenCode runs
LSP diagnostics after an edit (`LSP.touchFile` then `LSP.diagnostics()`) and feeds
them back as tool output. This is the cheapest reliability mechanism in any of the
three — the harness tells the model it broke the build before the model asks — and
it is invisible in the course's model, where a tool result is whatever the tool
returned.

### 3.3 Stage 3 — prompt assembly

`stage3-prompt.ts` assembles a layered system prompt from disk and prices it as rent
(size × turns × sessions). This is the course at its best and matches all three:
Codex reads `AGENTS.md` "at startup and concatenated into a layered instruction
chain"; Claude Code layers `CLAUDE.md` plus `.claude/rules/*.md`.

**One mechanism the course misses, and it is a good one.** Codex does not just
assemble the prompt at startup and leave it. Per its documented behaviour, when the
sandbox configuration or approval mode changes mid-session, it **inserts a new
developer-role message** restating the permissions instructions; when the working
directory changes, it inserts a new user-role message restating the environment
context.

That is a direct, concrete demonstration of [lesson 03](../lessons/03-context-is-the-only-state.md)'s
thesis by a production harness: policy that is not in the transcript does not exist,
so when policy changes, the harness re-states it into the transcript. The course
asserts "context is the only state"; Codex's message-insertion behaviour is the
proof, and it belongs in lesson 03.

**A second gap, and this one is about the reader rather than the author.**
[Lesson 08](../lessons/08-stage3-prompt.md) prices the system prompt as rent and
tells the *harness author* not to edit it mid-session. But most people meet this
mechanism from the other side — they run one of these three, they never place a
`cache_control` breakpoint in their life, and the prefix rule reaches them as a
handful of commands that quietly reset their session's cache.

Claude Code is the worked example. Everything below follows from the invalidation
hierarchy in lesson 08; only the command names are product-specific.

| What you do | What it invalidates | What you feel |
|---|---|---|
| `/model` mid-session | **Everything** — caches are model-scoped, and this is the one change with no escape hatch | Next turn re-prefills the whole conversation |
| `/fast` toggle | System + messages — `speed` is a request parameter | One expensive turn |
| `/compact`, or auto-compact | Messages from the summary onward; tools and system survive | The classic "why was *that* turn slow" |
| `/clear`, or a new session | Everything, by definition | Full re-prefill of whatever you re-prime it with |
| A gap longer than the TTL | The entry expires | First message back is slow and charged in full |
| Editing `CLAUDE.md` mid-session | Depends where the harness puts it — see below | Possibly nothing, possibly a rebuild |
| Connecting or removing an MCP server | Classically everything, since tools render at position 0 — see below | Possibly nothing now |

**Two of those rows cannot be settled from the API mechanism**, and it is worth
saying so rather than guessing:

- **`CLAUDE.md` mid-session.** Whether an edit is re-read at all, and whether it
  lands in the cached `system` prefix or is injected into `messages` after it, is
  the harness's choice. The second is free; the first is a rebuild.
- **MCP servers mid-session.** The old answer was "a full rebuild, tools are at
  position 0". Two mechanisms now avoid it — tool search *appends* schemas rather
  than swapping the list, and `tool_addition` / `tool_removal` blocks (Opus 5
  onward) change the tool set without touching the prefix. Sessions running
  deferred tools loaded on demand are visibly using the first. Whether a given
  harness routes an MCP connect through either is not something the docs settle.

**The habits that follow** are short, and they are most of the available leverage:

1. **Choose the model at the top of a session.** It is the only change with no
   escape hatch. For a cheaper sub-task, spawn a subagent — separate context,
   separate cache namespace, the main loop's prefix untouched.
2. **Let sessions run; do not `/clear` and re-prime.** A long session has a huge
   prefix, but it is *cached* — roughly 0.1× per turn. A fresh session pays 1× to
   rebuild whatever you feed it. Re-priming is the expensive move, not continuing.
3. **Expect exactly one slow turn after `/compact`** or a long break. That is the
   cache re-forming at the new prefix, not a fault.
4. **Stable context in `CLAUDE.md`, volatile context in the conversation.**
   Conventions and architecture belong in the file that is read once at startup and
   sits in the cached front. Anything that changes — today's state, a ticket, the
   current test output — belongs in a message, where it invalidates nothing ahead
   of it. This is lesson 08's rule restated for the person at the keyboard.
5. **Do not thrash MCP servers mid-session** until you know which path your setup
   takes.

**Observing it.** The ground truth is the same two `usage` fields a harness author
reads: `cache_read_input_tokens` and `cache_creation_input_tokens`. Claude Code
surfaces a per-session cost and usage summary. The healthy signature is reads
dominating and growing turn over turn while writes stay small — just the last
turn's delta. Writes near the full conversation size on every turn mean something
upstream is rewriting the prefix.

**On the TTL.** The public default is 5 minutes, with a 1-hour option at double the
write price. A Claude Code session observed on 2026-09-20 reported running on the
1-hour TTL, dropping to 5 minutes if the account enters usage overage. That is an
observation from one running session, not a documented guarantee — but it changes
the "I walked away from the terminal" arithmetic by a factor of twelve, so it is
worth knowing which one you are on.

**The honest size of this.** As a user your leverage is genuinely small: do not
churn model, mode or tools mid-session, and do not reflexively `/clear`. The
prefill economics matter enormously when you are *building* a harness, which is why
the course puts them in a lesson about writing one. When you are running one, they
mostly explain why certain turns feel slow — which is worth knowing precisely, so
you stop wondering.

### 3.4 Stage 4 — context

`build/src/shared/context.ts` gives `truncateToolResult()` (at
`DEFAULT_MAX_RESULT_CHARS = 400`), `historyTokens()` and `compact()`, and
`stage4-context.ts` proves a user-stated fact left the wire request. The
demonstration is excellent and the lesson on silent amnesia is the strongest in
module 2.

**What the real harnesses add:**

| | Course | OpenCode | Codex | Claude Code |
|---|---|---|---|---|
| Trigger | manual in the stage | `tokens > (context − outputLimit) × 0.9` | API-layer compaction | automatic, plus `/compact` |
| Who summarises | inline `compact()` | **a dedicated `compaction` agent** | server-side | the model |
| Hookable | — | — | `PreCompact` / `PostCompact` (both can block) | `PreCompact` |

Two findings worth folding back:

- **Compaction is a separate agent with its own prompt.** OpenCode ships `compaction`
  as one of six built-in agents (alongside `build`, `plan`, `explore`, `general`,
  `title`). The course models compaction as a function; treating it as a *prompted
  model call you can configure* is the more useful mental model, and it explains why
  compaction quality varies.
- **The threshold is a real number and it is not 100%.** `× 0.9` of
  `(context − outputLimit)` is a concrete figure the course can quote instead of
  hand-waving "when it gets full".
- **Codex can block its own compaction from a hook.** `PreCompact` and `PostCompact`
  both carry deny semantics — the interception point lesson 09 says you want, shipped.

### 3.5 Stage 5 — permissions. **This is where the course is now wrong.**

`build/src/shared/permissions.ts` implements `Gate`, `Policy`, `defaultPolicy` and an
`AuditEntry` log, and `stage5-permissions.ts` attempts two destructive acts and then
checks the disk to prove they were blocked. The negative test is exemplary and
[lesson 10's trap](../lessons/10-stage5-permissions.md) — "a guardrail nobody has
watched fire is a belief, not a control" — is the single most useful sentence in the
course.

The problem is the thesis above it:

> The model can only ever **ask**. Between the ask and the action there is a function
> you control, and **that function is the entire security boundary of your agent.**
> — `lessons/10-stage5-permissions.md`

All three harnesses now disagree, and two of them disagree by default.

**Codex CLI.** The user picks a *sandbox mode* and an *approval policy*, separately:

- Sandbox: `read-only` · `workspace-write` (**default**) · `danger-full-access`
- Approval: `on-request` · `never` · `untrusted` (deprecated in favour of `trust_level`)
- Enforcement: macOS Seatbelt via `sandbox-exec`; Linux `bwrap` + seccomp; Windows
  via WSL2 or a native implementation with elevated/unelevated modes
- **Network is off by default** in `workspace-write`; when enabled, domain
  allowlisting where `*.example.com` matches subdomains and `deny` overrides `allow`

In this design the approval prompt is the *exception path* for actions that exceed
the sandbox. The boundary is the kernel.

**Claude Code.** Ships an OS-level Bash sandbox: Seatbelt on macOS, `bubblewrap` +
`socat` on Linux/WSL2, no native Windows. Default scope is write to the working
directory and below, read everywhere except explicit denies, network by domain
allowlist through a proxy. It also protects config paths *inside* the writable
region — `.claude/` settings, `skills`, `agents`, `commands`, `hooks`, `.mcp.json`,
shell startup files, `.git/hooks` — with the stated rationale that "a command that
could edit those files could grant itself permissions, or add a hook or MCP server
that Claude Code runs outside the sandbox."

That is a privilege-escalation class the course does not mention anywhere: **the
agent writes to the harness's own configuration and widens its next run.** It
belongs in [`pitfalls.md`](pitfalls.md) with an ID.

**But the scope is narrower than the headline.** Claude Code's own documentation is
explicit that the sandbox isolates Bash subprocesses only:

> Built-in file tools: Read, Edit, and Write use the permission system directly
> rather than running through the sandbox.

MCP servers and hooks also run on the host. So Claude Code is genuinely a *hybrid*:
kernel enforcement for shell, in-process gate for file edits. The course's model
describes exactly half of it.

**And it fails open.** If the sandbox cannot start — missing dependencies,
unsupported platform — Claude Code warns and runs commands unsandboxed unless
`sandbox.failIfUnavailable` is set to `true`. A guardrail that silently degrades is
precisely the failure mode lesson 10's trap is about, and it is in the default
configuration of the most-used harness in the world.

**OpenCode.** Has no OS sandbox; the permission gate *is* the boundary, which makes
it the one harness that matches the course's model. Its config is three values —
`allow`, `ask`, `deny` — applied per tool, with object syntax for bash patterns
(`"git *": "allow"`, `"rm *": "deny"`), per-agent overrides merged over the global
config, and last-matching-rule-wins. Per-agent filesystem boundaries are an open
feature request (`anomalyco/opencode` issue #5529), which is the clearest available
evidence that no filesystem boundary exists today.

**What the course should say instead.** The gate is the boundary between *asked* and
*ran*. It is not the boundary between *ran* and *did damage*. Those are two different
controls at two different layers, and the industry has spent 2026 moving the second
one into the kernel. The course already knows this — `harness-comparison.md` §2 ends
with the observation that pi's "no permission system" is coherent only because it is
paired with "run in a container". That paragraph is correct and it invalidates
lesson 10's thesis sentence; the two files currently contradict each other.

### 3.6 Stage 6 — sessions

`build/src/shared/session.ts` is an append-only JSONL log with `seq` and `parent`,
and `stage6-sessions.ts` demonstrates resume across a process boundary and fork from
a prefix. Lesson 11's claim that fork beats most prompt work is right and
under-appreciated.

**The finding that challenges the course's spine.** OpenCode snapshots the
*filesystem* alongside the conversation, using `git write-tree` to capture workspace
state and `git read-tree` to restore it when a tool call fails.

Consider that against [lesson 03](../lessons/03-context-is-the-only-state.md): *"Context
is the only state."*

As a claim about the **model**, that is exactly right and the course should keep
saying it. As a claim about the **harness**, it is false the moment a tool writes to
disk, and it is false in a way that matters: you cannot fork a session usefully if
forking rewinds the transcript but leaves the working tree at the other branch's
state. The course's `build/src/shared/workspace.ts` has `freshWorkspace()` and
`seed()` — the machinery is there — but stage 6 forks the log only, so the course
demonstrates a fork that a real harness would consider broken.

This is the most valuable single correction in this document. It is also cheap to
make: one paragraph in lesson 03 distinguishing model state from system state, and
one in lesson 11 noting that fork has a filesystem half.

### 3.7 Stage 7 — extensions, and the course's own heuristic turned on its subject

`build/src/shared/events.ts` defines five events — `before_request`,
`after_response`, `tool_call` (returning a string denies), `tool_result`, `message` —
and `stage7-extensions.ts` adds a sixth tool, secret redaction, an injected reminder
and the gate without touching `loop.ts`, `tools.ts` or `context.ts`. As a
demonstration that a small event bus buys real extensibility, it works.

[`harness-comparison.md`](harness-comparison.md) §3 gives the right heuristic:

> Read the event list before the feature list. Count *interceptors* (can block, can
> modify, can cancel), not events.

The course never applies it to Claude Code. Applied, with numbers:

| | Events | **Can block** | Can modify input |
|---|---|---|---|
| Course (stage 7) | 5 | 1 (`tool_call`) | 0 |
| **Codex CLI** | 12 | **8** | **1** (`PreToolUse` rewrites input) |
| **Claude Code** | ~28 | **~8**, plus 2 decision-field events | **2** (`UserPromptSubmit` adds context; `PreToolUse` `updatedInput`) |
| **OpenCode** | plugin hooks + a largely *observational* SSE stream | via permission config | — |

Codex's blocking set: `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`,
`PostCompact`, `UserPromptSubmit`, `SubagentStop`, `Stop`. Configured as
`[[hooks.EventName]]` in `config.toml`, **enabled by default and documented as
production-ready, not experimental**. Since v0.148.0 (2026-08-17) hooks can run
asynchronously and can invoke an MCP tool directly via an `mcp_tool` handler rather
than shelling out. Codex also runs a trust gate on hooks themselves: a non-managed
hook prompts for review on first execution and re-prompts if the script changes —
a control none of the others documents and one the course's guardrail catalogue
should steal.

Claude Code's blocking set: `PreToolUse`, `UserPromptSubmit`, `UserPromptExpansion`,
`Stop`, `SubagentStop`, `PreModelSwitch`, `WorktreeCreate`, `WorktreeRemove`, plus
`PermissionRequest` (a `decision` field rather than exit 2) and `PermissionDenied`
(`retry: true`). Handlers can be `command`, `http`, `mcp_tool`, `prompt` or `agent` —
the last two mean **a hook can be an LLM call**, a category the course's model of a
hook as "a function you write" does not contain.

OpenCode is the interesting case for the heuristic. The event names surfaced by its
stream — `start-step`, `finish-step`, `tool-call`, `tool-result`, `tool-error`,
`text-start`, `text-delta`, `text-end` — are AI SDK streaming events broadcast over
SSE to clients. They tell you what happened; they are not primarily where you stand
to stop it. Interception lives in the permission config and in plugins instead. This
is a real trap for the course's heuristic as written: **counting event names without
checking whether the bus is a control plane or a telemetry plane gives the wrong
answer.** The heuristic should say so.

---

## 4. What the course's model omits entirely

Four gaps, ordered by how much they change the picture.

### 4.1 The OS is a layer, and the course has no name for it

Covered in §3.5. The course's architecture has exactly one enforcement point. Two of
three production harnesses have two, in different address spaces, with different
failure modes — including Claude Code's fail-open default. There is no stage, no
glossary entry, and no pitfall ID for this.

### 4.2 The filesystem is state

Covered in §3.6. `git write-tree` as session state is a genuinely good idea the
course can demonstrate in about fifteen lines.

### 4.3 Subagents

All three ship a subagent mechanism; the course has no stage and no lesson. This is
defensible — it is one more capability and the course has to stop somewhere — except
that it interacts with everything the course *does* teach, and the interactions are
not obvious:

- **Context:** a subagent has its own window, so it is the one mechanism that makes
  the token arithmetic of lesson 08 come out differently.
- **Permissions:** Claude Code documents that subagents run in the *same process* and
  under the *same sandbox configuration* as the parent. So a subagent is a context
  boundary, not a security boundary — a distinction people routinely get backwards.
- **Events:** both Claude Code and Codex expose `SubagentStart`/`SubagentStop`, and
  in both, `SubagentStop` can block.

A stage 8 is the natural home. Failing that, one lesson in module 4 stating the
context-boundary-not-security-boundary point would cover the dangerous part.

### 4.4 Process architecture, and who supplies the model

[Lesson 05](../lessons/05-build-or-buy.md)'s 2×2 is *who writes the loop* × *who
hosts it*. OpenCode does not sit in a cell cleanly, for two reasons:

- **It is a headless HTTP server with detachable clients.** Bun + Hono backend, a Go
  TUI compiled separately, SSE for updates, and a type-safe SDK generated from an
  OpenAPI spec so any HTTP client — desktop, web, mobile, a CI script — can drive the
  same session. "You host" does not distinguish *one process that owns the terminal*
  from *a service your terminal is one client of*, and that difference determines
  whether you can attach a second client, run headless in CI, or hand a session off.
- **The model is a third axis.** Every cell in the 2×2 quietly assumes the harness
  vendor is the model vendor. OpenCode's entire position is that these are separable.
  A reader using the course's taxonomy to choose a harness in 2026 has no box for
  "I need to switch providers" — which, given per-token pricing and enterprise
  procurement, is one of the top reasons teams pick a harness.

**Suggested fix:** keep the 2×2 (it earns its place) and add a third question after
it — *who supplies the model, and can you change your mind?*

---

## 5. Claims in the course to correct

Concrete, with locations. Ordered by severity.

| # | Where | Claim | Status |
|---|---|---|---|
| 1 | `lessons/10-stage5-permissions.md`, thesis | "that function is the entire security boundary" | **Wrong as stated.** Contradicted by Codex and Claude Code, and by `harness-comparison.md`'s own container paragraph. Rewrite as: the gate is the boundary between *asked* and *ran*; the sandbox is the boundary between *ran* and *did damage*. |
| 2 | `lessons/03-context-is-the-only-state.md`, thesis | "Context is the only state" | **True of the model, false of the harness.** Add the distinction; cite OpenCode's `git write-tree`. |
| 3 | `reference/harness-comparison.md` §2, Permissions row | Claude Code = "permission modes, allowlists, per-call prompts" | **Incomplete.** Omits the OS sandbox entirely, which is now the more important half. |
| 4 | `reference/harness-comparison.md` §2, Built-in tools row | Claude Code = "a larger set, plus web, search and task tools" | **Vague** where every pi row is exact. Either enumerate it or say it is unenumerated and why. |
| 5 | `reference/harness-comparison.md` §2, Compaction row | Claude Code = "automatic context management" | **Vague.** Concrete figures exist — OpenCode's 0.9 threshold, `PreCompact`/`PostCompact` in both vendor harnesses. |
| 6 | `reference/harness-comparison.md` §3, heuristic 1 | "Count interceptors, not events" | **Right but under-specified.** Add: check whether the bus is a control plane or a telemetry plane. OpenCode's SSE stream is the counterexample. |
| 7 | `lessons/05-build-or-buy.md`, the 2×2 | two axes: who writes the loop, who hosts | **Missing two axes**: process architecture, and who supplies the model. |
| 8 | `lessons/11-stage6-sessions.md` | fork = fork the log | **Half a fork.** A fork without a workspace snapshot desynchronises transcript and disk. |
| 9 | `reference/pitfalls.md` | — | **Missing a class:** agent writes to the harness's own config (`.claude/`, `hooks`, `.mcp.json`) and widens its next run. Claude Code's protected-paths list is the mitigation to cite. |
| 10 | `reference/guardrails.md` | — | **Missing a control:** fail-closed sandboxing. `sandbox.failIfUnavailable` is the verify-it-fires example the catalogue's format asks for. |

None of these is a research error. Every one is the course being accurate about 2026's
harnesses as of the pi-centred reading in August and the field having moved — which
is itself the point `README.md`'s "On evidence" section makes about secondary sources
drifting fast. The fix is the same one the README already models: record the
correction rather than quietly patching it.

---

## 6. Does the teaching sequence match how these were built?

Mostly yes. Two structural notes.

**The stage order is right, and it is not the order the field evolved in.** Stages
1 → 2 → 3 → 4 → 5 → 6 → 7 build capability-by-capability, each strictly depending on
the last, which is the correct *pedagogical* order and the course should not change
it. But it teaches permissions at stage 5 as something you add to a working agent.
Codex's design starts from the sandbox and treats the agent as the thing running
inside it. A reader who internalises the course's order will reach for a gate and
bolt it on; a reader who internalises Codex's will reach for a container first. One
sentence at the top of lesson 10 — *"a real harness usually chooses containment
before it chooses a gate"* — costs nothing and inoculates against the bolt-on habit.

**Extensions last is the wrong signal, even though it is the right dependency
order.** Stage 7 lands as the optional epilogue. In all three harnesses the event bus
is load-bearing infrastructure: Codex ships hooks enabled by default and
production-ready; Claude Code exposes ~28 events with five handler types including
LLM-backed handlers; the entire practical argument of module 3 (pi) is that the
extension surface *is* the product. The course's own heuristic ranks the event list
above the feature list. Module 2 ranks it last. Keep the order, fix the framing:
lesson 12 should open by saying this is the part you will actually touch.

**The evidence base is lopsided, and it is fixable cheaply.** Five of twenty-one
lessons dissect a harness with no measurable adoption, while the two harnesses used
by 55% of developers appear only as comparison rows. Module 3 is good teaching and
should stay. But `reading/excerpts.md` sets an excellent standard — verbatim,
dated, offline-checkable — and nothing stops a second excerpts file doing the same
for Claude Code's hooks and sandboxing docs and Codex's hooks and approvals docs.
Those are the two primary sources this document leans on hardest, and they are as
quotable as pi's.

---

## 7. Choosing between them

Pros and cons that are actually decision-relevant, rather than feature counts.

**Claude Code** — *choose when the defaults are probably right and you want the
deepest escape hatches when they are not.*

- **For:** the largest interception surface of the three (~28 events, five handler
  types, including hooks that are themselves LLM calls); hybrid enforcement with a
  real OS sandbox; credential masking; managed settings that let an administrator pin
  policy so a checked-out project cannot loosen it.
- **Against:** the sandbox covers Bash and its children only — `Read`, `Edit`,
  `Write`, MCP servers and hooks run on the host; it **fails open** by default when
  the sandbox cannot start; and the configuration surface is large enough that a
  wrong `allowWrite`, a broad `allowedDomains` entry or an `excludedCommands`
  exception can quietly undo the other layer. Single vendor.

**Codex CLI** — *choose when you want containment to be the default rather than a
configuration you remembered.*

- **For:** sandbox mode and approval policy as separate, explicit first-class
  choices; network off by default; kernel enforcement across platforms; hooks on by
  default, production-ready, with async and direct MCP-tool handlers; a trust gate on
  hook scripts themselves; strong Terminal-Bench 2.1 results (83.4% on GPT-5.5 Codex).
- **Against:** fewer events than Claude Code (12) and a much smaller ecosystem of
  skills/plugins; part of the harness — compaction — lives in a proprietary API layer
  you cannot inspect or intercept locally; single vendor, and the most tightly
  model-coupled of the three.

**OpenCode** — *choose when provider independence or a detachable client matters more
than containment.*

- **For:** 75+ providers, model choice as configuration; genuinely readable source;
  server/client split enabling headless CI, multiple clients and session hand-off;
  filesystem snapshots via git so a failed tool call can be rolled back; per-agent
  permissions with pattern matching; LSP diagnostics fed back after edits.
- **Against:** **no OS-level sandbox** — the in-process permission gate is the whole
  boundary, which is the position the course teaches and the one the other two have
  moved away from; per-agent filesystem boundaries are an open feature request; the
  event stream is largely telemetry rather than interception; lowest adoption of the
  three, so fewer people have hit the sharp edges before you.

**The one thing not to get wrong.** The same shape of error `harness-comparison.md`
identifies for pi applies here in reverse. pi's minimal core is coherent *because*
it is paired with a container; adopting the core without the container is the
position with its safety half removed. OpenCode is in the same place: it is a
defensible design run inside a VM or dev container, and a very different proposition
run on a laptop with production credentials in the environment. Meanwhile Claude Code
users frequently assume the sandbox covers everything, when it covers Bash — and
Codex users get containment by default and may never learn where the line is. All
three failure modes are the same mistake: **not knowing which layer is holding.**

---

## 8. Sources

**Adoption**
- JetBrains, *AI Coding Agents: Adoption Trends*, Developer Ecosystem Survey 2026
  (15,000+ developers, May–July 2026) —
  `https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/`

**Claude Code — primary**
- Hooks reference (event table, block semantics, handler types) —
  `https://code.claude.com/docs/en/hooks`
- Sandboxing reference (Seatbelt/bubblewrap, defaults, protected paths, fail-open,
  what is *not* sandboxed) — `https://code.claude.com/docs/en/sandboxing`
- Agent SDK — `https://code.claude.com/docs/en/agent-sdk`
- Prompt caching (prefix rule, render order, read/write multipliers, TTLs,
  invalidation hierarchy, `usage` fields) —
  `https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching` —
  verified 2026-09-20

**Codex CLI — primary**
- Hooks (12 events, `config.toml` syntax, enabled by default) —
  `https://developers.openai.com/codex/hooks` (redirects to `https://learn.chatgpt.com/docs/hooks`)
- Agent approvals & security (sandbox modes, approval policies, network allowlisting) —
  `https://developers.openai.com/codex/agent-approvals-security`
  (redirects to `https://learn.chatgpt.com/docs/agent-approvals-security`)
- *Unrolling the Codex agent loop*, OpenAI — `https://openai.com/index/unrolling-the-codex-agent-loop/`

**Codex CLI — secondary**
- v0.148.0 async hooks and MCP tool hooks (2026-08-17) —
  `https://codex.danielvaughan.com/2026/08/25/codex-cli-v0148-async-hooks-mcp-tool-hooks-background-execution-mcp-integration/`
- ZenML LLMOps database, Codex CLI architecture and agent loop design —
  `https://www.zenml.io/llmops-database/building-production-ready-ai-agents-openai-codex-cli-architecture-and-agent-loop-design`

**OpenCode — primary**
- Permissions (`allow`/`ask`/`deny`, bash patterns, per-agent merge) —
  `https://opencode.ai/docs/permissions/`
- CLI reference — `https://opencode.ai/docs/cli/`
- Per-agent filesystem boundaries, open feature request — `anomalyco/opencode` issue #5529

**OpenCode — secondary (source-code walkthroughs)**
- Moncef Abboud, *How Coding Agents Actually Work: Inside OpenCode* — loop, storage,
  tool registry, summarisation threshold, git snapshots —
  `https://cefboud.com/posts/coding-agents-internals-opencode-deepdive/`
- Gavin Yap, *How OpenCode Actually Works: An Architecture Guide Backed by Source Code* —
  `https://medium.com/@maclarensg_50191/how-opencode-actually-works-an-architecture-guide-backed-by-source-code-939811f0434f`

**Cross-harness**
- *State of CLI Coding Agents, Mid-2026* — `https://blog.arcbjorn.com/state-of-cli-coding-agents-2026`
- *Best Terminal AI Coding Agents in 2026* (star counts, category framing) —
  `https://amux.io/blog/best-terminal-ai-coding-agents-2026/`

---
*Compared against: [`build/src/`](../build/src/) stages 1–7 ·
[`reference/harness-comparison.md`](harness-comparison.md) ·
lessons [03](../lessons/03-context-is-the-only-state.md),
[05](../lessons/05-build-or-buy.md), [10](../lessons/10-stage5-permissions.md),
[11](../lessons/11-stage6-sessions.md), [12](../lessons/12-stage7-extensions.md) ·
verified 2026-09-16*

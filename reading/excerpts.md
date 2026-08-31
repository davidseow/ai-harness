# Excerpts — the primary sources, quoted

Everything the lessons claim about pi.dev is quoted here **verbatim** from pi's own
repository, so you can read the evidence without a network connection and check
any claim against its source.

Fetched from `https://raw.githubusercontent.com/earendil-works/pi-mono/main/…`
on **2026-08-31**. pi moves fast; re-fetch before teaching from this.

> **A correction worth recording.** Secondary write-ups of pi commonly say it ships
> "four tools" and a "sub-1,000-token system prompt". Neither figure appears in
> pi's own documentation. The verified tool list is **eight** (§4 below), and the
> prompt size is not stated anywhere in the docs. Both numbers are dropped from
> this course. The minimal-core thesis does not need them — §1 states it far
> better, in pi's own words.

---

## 1. The philosophy — what pi refuses to build

*Source: `packages/coding-agent/README.md`, "Philosophy"*

> Pi is aggressively extensible so it doesn't have to dictate your workflow.
> Features that other tools bake in can be built with extensions, skills, or
> installed from third-party pi packages. This keeps the core minimal while
> letting you shape pi to fit how you work.
>
> **No MCP.** Build CLI tools with READMEs (see Skills), or build an extension
> that adds MCP support.
>
> **No sub-agents.** There's many ways to do this. Spawn pi instances via tmux, or
> build your own with extensions, or install a package that does it your way.
>
> **No permission popups.** Run in a container, or build your own confirmation
> flow with extensions inline with your environment and security requirements.
>
> **No plan mode.** Write plans to files, or build it with extensions, or install
> a package.
>
> **No built-in to-dos.** They confuse models. Use a TODO.md file, or build your
> own with extensions.
>
> **No background bash.** Use tmux. Full observability, direct interaction.

Six refusals, and every one of them names the extension point that replaces it.
This is the clearest statement of the minimal-core position in any agent harness
documentation, and it is what makes pi a useful teaching subject: the boundaries
are stated rather than implied.

---

## 2. Security — the stance stated plainly

*Source: `README.md` (repo root), "Permissions & Containerization"*

> Pi does not include a built-in permission system for restricting filesystem,
> process, network, or credential access. By default, it runs with the permissions
> of the user and process that launched it.

*Source: `packages/coding-agent/README.md`, "Pi Packages"*

> **Security:** Pi packages run with full system access. Extensions execute
> arbitrary code, and skills can instruct the model to perform any action
> including running executables. Review source code before installing third-party
> packages.

Read those two together. pi is not careless about security — it is explicit that
the boundary lives at the **process**, not inside the agent. That is a coherent
position, and a demanding one: it only holds if you actually containerise.

---

## 3. Context files — the system prompt is assembled from disk

*Source: `packages/coding-agent/README.md`, "Context Files"*

> Pi loads `AGENTS.md` (or `CLAUDE.md`) at startup from:
> - `~/.pi/agent/AGENTS.md` (global)
> - Parent directories (walking up from cwd)
> - Current directory
>
> If a directory contains `AGENTS.override.md`, Pi loads it instead of `AGENTS.md`
> or `CLAUDE.md` from that directory. Context files from other directories are
> still concatenated.
>
> Use for project instructions (`AGENTS.md`/`CLAUDE.md`), conventions, common
> commands. All matching files are concatenated.
>
> Disable context file loading with `--no-context-files` (or `-nc`).

*"System Prompt", same file:*

> Replace the default system prompt with `.pi/SYSTEM.md` (project) or
> `~/.pi/agent/SYSTEM.md` (global). Append without replacing via `APPEND_SYSTEM.md`.

---

## 4. The built-in tools — the verified list

*Source: `packages/coding-agent/README.md`, "Tool Options"*

> | Option | Description |
> |--------|-------------|
> | `--tools <list>`, `-t <list>` | Allowlist specific tool names across built-in, extension, and custom tools |
> | `--exclude-tools <list>`, `-xt <list>` | Disable specific tool names across built-in, extension, and custom tools |
> | `--no-builtin-tools`, `-nbt` | Disable built-in tools by default but keep extension/custom tools enabled |
> | `--no-tools`, `-nt` | Disable all tools by default |
>
> Available built-in tools: `read`, `bash`, `powershell` (Windows), `edit`,
> `write`, `grep`, `find`, `ls`

Eight names, seven of them cross-platform. Note that the tool set is a **runtime
allowlist**, not a compile-time fact — which matters, because the tool list is
part of the cached prompt prefix.

---

## 5. Sessions — JSONL, and a tree rather than a list

*Source: `packages/coding-agent/README.md`, "Sessions"*

> Sessions are stored as JSONL files with a tree structure. Each entry has an `id`
> and `parentId`, enabling in-place branching without creating new files.

> Sessions auto-save to `~/.pi/agent/sessions/` organized by working directory.

*"Branching", same file:*

> **`/tree`** — Navigate the session tree in-place. Select any previous point,
> continue from there, and switch between branches. All history preserved in a
> single file.
>
> **`/fork`** — Create a new session file from a previous user message on the
> active branch.
>
> **`/clone`** — Duplicate the current active branch into a new session file at the
> current position.

---

## 6. Compaction — stated as lossy, in the docs

*Source: `packages/coding-agent/README.md`, "Compaction"*

> Long sessions can exhaust context windows. Compaction summarizes older messages
> while keeping recent ones.
>
> **Manual:** `/compact` or `/compact <custom instructions>`
>
> **Automatic:** Enabled by default. Triggers on context overflow (recovers and
> retries) or when approaching the limit (proactive).
>
> Compaction is lossy. The full history remains in the JSONL file; use `/tree` to
> revisit.

That last sentence is the whole design in one line: **lossy in context, lossless
on disk.** Stage 4 of the build track demonstrates the loss; stage 6 demonstrates
the disk.

---

## 7. The extension lifecycle — a map of every place you can stand

*Source: `packages/coding-agent/docs/extensions.md`, "Lifecycle Overview"*

This is the most valuable single artifact in pi's documentation. Read it as an
answer to the question *"where am I allowed to intervene?"* — every arrow is a
decision someone made about what you should be able to change.

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

/new (new session) or /resume (switch session)
  ├─► session_before_switch (can cancel)
  ├─► session_shutdown
  ├─► session_start { reason: "new" | "resume", previousSessionFile? }
  └─► resources_discover { reason: "startup" }

/fork or /clone
  ├─► session_before_fork (can cancel)
  ├─► session_shutdown
  ├─► session_start { reason: "fork", previousSessionFile }
  └─► resources_discover { reason: "startup" }

/compact or auto-compaction
  ├─► session_before_compact (can cancel or customize)
  ├─► session_compact (success)
  └─► session_compact_failed (failure or abort)

/tree navigation
  ├─► session_before_tree (can cancel or customize)
  └─► session_tree

exit (Ctrl+C, Ctrl+D, SIGHUP, SIGTERM)
  └─► session_shutdown
```

Note the parenthetical verbs: *can block*, *can modify*, *can cancel*, *can
inject*, *can replace payload*. Those are the affordances. A harness whose event
list is all past-tense notifications (`tool_did_run`) lets you observe; one with
`tool_call (can block)` lets you govern.

---

## 8. Project trust — a real trust boundary, described precisely

*Source: `packages/coding-agent/README.md`, "Project Trust"*

> On interactive startup, pi asks before trusting a project folder that contains
> project-local settings, resources, or project `.agents/skills` and has no saved
> decision for the folder or a parent folder in `~/.pi/agent/trust.json`.
> Trusting a project allows pi to load `.pi/settings.json` and `.pi` resources,
> install missing project packages, and execute project extensions.
>
> Before the trust decision, pi loads only context files, user/global extensions,
> and CLI `-e` extensions so they can handle the `project_trust` event.
> Project-local extensions, project package-managed extensions, and project
> settings are loaded only after the project is trusted.
>
> Non-interactive modes (`-p`, `--mode json`, and `--mode rpc`) do not show a trust
> prompt. Without an applicable saved trust decision, they use
> `defaultProjectTrust` from global settings.

Worth noticing: pi says it has "no permission system", and yet this *is* one — for
a specific threat (a repository that executes code merely by being opened). The
lesson is that "no permission system" means no per-tool-call prompting, not no
trust boundaries at all.

---

## 9. Settings precedence

*Source: `packages/coding-agent/README.md`, "Settings"*

> | Location | Scope |
> |----------|-------|
> | `~/.pi/agent/settings.json` | Global (all projects) |
> | `.pi/settings.json` | Project (overrides global) |

---

## 10. The package split

*Source: `README.md` (repo root)*

> | Package | Description |
> |---------|-------------|
> | **@earendil-works/pi-telemetry** | Vendor-neutral telemetry contracts, reference adapter, conformance tests, and typed schemas |
> | **@earendil-works/pi-ai** | Unified multi-provider LLM API (OpenAI, Anthropic, Google, etc.) |
> | **@earendil-works/pi-agent-core** | Agent runtime with tool calling and state management |
> | **@earendil-works/pi-coding-agent** | Interactive coding agent CLI |
> | **@earendil-works/pi-tui** | Terminal UI library with differential rendering |

The seam that matters is between `pi-ai` (talking to providers) and
`pi-agent-core` (running the loop). Getting that seam right is what lets one
harness target OpenAI, Anthropic and Google without the loop knowing which.

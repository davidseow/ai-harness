# Bibliography — what to read, why, and what to skip

Annotated so you can choose. Everything marked **★** is worth reading in full;
everything else is worth knowing exists. Verbatim passages from the starred pi.dev
sources are in [`excerpts.md`](excerpts.md), so this course works with no network.

*All URLs verified 2026-08-31.*

---

## Primary sources — pi.dev

These are pi's own docs, not write-ups about pi. Prefer them to any blog post,
including the ones below: secondary summaries of pi already contain at least two
figures that its documentation does not support (see the correction note at the
top of `excerpts.md`).

**★ `packages/coding-agent/README.md`** — the single most useful file in the
repository. ~700 lines covering sessions, settings, trust, context files,
customisation, packages, and the full CLI reference.
`https://raw.githubusercontent.com/earendil-works/pi-mono/main/packages/coding-agent/README.md`
*Read:* "Philosophy" (the six refusals), "Context Files", "Sessions", "Project
Trust". *Skip:* the CLI reference tables unless you are actually using pi.

**★ `packages/coding-agent/docs/extensions.md`** — ~2,700 lines. The "Lifecycle
Overview" diagram near the top is the best single artifact in agent-harness
documentation anywhere; it is quoted whole in `excerpts.md` §7.
`https://raw.githubusercontent.com/earendil-works/pi-mono/main/packages/coding-agent/docs/extensions.md`
*Read:* "Lifecycle Overview", "Events", "Custom Tools" → "Tool Definition".
*Skip:* "Custom UI", the renderer APIs, and the autocomplete providers — all
TUI-specific and not transferable.

**`README.md` (repo root)** — short. The package table and the
"Permissions & Containerization" section are the parts that matter.
`https://raw.githubusercontent.com/earendil-works/pi-mono/main/README.md`

**`packages/agent/README.md`** — the runtime underneath the CLI. Read it if you
want to see where the seam between "the loop" and "the provider" is actually
drawn in a production harness.
`https://raw.githubusercontent.com/earendil-works/pi-mono/main/packages/agent/README.md`

**`packages/ai/README.md`** — ~80KB of multi-provider adapter. *Skip on first
read.* Come back to it only when you need to support more than one provider, at
which point it is the reference implementation of that problem.

---

## Primary sources — the Claude Code side of the contrast

**★ Claude Code documentation** — `https://code.claude.com/docs`
The counterweight to pi throughout this course. *Read:* the pages on hooks,
subagents, skills, and permission modes — each is a feature pi deliberately
refuses, so reading them side by side is the fastest way to see the design axis.

**★ Claude Agent SDK** — `https://code.claude.com/docs/en/agent-sdk`
Claude Code packaged as a library: built-in tools, the loop, context management,
hooks, subagents, permissions, sessions. The clearest example of the
"batteries-included harness you host yourself" quadrant from lesson 5.

**Anthropic Messages API — tool use** —
`https://docs.anthropic.com/en/docs/build-with-claude/tool-use`
The wire format everything in `build/src/provider/types.ts` mirrors. *Read:* the
sections on `tool_result`, `is_error`, and parallel tool use. Those three details
account for a surprising share of real harness bugs.

**Prompt caching** —
`https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching`
*Read for one idea:* caching is a **prefix match**, and the render order is
`tools` → `system` → `messages`. Once you have that, the rule that governs
harness design follows: anything volatile must go last, or you invalidate
everything after it. Lesson 21 leans on this.

---

## Concepts and commentary

**"What if you don't need MCP?"** — Mario Zechner (pi's author)
`https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/`
The argument behind pi's "No MCP" position: CLI tools with READMEs instead of a
protocol. Read it as the strongest available case *against* a thing this course
otherwise treats as standard. Disagreeing with it is fine; not having read it is
worse.

**The pi coding agent post** — Mario Zechner
`https://mariozechner.at/posts/2025-11-30-pi-coding-agent/`
The design rationale in long form.

**"What Is an Agent Harness?"** — Firecrawl
`https://www.firecrawl.dev/blog/what-is-an-agent-harness`
A clean, vendor-neutral definition of the term. Useful if you need one paragraph
to open a talk with. *Skip* the product section at the end.

**"Harness, Scaffold, and the AI Agent Terms Worth Getting Right"** — Hugging Face
`https://huggingface.co/blog/agent-glossary`
Vocabulary hygiene. Worth ten minutes precisely because these words are used
inconsistently everywhere else, including in job descriptions.

**"The Anatomy of an Agent Harness"** — Avi Chawla
`https://blog.dailydoseofds.com/p/the-anatomy-of-an-agent-harness`
Component-by-component breakdown. Overlaps heavily with lessons 1–5; useful as a
second explanation if the first did not land.

---

## Reading paths

**If you have 20 minutes.** `excerpts.md` §1 (the six refusals), §7 (the lifecycle
diagram), §6 (compaction is lossy). That is the spine of the whole course.

**If you have an hour.** Add pi's `coding-agent/README.md` in full, and the
Anthropic tool-use page.

**If you are going to teach this.** Read `extensions.md`'s event list closely
enough to answer *"where would I hook X?"* for any X someone asks about. That one
skill carries most of a session, because nearly every question about agent
behaviour turns out to be a question about which hook point owns it.

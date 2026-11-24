# 05 — Custom agents: narrow the tools

**~4 min · M2 Context · after lessons 04, 07**

> **In one line:** A custom agent is a prompt plus a tool list. The tool list is
> the part that holds: a reviewer that cannot edit cannot "helpfully" fix things.

## The idea

A custom agent is a Markdown file with frontmatter (§3). The body is advice. The
`tools:` line is not: tools left off the list are not offered to the model at
all. That makes agents the cheapest way to get a narrow, predictable role.

Copilot already ships four (§3): **Explore** (read and answer without filling
your main context), **Task** (run builds and tests, "brief summaries on success
and full output on failure"), **General-purpose**, and **Code-review**. Use
these before writing your own; Task alone saves a lot of context on noisy test
runs.

## Example — a reviewer that can only read

[`.github/agents/evidence-reviewer.agent.md`](../kit/.github/agents/evidence-reviewer.agent.md):

```markdown
---
name: evidence-reviewer
description: Reviews a diff against this course's
  evidence contract. Read-only.
tools: ["read", "search"]
---

You cannot edit or run anything. Report; do not fix.
Check, in order:
1. Any fenced output in lessons/ must exist verbatim
   in build/transcripts/.
…
Output one line per finding: file:line — problem — evidence.
```

Three choices in it are deliberate:

- **`tools: ["read", "search"]`.** No `edit`, no `execute`. Review stays review.
- **A fixed output shape.** One line per finding. Easy to scan, easy to post as a
  PR comment (bite 12), easy to diff between runs.
- **"If there are none, say so and nothing else."** A reviewer that must find
  something will invent something.

Run it: `/agent` and pick it, or `copilot --agent=evidence-reviewer`.

## Speed: one agent per job, not one prompt per session

Every time you type "remember, only look, don't change anything" you are
rebuilding an agent by hand. If you type it twice, write the file.

## Check yourself

### Q: You omit `tools:` entirely. What can the agent use?
- A: Nothing
- B: Everything available
- C: Read-only tools

<details><summary>Answer</summary>

**B** — omitted means all; `tools: []` means none (§3). Easy to get backwards.

</details>

### Q: Why does the reviewer get the diff as a file instead of `execute` to run `git diff`?
- A: `git diff` is slow
- B: Any shell access is a door to everything else; passing the diff in keeps the agent at zero shell
- C: Agents cannot run git

<details><summary>Answer</summary>

**B** — lesson 10: shell is the opaque tool. Don't grant it for one command.

</details>

**Next:** [06 — An allow list, not `--yolo`](06-allow-list.md)

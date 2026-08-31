# Harness comparison

Two tables. The first is *what kind of thing* you are choosing; the second is *which
one*, for the two harnesses this course dissects.

---

## 1. Who supplies the harness, who supplies the deployment

*Harness* = the loop, context management, tool orchestration.
*Deployment* = the process, sandbox, scheduler, persistence.

They are independent axes, and conflating them is why framework debates go in
circles.

| | You write the loop | Someone else writes the loop |
|---|---|---|
| **You host** | manual loop | SDK tool runner · full agent SDK |
| **They host** | — | managed agent platform |

| Approach | You write | Harness / deployment | Tools available | Choose when |
|---|---|---|---|---|
| **Manual loop** | the whole loop | you build; you host | only yours | your control flow fits nothing else — or you are learning |
| **SDK tool runner** | just the tool functions | SDK supplies the loop; you host | only yours | a custom-tool agent without hand-writing the loop — the common default |
| **Full agent SDK** | a prompt and options | SDK supplies a complete harness; you host | built-in file/shell/search + yours | you want a coding or filesystem agent and won't write one |
| **Managed platform** | agent config | vendor supplies **both** | vendor sandbox + yours | you want neither the loop nor the infrastructure; scheduled or hosted runs |

**The question that decides it:** do you need to own the loop, or own the box it
runs in? Answer them separately.

### Should you build one at all?

Four gates. A "no" to any one means stay simpler — a single call or a fixed
workflow.

- **Complexity** — genuinely multi-step and hard to specify up front?
- **Value** — does the outcome justify many turns of cost and latency?
- **Viability** — is the model actually good at this class of task?
- **Cost of error** — can mistakes be caught and undone?

---

## 2. pi.dev versus Claude Code

Both sit in the same quadrant — **you host, they supply the harness** — and disagree
about nearly everything else. Every pi row is sourced from
[`../reading/excerpts.md`](../reading/excerpts.md).

| | **pi.dev** | **Claude Code** |
|---|---|---|
| Philosophy | minimal core, aggressive extensibility | batteries included |
| Built-in tools | 8: `read` `bash` `powershell` `edit` `write` `grep` `find` `ls` | a larger set, plus web, search and task tools |
| Tool control | `--tools` · `--exclude-tools` · `--no-builtin-tools` · `--no-tools` | allowlists and permission modes |
| Permissions | **none in-process** — "run in a container" | permission modes, allowlists, per-call prompts |
| Subagents | refused — "spawn pi instances via tmux" | built in |
| Plan mode | refused — "write plans to files" | built in |
| MCP | refused — "build CLI tools with READMEs" | supported |
| To-dos | refused — "they confuse models" | built in |
| Background execution | refused — "use tmux" | supported |
| Extension model | ~30 lifecycle events; TS modules; pi packages via npm/git | hooks, skills, subagents, MCP servers |
| Prompt assembly | `AGENTS.md`/`CLAUDE.md` global → parents → cwd; `SYSTEM.md` replaces; `APPEND_SYSTEM.md` appends | `CLAUDE.md` discovery, similar layering |
| Sessions | JSONL tree, `id`+`parentId`; `/tree` `/fork` `/clone` | sessions with resume |
| Compaction | automatic (proactive + overflow recovery); `/compact [instructions]`; `session_before_compact` hook | automatic context management |
| Trust boundary | project trust prompt + `trust.json`; staged loading | permission modes + trust prompt |
| Config | `~/.pi/agent/settings.json` ← `.pi/settings.json` | settings.json layering |

### What the disagreement is actually about

It is not quality. It is a bet on **who is more likely to be right about your
workflow — you, or the tool's authors.**

- pi bets on you. You get a small core, real extension points, and the setup work.
- Claude Code bets on defaults. You get productivity immediately, and friction on
  the occasions the defaults are wrong.

Both pay off, for different teams. Knowing which bet you are making predicts which
tool will annoy you in six months, and that is more useful than a feature count.

### The one thing not to get wrong

pi's "no permission system" is coherent **because** it is paired with "run in a
container". Adopting the minimal core without adopting the containment is not the pi
position — it is the pi position with the safety half removed. Most people running
pi on a laptop with production credentials in the environment have done exactly
that.

---

## 3. How to evaluate any harness

In this order:

1. **Read the event list before the feature list.** Count *interceptors* (can block,
   can modify, can cancel), not events. It predicts what you can fix later.
2. **Locate the security boundary.** In-process gate, container, or nothing? All
   three are answers. "The system prompt" is not.
3. **Find out what a long session does.** When does compaction fire? Can you control
   what it keeps? Is full history retained?
4. **Price the tool surface.** How many schema tokens ship by default, and can you
   switch them off?
5. **Find the escape hatches.** `--no-context-files`, `--no-extensions`,
   `--no-tools`. A harness you cannot run stripped down is a harness you cannot
   debug.

## 4. What to measure once it runs

- **Turns to completion** — cost grows superlinearly with turns, and turns are the
  best proxy for how well-oriented the agent is
- **Cost per completed task** — not per request; a cheaper request that needs three
  more turns is not cheaper
- **Recovery rate** — how often it gets past a failed tool call instead of stalling
- **Intervention rate** — how often a human must step in

None of it means anything without an **eval on real tasks**. Absent one, every
change is an opinion, and you will remember your successes.

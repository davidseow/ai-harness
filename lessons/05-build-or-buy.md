# 05 — Who supplies the harness, who supplies the deployment

**~4 min · reading only · prerequisite: 04**

> **In one line:** Two independent questions — who writes the loop, and who runs
> the infrastructure — and confusing them is why "which agent framework?"
> conversations go in circles.

## The idea

Options in this space look like a flat list. They are not: they sit on two axes.

|  | **You write the loop** | **Someone else writes the loop** |
|---|---|---|
| **You host it** | manual loop | SDK tool runner · a full agent SDK |
| **They host it** | — | managed/hosted agent platforms |

*Harness* means the loop, context management, and tool orchestration. *Deployment*
means the process, the sandbox, the scheduler, the persistence. Most products
supply the first and leave you the second, which is why they feel similar to
evaluate and behave very differently in production.

Concretely, four positions:

**1. Manual loop.** You write the twenty lines from lesson 2. Total control, and
you own everything after: truncation, gates, sessions, retries, cost caps. Choose
this when your control flow genuinely does not fit anything else — or, as here, to
learn.

**2. An SDK tool-runner.** The vendor SDK drives the request → execute → repeat
cycle over tools you define, with per-turn hooks for approval and interception.
No built-in tools, no sandbox; you still host. This is the right default for a
custom-tool agent.

**3. A full agent SDK** (Claude Code as a library, and similar). Built-in file and
shell tools, context management, hooks, subagents, permissions, sessions — the
whole harness, running on your infrastructure. Choose it when you want a coding or
filesystem agent and do not intend to write one.

**4. A managed agent platform.** The vendor runs the loop *and* hosts a per-session
sandbox. You supply config and get back events. Choose it when you want neither the
loop nor the infrastructure — scheduled runs, hosted workspaces, persisted configs.

The axis that actually decides it: **do you need to own the loop, or do you need to
own the box it runs in?** Those have different answers, and answering them
separately collapses most of the debate.

## Should you build one?

Usually not. The honest test is four questions, and a "no" to any one of them means
stay simpler:

- **Complexity** — is the task genuinely multi-step and hard to specify up front?
  ("turn this ticket into a PR", not "extract the title from this PDF")
- **Value** — does the outcome justify the cost and latency of many turns?
- **Viability** — is the model actually good at this class of task?
- **Cost of error** — can mistakes be caught and undone? (tests, review, rollback)

Note that this course teaches you to build one anyway. That is not a
contradiction: understanding the machine and owning the machine are different
goals, and the first is worth having even when you buy.

## In the wild

pi and Claude Code sit in the same quadrant — you host, they supply the harness —
and disagree completely about how much harness to supply. pi refuses MCP,
subagents, permission popups, plan mode, to-dos and background bash, pointing at
extensions for each ([`excerpts.md` §1](../reading/excerpts.md)). Claude Code ships
all six.

Neither is wrong. pi's bet is that your workflow is unusual and a small core plus
real extension points beats someone else's defaults. Claude Code's bet is that
good defaults save more time than they cost. **The bet you are making is about
your team, not about the software** — and it is worth saying out loud before
choosing, because it predicts which one will annoy you in six months.

## The trap

Choosing on feature count. A harness with thirty features and four hook points is
more constraining than one with six features and thirty hook points, because you
will need something nobody anticipated by week three. Read the extension surface
before the feature list — lesson 15 is entirely about how much that list tells you.

## Read this

- **[`reading/excerpts.md` §1](../reading/excerpts.md)** — the six refusals, each
  naming its replacement mechanism. This is what a design position looks like when
  it is written down instead of implied.
- **Claude Agent SDK docs** — `https://code.claude.com/docs/en/agent-sdk`. The
  clearest example of position 3. Skim the options list and ask which of them you
  would otherwise have written yourself.
- **[`reference/harness-comparison.md`](../reference/harness-comparison.md)** — the
  four positions and two harnesses side by side. Referenced again in lesson 21.

## Teach it

**The analogy.** Buying a car versus buying a chassis versus hiring a taxi. The
mistake is comparing the chassis to the taxi on legroom.

**The question to open with.** *"Do you want to own the loop, or own the box it
runs in?"* Very few teams have asked it separately, and the discussion improves
immediately once they do.

**The 60-second version.** Harness and deployment are independent. Manual loop:
you write everything. Tool runner: SDK drives your tools, you host. Agent SDK:
whole harness, you host. Managed platform: they host both. Pick by which you need
to control — and if the task is not genuinely open-ended, do not build an agent at
all.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §1 · verified 2026-08-31*

**Next:** [06 — Stage 1: the loop, in code](06-stage1-loop.md)

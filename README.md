# How an AI Harness Works

**A course in 21 short lessons about the software *around* the model — the loop, the
context, the tools, the guardrails — and why it, more than the model, decides
whether an agent is any good.**

Written to be read anywhere. Every code example was executed already and its **real
output is printed in the lesson**, so nothing here requires a terminal, an API key,
or a network connection.

---

## Start here

| If you have… | Read |
|---|---|
| **A phone and 90 minutes** | [`course.pdf`](course.pdf) — the whole thing, offline |
| **A browser** | [`COURSE.md`](COURSE.md) — all 21 lessons in one scroll |
| **20 minutes** | Lessons [01](lessons/01-model-is-not-the-agent.md), [02](lessons/02-the-loop.md), [03](lessons/03-context-is-the-only-state.md), [15](lessons/15-pi-events.md) — the spine |
| **A room to teach** | [`teaching/`](teaching/) — slide outline, paper exercises, diagrams |
| **A problem right now** | [`reference/pitfalls.md`](reference/pitfalls.md) and [`guardrails.md`](reference/guardrails.md) |
| **A harness to choose** | [`reference/harness-deep-dive.md`](reference/harness-deep-dive.md) — Claude Code, Codex CLI and OpenCode, dissected against this course |

New here? [`lessons/00-orientation.md`](lessons/00-orientation.md).

## The one idea

An agent is a **stateless** model wrapped in a loop that rebuilds its entire memory
from scratch on every turn. Almost every surprising behaviour — forgetting a fact it
was told, redoing work, ignoring an instruction that was "definitely in the prompt",
costing ten times what you expected — follows from that sentence. The course is the
consequences.

## The lessons

**1 · Foundations** — what a harness is, and the loop at the centre of it
[01 The model is not the agent](lessons/01-model-is-not-the-agent.md) ·
[02 The whole thing is a loop](lessons/02-the-loop.md) ·
[03 Context is the only state](lessons/03-context-is-the-only-state.md) ·
[04 The four control surfaces](lessons/04-four-control-surfaces.md) ·
[05 Who supplies the harness, who supplies the deployment](lessons/05-build-or-buy.md)

**2 · Build one, on paper** — seven stages, each adding one capability, with transcripts
[06 The provider seam](lessons/06-stage1-loop.md) ·
[07 Tools, errors, parallelism](lessons/07-stage2-tools.md) ·
[08 The system prompt is rent](lessons/08-stage3-prompt.md) ·
[09 Compaction and amnesia](lessons/09-stage4-context.md) ·
[10 The permission gate](lessons/10-stage5-permissions.md) ·
[11 Sessions, resume, fork](lessons/11-stage6-sessions.md) ·
[12 Extensions](lessons/12-stage7-extensions.md)

**3 · Deep dive: pi.dev** — a real harness dissected, quoted from its own docs
[13 pi's thesis](lessons/13-pi-thesis.md) ·
[14 How pi assembles a prompt](lessons/14-pi-context-assembly.md) ·
[15 pi's event list as a map](lessons/15-pi-events.md) ·
[16 Sessions and compaction](lessons/16-pi-sessions.md) ·
[17 pi's trust model](lessons/17-pi-trust.md)

**4 · Pitfalls & guardrails** — how these systems fail, and what prevents it
[18 Reliability failures](lessons/18-failures-reliability.md) ·
[19 Trust failures](lessons/19-failures-trust.md) ·
[20 The guardrail catalogue](lessons/20-guardrails.md)

**5 · Practice** —
[21 Design heuristics and evaluating a harness](lessons/21-heuristics-and-evaluation.md)

## What's in the repository

```
lessons/      21 lessons + orientation, one idea each, 3–5 min
build/        a minimal harness in 7 stages, with its real captured transcripts
reference/    glossary · pitfalls · guardrails · harness comparison · deep dive
reading/      annotated bibliography + verbatim source excerpts (offline-usable)
teaching/     slide outline (45-min and 20-min cuts) · paper exercises · diagrams
COURSE.md     every lesson in one file
course.pdf    the same, for a phone
tools/        regenerates COURSE.md and course.pdf
```

## On evidence

**The transcripts are real.** Every stage in [`build/`](build/) was executed and its
output captured to [`build/transcripts/`](build/transcripts/), which the lessons
quote. Nothing was written by hand to make a point. Regenerate with
`cd build && npm run transcripts`, and check the guardrails still fire with
`npm run smoke` — which deletes `ANTHROPIC_API_KEY` from the environment first, so a
stage that quietly needed credentials would fail.

**The pi.dev claims are quoted.** Everything attributed to pi is in
[`reading/excerpts.md`](reading/excerpts.md), verbatim from its repository, fetched
2026-08-31, so you can check any claim without a network connection.

**One correction is recorded.** Widely repeated summaries say pi ships "four tools"
and a "sub-1,000-token system prompt". Neither figure appears in pi's documentation —
the verified tool list is eight. Both numbers are dropped, and the correction is
noted at the top of `excerpts.md` rather than quietly fixed. Secondary sources about
agent harnesses drift fast, and the numbers go first.

## Running the code (optional)

```bash
cd build && npm install
npm run stage1        # …through stage7
npm run smoke         # runs all seven and asserts what each must demonstrate
```

Offline, no API key, no cost. Pointing it at a real model takes one line — see
[`build/README.md`](build/README.md).

## Regenerating the course

```bash
cd tools && npm install && npm run all    # COURSE.md, then course.pdf
```

---

*Lessons and code by Claude Code. pi.dev material quoted from
[earendil-works/pi-mono](https://github.com/earendil-works/pi-mono) (MIT), verified
2026-08-31.*

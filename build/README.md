# `build/` — a minimal agent harness, one capability at a time

**You do not need to run any of this.** Every stage has already been run, and its
real output is committed in [`transcripts/`](transcripts/) and quoted inside the
lessons. This directory is here so the lessons have something true to point at.

## The seven stages

| Stage | Adds | The thing to notice |
|---|---|---|
| [`stage1-loop.ts`](src/stage1-loop.ts) | the loop | the request grows 91 → 156 → 219 tokens; that re-send *is* the memory |
| [`stage2-tools.ts`](src/stage2-tools.ts) | real tools | a failed edit comes back as a result, and the agent recovers |
| [`stage3-prompt.ts`](src/stage3-prompt.ts) | system prompt | the prompt is assembled from layered files, and charged every turn |
| [`stage4-context.ts`](src/stage4-context.ts) | truncation + compaction | a fact the user stated is provably gone by turn 4 |
| [`stage5-permissions.ts`](src/stage5-permissions.ts) | the permission gate | the files are still on disk — the side effect is absent |
| [`stage6-sessions.ts`](src/stage6-sessions.ts) | JSONL sessions | resume across a process boundary; fork into a second branch |
| [`stage7-extensions.ts`](src/stage7-extensions.ts) | an event bus | a tool, a redactor and a gate added without editing the loop |

## The shared core

Each stage imports from `src/shared/`, so no stage file is longer than a screen:

- [`loop.ts`](src/shared/loop.ts) — the loop from stage 1, with hooks
- [`tools.ts`](src/shared/tools.ts) — `read`, `write`, `edit`, `bash`, `ls`
- [`context.ts`](src/shared/context.ts) — truncation and compaction
- [`permissions.ts`](src/shared/permissions.ts) — the policy gate and audit log
- [`session.ts`](src/shared/session.ts) — the append-only JSONL log
- [`events.ts`](src/shared/events.ts) — the extension surface
- [`provider/mock.ts`](src/provider/mock.ts) — a scripted stand-in that records every request

## If you do have a terminal

```bash
npm install
npm run stage1        # …through stage7
npm run smoke         # runs all seven and asserts what each must demonstrate
npm run transcripts   # regenerates transcripts/
```

Everything runs **offline, with no API key, at no cost.** That is enforced: `smoke`
deletes `ANTHROPIC_API_KEY` from the environment before running each stage, so a
stage that quietly needed credentials would fail.

## Pointing it at a real model

[`src/provider/anthropic.ts`](src/provider/anthropic.ts) implements the same
`Provider` interface against the Anthropic Messages API. It is not installed by
default:

```bash
npm i @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-...
```

Then swap `new MockProvider([...])` for `await AnthropicProvider.create()` in any
stage. Nothing else changes — which is the point of putting the provider behind
an interface.

## What the mock is and is not

`MockProvider` replays replies written in advance. It does **not** simulate a
model's judgement, and no stage claims otherwise. What it gives you is total
clarity on the mechanical half — the loop, the request rebuilt each turn, the
tool plumbing, the token arithmetic — which is the half that is actually
deterministic, and the half most people have never seen laid out.

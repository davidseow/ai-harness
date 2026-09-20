# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A **course**, not a library. The deliverable is the prose in `lessons/` (00–21). The
TypeScript in `build/` is a seven-stage minimal agent harness whose only job is to
make that prose true: each stage is run, its output captured to
`build/transcripts/`, and the lessons quote those captures verbatim. Lesson text and
stage code are one artifact — editing either can invalidate the other.

## Commands

```bash
cd build && npm install
npm run stage1                        # …stage7: run one stage, read its narrated output
npm run smoke                         # the test suite: all seven + per-stage assertions
npm run transcripts                   # regenerate build/transcripts/
cd .. && python3 tools/check-transcripts.py   # root only: lessons quote captured output
```

No build, lint, typecheck, or unit-test framework. `smoke` is the test suite,
`check-transcripts.py` is the docs test; the single-test equivalent is running the
one stage you changed. Everything is offline with no API key, and `smoke` and
`transcripts` enforce it by deleting `ANTHROPIC_API_KEY` first — never add a stage
that needs credentials.

## The evidence contract

Most mistakes here are violations of this.

- **No hand-written output.** Transcript bytes in a lesson come from
  `build/transcripts/`, pi.dev quotes from `reading/excerpts.md` (fetched
  2026-08-31). A pi claim not in `excerpts.md` does not go in a lesson.
- **Change code → `npm run transcripts` → `check-transcripts.py`.** Stage output
  strings are coupled in three places: the `console.log` in `build/src/`, the
  `CHECKS` array in `build/scripts/smoke.ts`, and the quoting lesson.
- **The checker's heuristic bites.** Any fenced line containing a `MARKERS` string
  (`BLOCKED`, `seq=`, `reports/q`, `← GOT`, `[redacted]`, …) must match a captured
  source, so illustrative code you invent has to avoid those substrings.
- **Corrections are recorded, not silently fixed** — see the note atop
  `excerpts.md`. State what was wrong and why it changed.

## Architecture of `build/`

`build/README.md` has the stage table and the `src/shared/` map. What is not
obvious from the files:

- **`src/provider/` is a seam.** `mock.ts` replays scripted replies and records
  every request, which is what makes offline transcripts possible; `anthropic.ts`
  implements the same interface for real, and `@anthropic-ai/sdk` is deliberately
  not a dependency.
- **Two extension shapes, deliberately.** Stages 1–6 intervene via `Hooks` in
  `loop.ts`; stage 7 uses the `events.ts` bus and adds a tool, a redactor and a gate
  **without editing `loop.ts`** — that non-edit is the lesson's claim, so keep it true.
- `workspace.ts` contains file-tool paths but not `bash`, which is the gap lesson 10
  is about. Stage files are narration as much as program: the printing is the feature.

## Writing lessons

`lessons/NN-slug.md`, one idea each, 3–5 min. Copy the skeleton and voice from any
existing lesson (short declaratives; the uncomfortable caveat kept, not smoothed).
Lesson numbering is load-bearing in README, `teaching/slide-outline.md` and the
`Next:` footer chain.

`COURSE.md` and `course.pdf` were removed with their builders (`a557a9c`):
`lessons/` in order **is** the read-through, so do not reintroduce a generated
combined file.

## Writing style

- Concise. No padding, no throat-clearing, no recap of the previous module.
- Plain language, British English, second person ("you"), short paragraphs.
- Concrete over abstract: a worked example beats a definition.
- Code snippets short enough to read on a phone.
- Avoid academic prose and long dashes-within-dashes. Say the thing.

## Commit conventions

Conventional commits: `<type>(<scope>): <summary>`.

- **Types:** `feat` · `fix` · `docs` · `chore` · `refactor`
- **Scopes:** `module` · `index` · `notes` · `config` · `docs`
- Imperative mood, lowercase after colon, no trailing period, max 72 chars; body explains what/why, not how.

## Communication style

- **Be concise.** Get to the point.
- Plain language, British English.
- **Teach, don't just do.** When asked about a concept, explain it so it can be re-explained later — don't hand over a finished answer that skips the reasoning.
- **Ask if unclear.**

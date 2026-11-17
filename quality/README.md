# The quality track

**Eighteen bites of 3–5 minutes on testing and evaluating an agent harness. Builds on
the 21 lessons; does not repeat them.**

The course explains how a harness works and how it fails (lessons 18–20). Lesson 21
ends on one line: *"without an eval every change is an opinion."* This track starts
there. It is about **knowing** whether a harness works: which tests to write, which
numbers to trust, and how to keep both honest.

## What is new here

| The course already gives you | This track adds |
|---|---|
| a harness built in seven stages | how to **test** each stage, using the repo's own mock as the test double |
| failure catalogues (lessons 18–19) | how to **detect** each failure before a user does |
| a guardrail list (lesson 20) | how to **score** a guardrail (bite 14 probes the real stage 5 gate) |
| "what to measure" (lesson 21) | eval design, graders, LLM judges, error bars, release gates |

Two findings in this track come from running the repo's real code, not from
argument. Both probes are in [`probes/`](probes/) with their captured output:

- `truncateMiddle` makes text **longer** when `max` is below 62 (bite 07).
- stage 5's gate misses 7 of 14 hostile cases in the probe set, and never inspects
  the `write` tool at all (bite 14).

Neither affects the lessons: the stages call `truncateMiddle` at 400 and the
gate's weakness is the point of lesson 10. They are left unfixed as exercises.

## How to use it

**One bite a day.** Read it (3–5 min), answer the two questions, then do the paper
exercise it names in [`notebook.md`](notebook.md). Eighteen bites is under four
weeks of weekdays.

**On your phone, offline.** [`harness-qe.html`](harness-qe.html) is the whole track
as one file: tap-to-answer quizzes, a flip-card deck, the notebook with folded
answers, and progress saved on the device. It makes no network requests.

- **Android:** copy the file to the phone, open it in Chrome or Firefox.
- **iPhone:** the Files app previews HTML without running scripts, so the quizzes
  will not work there. Open it in an app that runs JavaScript on local files
  (e.g. a Git client such as Working Copy, or any "HTML viewer" app), or use the
  online copy while you have signal.

The markdown is the source; the app is generated from it:
`python3 tools/build-quality-app.py`. Edit a bite, rebuild, re-copy.

**On paper.** [`notebook.md`](notebook.md) has an exercise per bite plus a
capstone. Answers are folded under each module. [`flashcards.md`](flashcards.md)
works as a fold-the-page drill if you have no phone at all.

## The outline

Tick them off as you go. ⏱ is reading time; the paper exercise adds 5–15 minutes.

### M1 · Foundations — what is under test

- [ ] [01 Three things under test](bites/01-three-things-under-test.md) · ⏱3 · after lessons 01, 05
- [ ] [02 One run is an anecdote](bites/02-one-run-is-an-anecdote.md) · ⏱4 · pass@k vs pass^k
- [ ] [03 The agent test pyramid](bites/03-agent-test-pyramid.md) · ⏱3 · after lesson 04

### M2 · Testing the harness — the deterministic part

- [ ] [04 The mock is a test double](bites/04-mock-is-a-test-double.md) · ⏱3 · after lesson 06
- [ ] [05 Assert on what was sent](bites/05-assert-on-what-was-sent.md) · ⏱4 · after lessons 03, 09
- [ ] [06 Golden transcripts and their trap](bites/06-golden-transcripts.md) · ⏱4 · `smoke` critiqued
- [ ] [07 Properties, not examples](bites/07-properties-not-examples.md) · ⏱4 · a real bug
- [ ] [08 Inject the faults](bites/08-fault-injection.md) · ⏱4 · after lessons 07, 18

### M3 · Evals — the stochastic part

- [ ] [09 Anatomy of an eval](bites/09-anatomy-of-an-eval.md) · ⏱4 · after lesson 21
- [ ] [10 Grade the outcome, not the path](bites/10-grade-the-outcome.md) · ⏱3
- [ ] [11 The judge needs a judge](bites/11-llm-judge.md) · ⏱4 · LLM-as-judge
- [ ] [12 Small numbers lie](bites/12-small-numbers-lie.md) · ⏱5 · error bars by hand
- [ ] [13 Keep the eval honest](bites/13-keep-the-eval-honest.md) · ⏱3

### M4 · Trust testing — scoring the guardrails

- [ ] [14 Test the gate with a matrix](bites/14-test-the-gate.md) · ⏱5 · after lesson 10
- [ ] [15 Canaries and incidents](bites/15-canaries-and-incidents.md) · ⏱4 · after lessons 12, 19

### M5 · Production — quality after shipping

- [ ] [16 Traces are your oracle](bites/16-traces-are-your-oracle.md) · ⏱4 · after lessons 11, 15
- [ ] [17 Read fifty traces](bites/17-read-fifty-traces.md) · ⏱4 · error analysis, SLOs
- [ ] [18 Release gates](bites/18-release-gates.md) · ⏱4 · closes the track

**Capstone** (notebook): a one-page test plan for the seven-stage harness.

## Evidence

The course's evidence contract applies in spirit. Quoted program output in this
track comes from [`probes/*.txt`](probes/), captured by running the matching
`.ts` file from the repo root:

```bash
build/node_modules/.bin/tsx quality/probes/gate-probe.ts
build/node_modules/.bin/tsx quality/probes/truncate-probe.ts
```

`tools/check-transcripts.py` only scans `lessons/`, so it does not check this
directory. If you change a probe, re-capture its `.txt` and update the bite that
quotes it.

General QE claims (pass^k, judge biases, standard error) are standard material,
not pi.dev claims, so `reading/excerpts.md` does not apply. For further reading:
the τ-bench paper (Yao et al., 2024) for pass^k; *Judging LLM-as-a-Judge* (Zheng
et al., 2023) for judge biases; the HumanEval paper (Chen et al., 2021) for pass@k.

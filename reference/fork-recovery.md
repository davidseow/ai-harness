# Fork recovery — a playbook

When an agent went wrong several turns ago, **rewind and re-ask; do not argue.**
This page covers when to fork, how to find the turn to fork from, and a worked
example end to end.

Background: [lesson 11](../lessons/11-stage6-sessions.md) (why fork works) and
[lesson 16](../lessons/16-pi-sessions.md) (`/tree`, `/fork` and `/clone` in pi).

> **The example below is illustrative.** It is not a captured transcript. The pi
> command descriptions are quoted from [`excerpts.md` §5](../reading/excerpts.md);
> everything else on this page is practice, not pi documentation.

---

## Why correcting does not work

A wrong assumption on turn 6 shapes every turn after it. Say "that was wrong" at
turn 20 and the wrong reasoning is still in the history, re-sent on every request
([lesson 3](../lessons/03-context-is-the-only-state.md)). The agent tends to patch
around it rather than drop it.

Forking from before turn 6 leaves that reasoning out of the new history
altogether.

## When to fork

You never need to fork *at* the right moment. The log already holds every turn, so
any earlier user message is a point you can fork from later.

| Mode | Trigger | Fork from |
|---|---|---|
| **Recover** (common) | Something is wrong, and one correction did not fix it | Your message just before the bad turn |
| **Explore** (deliberate) | Context is loaded, you want to try A *and* B | The "understands it, nothing decided yet" point, once per approach |

The habit that goes with both: **when you pass a good point, notice it and commit
your code.** Fork rewinds the conversation, not the files.

## pi's three commands

From [`excerpts.md` §5](../reading/excerpts.md):

- **`/tree`**: navigate the session tree in place, all history in one file. Use it
  for trying alternatives inside one session.
- **`/fork`**: a new session file from a previous user message on the active
  branch. Use it when the new path is the real work from now on.
- **`/clone`**: duplicate the current branch into a new file at the current
  position. Use it as a snapshot before a risky step.

## The recovery procedure

1. **Name the wrong belief.** Put it in one sentence: "the port lives in
   `config.ts`".
2. **Find its first appearance.** Search the session log for it. The first
   *claim* of the belief (not the first mention) is the bad turn.
3. **Classify the mistake.** The class tells you what to change when you re-ask:

   | Class | What happened | Change when you re-ask |
   |---|---|---|
   | Unsupported claim | It asserted something no tool result backed | Tell it to check before deciding |
   | Misread result | Right data, wrong conclusion | Point at the exact line |
   | Ambiguous instruction | Your message allowed two readings | Reword it |

4. **Reset the workspace.** Edits and commands from the bad branch really
   happened. Put the files back before you fork.
5. **Fork from your message before the bad turn.**
6. **Re-ask with the gap closed.** Change the message, don't resend it. Add the
   facts the bad branch taught you, and leave out its reasoning.
7. **If you keep forking at the same point, fix the source.** A correction you
   need every session belongs in the system prompt or project instructions.

### If reading the log is not enough

When drift is gradual and no single turn looks wrong, **bisect**, the way
`git bisect` does. Fork halfway back and re-run. If it still goes wrong, the
mistake is earlier; if not, it is later. Each fork halves the range.

### The caveat

The log records what was *said*, not what the model *saw*. After compaction the two
differ. If the mistake came from a summary that dropped a constraint, only the
exact request that was sent will show it. Check whether your harness records
requests (the course's mock provider does; many real ones do not).

---

## Worked example: the wrong config file

**Task:** *"Make the server port configurable with a `PORT` env var."*

**The repo:** `app.ts` has `const PORT = 3000` and starts the server.
`config.ts` has `port: 8080` and is dead code that nothing imports.

### What happens

| Turn | Who | What |
|---|---|---|
| 1 | you | "Make the port configurable with a `PORT` env var." |
| 2–3 | agent | Lists files, reads `app.ts` |
| 4 | agent | Reads `config.ts` |
| 5 | you | "Looks good, go ahead." |
| **6** | **agent** | **"The port is defined in `config.ts`, so I'll change it there."** |
| 7–12 | agent | Edits `config.ts` to `process.env.PORT ?? 8080` |
| 13–17 | agent | Updates README, Dockerfile and `.env.example`, all saying 8080 |
| 18–19 | agent | Adds a test for `config.ts`, which passes |
| **20** | **you** | Run `PORT=5000 npm start` and it starts on **3000** |

It looks finished and the test passes, but the change does nothing.

### The tempting move

*"It's still on 3000, you changed the wrong file."* Fourteen turns of history now
say `config.ts` is the source of truth. The likely response wires `config.ts` into
`app.ts`, which moves the default from 3000 to 8080: a new bug on top of the old
one.

### The recovery

**1. Name it.** "The port lives in `config.ts`."

**2. Find it.**

```bash
grep -n 'config.ts' session.jsonl
```

Turn 4 is a read, which is fine. Turn 6 is the first claim, so that is the bad
turn.

**3. Classify it.** It had read both files but never checked which one is
imported. That is an **unsupported claim**, so the fix is to make it check.

**4. Reset the workspace.**

```bash
git status          # what did the bad branch touch?
git checkout .      # restore tracked files
git clean -n        # preview new files it created (the test)
git clean -f        # remove them once the preview looks right
```

**5. Fork** from turn 5, your "Looks good, go ahead."

**6. Re-ask with the gap closed:**

> "Before editing, check which of `app.ts` and `config.ts` is actually imported
> when the server starts. Only change that one. Keep the default at 3000."

That fixes the cause (check before claiming) and carries one fact forward (the
default is 3000). It brings none of the old reasoning.

**Result:** the new branch finds `config.ts` unused and edits `app.ts` to
`Number(process.env.PORT ?? 3000)`. `PORT=5000` now works.

**7. Fix the source.** Delete `config.ts`, or note in the project instructions that
it is dead, so the next session does not make the same mistake.

### What you are left with

- A clean branch with no wrong reasoning in its history.
- The old branch, intact. A fork deletes nothing, so the failure is still there to
  read.
- One less trap in the repo.

---

## Checklist

- [ ] One correction failed, so stop correcting
- [ ] Wrong belief named in one sentence
- [ ] First claim of it found in the log
- [ ] Mistake classified: unsupported, misread, or ambiguous
- [ ] Workspace reset (tracked *and* untracked files)
- [ ] Forked from the user message before the bad turn
- [ ] Message rewritten with the gap closed and facts carried forward
- [ ] Recurring cause fixed at the source

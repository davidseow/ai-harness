# 04 — Skills: pay on demand

**~4 min · M2 Context · after lessons 03, 14**

> **In one line:** A skill is a procedure the model loads only when its
> description matches the task. Write the description as a trigger, the body as
> a checklist.

## The idea

Some knowledge is long, exact, and needed once a week. In this repo: changing
what a stage prints touches three files in a fixed order (CLAUDE.md, "the
evidence contract"). Putting that in the always-on instructions charges every
turn for it. A skill charges only the turn that needs it.

How it loads (§2): Copilot reads each skill's `description`. When it decides one
fits, `SKILL.md` "will be injected in the agent's context". You can also force it
with `/regen-transcripts`.

## Example — the kit's skill

[`.github/skills/regen-transcripts/SKILL.md`](../kit/.github/skills/regen-transcripts/SKILL.md):

```markdown
---
name: regen-transcripts
description: Change what a build stage prints and keep lessons
  in sync. Use when editing console output in build/src, the
  CHECKS array in build/scripts/smoke.ts, or a lesson that
  quotes a transcript.
---

1. The `console.log` in `build/src/`.
2. The matching string in `CHECKS` in `build/scripts/smoke.ts`.
3. Regenerate: `cd build && npm run transcripts`.
…
```

(Folded here for the phone; in the file the description is one line.)

## Writing a description that fires

The description is the only part the model sees before deciding. So:

- **Name the triggers**, the files and verbs: "editing console output in
  `build/src`". Not "helps with transcripts".
- **Say when, not just what.** "Use when…" is the pattern GitHub's own examples
  follow.
- **Test it.** Ask for a task that should trigger it and watch whether it loads.
  If not, the description is wrong, not the model.

## The `allowed-tools` trap

`allowed-tools: shell` lets the skill run shell commands without asking. The
docs warn to do that only for skills you "have reviewed and fully trust" (§2). A
skill pulled from the internet with `allowed-tools: shell` is a script that runs
on description match. The kit's skill leaves it out.

## Check yourself

### Q: A skill never loads, though the task is exactly what it is for. First suspect?
- A: The model is too small
- B: The `description` does not mention words that appear in the task
- C: The body is too long

<details><summary>Answer</summary>

**B** — the body is invisible until the description wins.

</details>

### Q: Skill or instruction: "Done means smoke and check-transcripts pass"?
- A: Skill
- B: Instruction: it applies to nearly every task
- C: Neither

<details><summary>Answer</summary>

**B** — and bite 11 makes it a fact with a hook.

</details>

**Next:** [05 — Custom agents: narrow the tools](05-custom-agents.md)

# 03 — Instructions are rent

**~4 min · M2 Context · after lesson 08**

> **In one line:** Repo-wide instructions are paid for on every turn. Keep them
> to what applies to almost every task, and scope the rest by path.

## The idea

Lesson 08: the system prompt is rent. Copilot's instruction files are that
prompt. Every line in `.github/copilot-instructions.md` is sent with every
request, whether the task is a typo fix or a refactor.

So the useful question for each line is: *would most tasks go worse without it?*
If not, it belongs somewhere cheaper.

## Three tiers, by cost

| Tier | File | When it is paid |
|---|---|---|
| always | `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md` | every turn |
| by path | `.github/instructions/NAME.instructions.md` with `applyTo:` | only when a matching file is in play |
| on demand | a skill (bite 04) | only when the task calls for it |

## Example — scoping the lesson style rules

Prose rules mean nothing when Copilot edits TypeScript. So in the kit they move
out of the always-on file into
[`lessons.instructions.md`](../kit/.github/instructions/lessons.instructions.md):

```markdown
---
applyTo: "lessons/**/*.md,quality/**/*.md,copilot/**/*.md"
---

- British English, second person, short paragraphs. One idea per lesson.
- Never write program output by hand. Quote it from `build/transcripts/`.
```

And the always-on file shrinks to three bullets that matter for any task: the
gate exists, what "done" means, and which skill to use for output changes
([kit file](../kit/.github/copilot-instructions.md)).

## What makes a line earn its place

- **A fact it cannot find quickly.** "`smoke` is the test suite" saves a search
  every session.
- **A definition of done.** The single most useful line for quality.
- **Not** generic advice ("write clean code"). The model already tries.
- **Not** a safety rule. Put those in a hook (bite 09). An instruction is advice.

`@path` references inside `copilot-instructions.md`, `AGENTS.md` or `CLAUDE.md`
pull in other repo files, but absolute and `~/` paths are ignored (§1).

## Check yourself

### Q: Where does "TypeScript files use 2-space indent" belong?
- A: `.github/copilot-instructions.md`
- B: A path-scoped file with `applyTo: "**/*.ts"`, or better, a formatter
- C: A skill

<details><summary>Answer</summary>

**B** — and a formatter beats both: a rule a tool can enforce should not be
prose. Bite 10 wires one in.

</details>

### Q: `excludeAgent: "code-review"` in a path-scoped file does what?
- A: Hides those instructions from Copilot code review; the cloud agent still sees them
- B: Disables code review for those paths
- C: Nothing in the CLI

<details><summary>Answer</summary>

**A** — useful when a rule is about writing code, not judging it (§1).

</details>

**Next:** [04 — Skills: pay on demand](04-skills-on-demand.md)

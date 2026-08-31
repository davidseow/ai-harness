# 14 — How pi assembles a system prompt

**~4 min · reading only · prerequisite: 13**

> **In one line:** "The prompt" is the output of a filesystem walk, so the first
> debugging question is always what it actually assembled.

## The idea

pi builds its context at startup by discovering files
([`excerpts.md` §3](../reading/excerpts.md)):

> Pi loads `AGENTS.md` (or `CLAUDE.md`) at startup from:
> - `~/.pi/agent/AGENTS.md` (global)
> - Parent directories (walking up from cwd)
> - Current directory
>
> If a directory contains `AGENTS.override.md`, Pi loads it instead of `AGENTS.md`
> or `CLAUDE.md` from that directory. Context files from other directories are
> still concatenated.
>
> Use for project instructions, conventions, common commands. All matching files
> are concatenated.

And separately, for the prompt itself:

> Replace the default system prompt with `.pi/SYSTEM.md` (project) or
> `~/.pi/agent/SYSTEM.md` (global). Append without replacing via `APPEND_SYSTEM.md`.

Four mechanisms, and they do different jobs:

| Mechanism | Effect | Scope |
|---|---|---|
| `AGENTS.md` / `CLAUDE.md` | concatenated context | every level, global → cwd |
| `AGENTS.override.md` | replaces the context file **for that directory only** | one directory |
| `SYSTEM.md` | replaces the default system prompt entirely | project or global |
| `APPEND_SYSTEM.md` | appends to the default | project or global |

## A worked trace

You are in `~/work/monorepo/packages/api`. pi walks:

```
~/.pi/agent/AGENTS.md          → "Always prefer British spelling."
~/work/AGENTS.md               → (none)
~/work/monorepo/AGENTS.md      → "This monorepo uses pnpm, never npm."
~/work/monorepo/packages/AGENTS.md → (none)
~/work/monorepo/packages/api/AGENTS.md → "The API package targets Node 22."
```

Concatenated, nearest last. Stage 3 does the same assembly and prints it
([`stage3-prompt.txt`](../build/transcripts/stage3-prompt.txt)):

```
  › system prompt assembled from three files found on disk, nearest last:
         │ Always prefer British spelling.
         │ 
         │ This monorepo uses pnpm, never npm.
         │ 
         │ The API package targets Node 22.
```

Now the consequences that catch people:

**Your agent's instructions depend on where you started it.** Run from
`packages/api` and you get the Node 22 line. Run from the repo root and you do not.
Same repo, same agent, different behaviour — and nothing announces the difference.

**Everything is concatenated, so contradictions are silent.** The global file says
British spelling; a project file says American. Both are in the prompt. The model
picks. There is no conflict resolution and no warning — `AGENTS.override.md` is the
one escape hatch, and it only overrides *for its own directory*.

**Someone else's file is in your prompt.** `AGENTS.md` is checked into the repo.
Cloning a repository and starting an agent in it means loading instructions written
by whoever wrote that file — which is lesson 19's territory and lesson 17's trust
prompt.

## The general rule

Every serious harness does some version of this. The details differ; the failure
modes do not:

1. **Know the discovery order.** Write it down for whatever you use.
2. **Print the assembled prompt before debugging behaviour.** pi exposes
   `ctx.getSystemPrompt()` to extensions for exactly this. Half of "the agent is
   ignoring my instruction" turns out to be "the file was never loaded".
3. **Know the kill switch.** pi's is `--no-context-files` (`-nc`). Being able to run
   with a clean prompt is how you isolate a problem in one step.

## The trap

**Discovered files are executable text you did not write.** They are prompt with
full authority, loaded automatically, from paths you may not have looked at.
A parent-directory `AGENTS.md` — outside the repo, above your checkout — applies to
every project underneath it. That is convenient and it is also a persistence
mechanism.

## Read this

- **[`reading/excerpts.md` §3](../reading/excerpts.md)** — the discovery rules and
  the override mechanisms verbatim. Short, and worth reading twice.
- **[`reading/excerpts.md` §9](../reading/excerpts.md)** — settings precedence
  (`~/.pi/agent/settings.json` global, `.pi/settings.json` project). Same shape of
  layering applied to configuration.

## Teach it

**The analogy.** CSS cascade for prompts. Rules from several files, nearest wins by
being last, no error when two disagree — and the same bafflement when the thing on
screen is not what any single file says.

**The question to open with.** *"Does your coding agent behave differently
depending on which directory you launch it from?"* Almost everyone says no.
Almost everyone is wrong.

**The 60-second version.** pi assembles the prompt by walking global → parents →
cwd, concatenating every `AGENTS.md` it finds, with `SYSTEM.md` to replace and
`APPEND_SYSTEM.md` to extend. So instructions depend on your working directory,
contradictions resolve silently, and files you did not write end up in your prompt.
Print the assembled prompt before you debug anything.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §3, §9 · [`build/transcripts/stage3-prompt.txt`](../build/transcripts/stage3-prompt.txt) · verified 2026-08-31*

**Next:** [15 — pi's event list as a map of the harness](15-pi-events.md)

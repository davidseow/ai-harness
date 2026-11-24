# 02 — Where configuration lives

**~4 min · M1 Map · sources §1–§5**

> **In one line:** Three places, and the repo is the one that matters: it is
> versioned, reviewed and shared, so it is where a team's quality gate belongs.

## The three places

| Where | Who it is for | Examples |
|---|---|---|
| `~/.copilot/` (or `$COPILOT_HOME`) | you, every repo | `copilot-instructions.md`, `agents/`, `skills/`, `hooks/`, `mcp-config.json`, `settings.json` |
| `.github/` in the repo | everyone on the repo | `copilot-instructions.md`, `instructions/`, `agents/`, `skills/`, `hooks/` |
| the command line | this session only | `--allow-tool`, `--deny-tool`, `--model`, `--agent` |

Above all three sit **admin policy hooks** (`/etc/github-copilot/policy.d/`).
Nobody below can switch them off, not even with `disableAllHooks`.

## Rules worth memorising

**Instructions add up; they do not override.** Copilot combines every
instruction file it finds and "does not define a general precedence order
between these files" (§1). Two files that disagree give you a coin toss.

**This repo already has one.** Copilot reads `CLAUDE.md`. So the kit's
`copilot-instructions.md` holds only what is Copilot-specific and points back to
`CLAUDE.md` rather than repeating it.

**Agents and skills: the closer one wins.** A user-level agent with the same
filename overrides the repo's (§3). Handy for experimenting, and a way for one
person's setup to drift from the team's without anyone noticing.

**Edits need a restart.** Instruction changes are not picked up by a running
session (§1); hook configs load "when the CLI starts" (§5). After editing, use
`/new` or restart. "I changed the hook and nothing happened" is usually this.

**Trust is per folder.** Copilot asks whether to trust the launch folder. Do
not launch it from your home directory (§4). Trust is also what lets the repo's
hooks and MCP servers load; in a non-interactive run on a fresh machine, pass
`--trust-folder` for that (bite 12).

## Try it

Install the kit into a scratch clone of this repo:

```bash
cp -R copilot/kit/.github .
mkdir -p bin && cp copilot/kit/bin/cop bin/
copilot   # then type /instructions and /skills list
```

`/instructions` should list `CLAUDE.md`, `.github/copilot-instructions.md` and,
once you touch a lesson, `lessons.instructions.md`.

## Check yourself

### Q: Your teammate's hook never fires for you. Their config is in `~/.copilot/hooks/`. Why?
- A: Hooks only run on Linux
- B: User-level config is per machine; only `.github/hooks/` travels with the repo
- C: Hooks need `--allow-all`

<details><summary>Answer</summary>

**B** — anything the team relies on goes in the repo.

</details>

### Q: Why put a Copilot-only file next to `CLAUDE.md` instead of copying `CLAUDE.md` into it?
- A: Copilot cannot read `CLAUDE.md`
- B: Both are loaded and combined. Duplicates cost tokens every turn and drift apart into conflicts
- C: File size limits

<details><summary>Answer</summary>

**B** — and lesson 08 is the cost: every instruction is rent paid on every turn.

</details>

**Next:** [03 — Instructions are rent](03-instructions-are-rent.md)

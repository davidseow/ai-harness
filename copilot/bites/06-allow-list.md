# 06 — An allow list, not `--yolo`

**~4 min · M3 Permissions · after lesson 10**

> **In one line:** Most permission prompts are for the same ten commands. Allow
> those by name, deny the dangerous ones by name, and keep prompting for the rest.

## The idea

Permission prompts are the main drag on a Copilot session. The tempting fix is
`--allow-all` (alias `--yolo`): no tool prompts, no path checks, no URL checks.
GitHub's own advice is to use it only "in an isolated environment" (§4).

The middle road is a list. You already know which commands you approve without
reading: `git status`, the test suite, the checker. Approve those up front.

## Example — a launcher for this repo

[`kit/bin/cop`](../kit/bin/cop):

```bash
exec copilot \
  --allow-tool='write' \
  --allow-tool='shell(git status)' \
  --allow-tool='shell(git diff)' \
  --allow-tool='shell(npm run smoke)' \
  --allow-tool='shell(npm run transcripts)' \
  --allow-tool='shell(python3 tools/check-transcripts.py)' \
  --deny-tool='shell(git push)' \
  --deny-tool='shell(rm)' \
  "$@"
```

(Shortened; the file also allows `git log`.)

Run `bin/cop` instead of `copilot`. Edits and the repo's own checks go straight
through. A push or a delete is refused outright. Anything else still asks.

## Four rules that make this work

**Deny beats allow, always.** Even under `--allow-all`, even over a saved
approval (§4). So a deny list is safe to combine with anything.

**Flags are per session.** `--allow-tool` on the command line is not saved
(§4). That is a feature: the list lives in a file you can review in a PR, not in
a hidden approval store.

**Allow the command, not the interpreter.** `shell(npm:*)` would also allow
`npm install some-package`, which runs that package's install scripts.
`shell(python3:*)` is just `--allow-all` with extra steps. Name the exact
command.

**Watch the saved approvals.** Choosing "Yes, and approve for the rest of the
session" in a prompt is fine. Approvals for a location are kept in
`~/.copilot/permissions-config.json`. Review it now and then;
`/reset-allowed-tools` clears the current location's.

## The caveat

The docs show the syntax (`shell(git:*)`, `shell(git push)`) but not the exact
matching rules for arguments and chained commands. Treat the allow list as a
convenience and the deny list as a first line, not the last. The last line is a
`preToolUse` hook (bite 09), which sees the full command string.

## Check yourself

### Q: `--allow-all --deny-tool='shell(git push)'`: can it push?
- A: Yes, allow-all wins
- B: No, deny always wins
- C: It asks

<details><summary>Answer</summary>

**B** — §4: "Deny rules always take precedence over allow rules".

</details>

### Q: Why is `--allow-tool='shell(bash:*)'` a bad entry?
- A: Bash is slow
- B: It approves running any script, so it approves everything
- C: Syntax error

<details><summary>Answer</summary>

**B** — allowing an interpreter is allowing its whole language.

</details>

**Next:** [07 — Shrink the tool surface](07-shrink-the-surface.md)

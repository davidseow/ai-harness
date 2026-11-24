# 07 — Shrink the tool surface

**~3 min · M3 Permissions · after lessons 07, 10**

> **In one line:** Permissions decide whether a tool call is approved. Tool
> availability decides whether the model can even ask. The second is stronger
> and cheaper.

## Two layers

| Layer | Flag | What happens to a blocked tool |
|---|---|---|
| availability | `--available-tools`, `--excluded-tools` | the model never sees it |
| permission | `--allow-tool`, `--deny-tool` | the model calls it, then is refused |

A refused call still costs a turn: the model plans, calls, gets refused,
re-plans. A tool that is not offered costs nothing and cannot be talked into.
Lesson 04 called tool definitions "the strongest lever on what it does"; this is
that lever.

## Examples

A research session that must not touch the web:

```bash
copilot --excluded-tools='web_fetch, web_search'
```

A headless job that only reads code and runs git, from the docs (§4):

```bash
copilot --available-tools='bash,edit,view,grep,glob' \
  --allow-tool='shell(git:*)' --deny-tool='shell(git push)'
```

If you give both flags, `--available-tools` wins and `--excluded-tools` is
ignored (§4). Prefer `--available-tools` for anything unattended: a list of what
is allowed does not silently grow when Copilot adds a new tool.

## When `--yolo` is right

Inside a throwaway container or VM with no credentials and nothing you would
miss. Copilot also has `/sandbox enable` for a local sandbox (§4 overview). Then
`--allow-all` is honest: the blast radius is bounded by the box, not by the
prompts (lesson 10, "bound the blast radius").

Outside a sandbox, `--allow-all` means Copilot "has the same access as you do"
(§4 overview). Your SSH keys, your cloud credentials, your other repos.

## Check yourself

### Q: You pass `--available-tools='view,grep'` and `--excluded-tools='grep'`. What is available?
- A: `view` only
- B: `view` and `grep`
- C: Nothing

<details><summary>Answer</summary>

**B** — the available list wins; the excluded list is ignored entirely.

</details>

### Q: Why is "not offered" stronger than "denied"?
- A: It is faster to type
- B: A denied call is still attempted and costs a turn; an absent tool cannot be attempted at all
- C: Denials are logged

<details><summary>Answer</summary>

**B**.

</details>

**Next:** [08 — Hooks: anatomy and failure modes](08-hooks-anatomy.md)

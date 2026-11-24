# 01 — Copilot CLI is a harness you configure

**~4 min · M1 Map · after lesson 04**

> **In one line:** Every Copilot CLI setting is one of the course's control
> surfaces or the enforcement layer. Know which, and you know how much to trust it.

## The idea

Lesson 04 split agent control into four surfaces that *persuade* and one layer
that *enforces*: the harness code. Copilot CLI hands you a dial on each. The
question to ask of any setting is not "what does it do?" but "is it advice or a
fact?"

| You configure | Course term | Advice or fact? |
|---|---|---|
| `copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md` | system prompt | advice |
| skills (`SKILL.md`) | prompt, loaded on demand | advice |
| custom agent `tools:` list | tool definitions | **fact**: absent tools cannot be called |
| `--allow-tool` / `--deny-tool` | permission gate (lesson 10) | **fact** |
| hooks (`preToolUse`, `agentStop` …) | event bus (lessons 12, 15) | **fact**, if written right |
| `/model`, `--effort` | sampling params | changes how hard it thinks |
| `/compact`, auto-compaction at 95% | message history (lesson 09) | the harness's choice, not yours |

## Speed and quality pull on different rows

**Speed** comes from fewer prompts and less re-explaining: an allow list for
routine commands, instructions it does not have to rediscover, skills for
recurring jobs.

**Quality** comes from the rows marked *fact*. An instruction that says "run the
tests before you finish" is a request. A hook that runs them and refuses to let
the turn end while they are red is a gate.

The trap is building the speed half and calling it done. Every prompt you remove
is a check you removed, unless something else took its place. This track pairs
them: module 3 removes prompts, module 4 puts the checks back as hooks.

## The kit

Everything in this track is a working file in [`../kit/`](../kit/), laid out as it
would sit at a repo root, aimed at *this* repository. Its hook scripts were run
against fake payloads; the captured output is in
[`../probes/hook-probe.txt`](../probes/hook-probe.txt).

## Check yourself

### Q: Your instructions say "never edit `build/transcripts/`". Is that enough?
- A: Yes, the model follows instructions
- B: No: it is advice; a `preToolUse` hook that denies the edit is a fact
- C: Only if the instruction is in capitals

<details><summary>Answer</summary>

**B** — lesson 04's rule: the prompt is not a security control. Bite 09 turns
this exact sentence into a hook.

</details>

### Q: Which setting changes what the model *can* do, not what it *should* do?
- A: `AGENTS.md`
- B: A skill's description
- C: A custom agent's `tools: ["read", "search"]`

<details><summary>Answer</summary>

**C** — a tool not on the list does not exist for that agent.

</details>

**Next:** [02 — Where configuration lives](02-where-config-lives.md)

# Sources: GitHub Copilot CLI, quoted

Every claim the Copilot track makes about Copilot CLI is backed here, quoted from
GitHub's own docs. Fetched **2026-11-24**. Copilot CLI ships fast: re-fetch
before teaching from this, and treat a quote's date as part of the quote.

Quotes are short (one sentence or less) and exact. Text outside quote marks is
paraphrase. Sections are numbered so the bites can cite them as **§n**.

> **What is *not* verified.** The docs do not document per-tool argument field
> names in hook payloads (for example, whether `edit` receives `path`). The
> kit's hooks avoid depending on them (§5). The docs pages were too long to read
> in full in two places: the CLI command reference and the config-directory
> reference. Claims that came only from summaries of those pages are left out of
> the bites or flagged where used. The CI token setup (§8) comes from a search
> summary of the Actions page, not a direct read.

---

## §1 What reads what — custom instructions

*Source: `docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions`*

Files read: `~/.copilot/copilot-instructions.md`,
`~/.copilot/instructions/**/*.instructions.md`, `.github/copilot-instructions.md`,
`.github/instructions/**/*.instructions.md`, `AGENTS.md`, `CLAUDE.md` (also
`.claude/CLAUDE.md`), `GEMINI.md`, plus directories in
`COPILOT_CUSTOM_INSTRUCTIONS_DIRS`.

> "...but does not define a general precedence order between these files. Avoid conflicting instructions."

> "Path-specific instructions are included only when their `applyTo` value matches a file that Copilot CLI is working with."

> "Changes you make to custom instructions files are not immediately available for use in active CLI sessions."

> "Absolute paths and paths beginning with `~/` are not loaded."

Frontmatter examples, verbatim:

```
---
applyTo: "**/*.ts,**/*.tsx"
---
```

```
---
applyTo: "**"
excludeAgent: "code-review"
---
```

`/instructions` lists the discovered files and toggles each one. Changes take
effect with `copilot --continue` or `/new`.

## §2 Skills

*Source: `docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills`*

> "For **project skills**, specific to a single repository, create a `.github/skills`, `.claude/skills`, or `.agents/skills` directory in your repository."

> "When Copilot chooses to use a skill, the `SKILL.md` file will be injected in the agent's context..."

Required frontmatter: `name`, `description`. Optional: `license`,
`allowed-tools` (tools used without confirmation; the page warns to pre-approve
`shell` only for skills you have reviewed and fully trust). Invoke explicitly
with `/skill-name`. Manage with `/skills list`, `/skills info`, `/skills reload`.

Custom instructions are for "simple instructions relevant to almost every
task"; skills for "more detailed instructions that Copilot should only access
when relevant."

## §3 Custom agents

*Sources: `…/copilot-cli/use-copilot-cli/invoke-custom-agents`, `…/reference/custom-agents-configuration`*

Locations: `~/.copilot/agents`, `.github/agents`, and org/enterprise `.github`
repositories.

> "In the case of naming conflicts (where agents share the same filename), a user-level agent overrides a repository-level agent..."

Frontmatter: `description` (required), `name`, `tools`, `model`,
`disable-model-invocation`, `user-invocable`, `mcp-servers`. Tool aliases:
`execute` (shell), `read`, `edit`, `search`, `agent`, `web`, `todo`.

> "All unrecognized tool names are ignored, which allows product-specific tools to be specified in an agent profile..."

`tools: []` disables all tools; omitting `tools` enables all of them. Body
limit: "The prompt can be a maximum of 30,000 characters."

Built-in agents: **Explore**, **Task** ("brief summaries on success and full
output on failure"), **General-purpose**, **Code-review** ("surfacing only
genuine issues, minimizing noise").

Select with `/agent`, by naming it in a prompt, or `copilot --agent=NAME`.

## §4 Permissions and trust

*Sources: `…/use-copilot-cli/allowing-tools`, `…/concepts/agents/about-copilot-cli`, `…/set-up-copilot-cli/configure-copilot-cli`*

> "Deny rules always take precedence over allow rules"

> "By default, Copilot CLI can access the current working directory, its subdirectories, and the system temp directory."

> "By default, all URLs require approval before access is granted."

> "It is strongly recommended that you only use these options in an isolated environment." (the allow-all options)

> "You should only launch Copilot CLI from directories that you trust."

> "If you use an automatic approval option such as `--allow-all-tools`, Copilot has the same access as you do..."

The overview also names a local sandbox ("run `/sandbox enable` inside a
session") and a cloud one (`copilot --cloud`) as risk mitigation.

Syntax examples, verbatim:

```
--allow-tool='shell(git:*)' --deny-tool='shell(git push)'
--allow-tool='read, write(.github/copilot-instructions.md)'
--allow-tool='MyMCP(create_issue), MyMCP(delete_issue)'
--available-tools='bash,edit,view,grep,glob' --allow-tool='shell(git:*)' --deny-tool='shell(git push)'
```

`--available-tools` keeps only the listed tools; `--excluded-tools` removes the
listed ones; if both are given, the available list wins. `--allow-all` (alias
`--yolo`) = `--allow-all-tools` + `--allow-all-paths` + `--allow-all-urls`.
Command-line `--allow-tool`/`--deny-tool` are session-only and not saved.
Interactive approvals for a location are saved in
`~/.copilot/permissions-config.json`; `/reset-allowed-tools` clears them.
`/permissions assisted` (or `--assisted-approval` for non-interactive runs)
lets a model auto-approve requests it judges safe.

`--trust-folder` (programmatic reference) trusts the working directory's hooks,
workspace MCP servers and repo plugin settings for one non-interactive session,
and grants no tool, path or URL permission.

## §5 Hooks

*Sources: `…/reference/hooks-reference`, `…/customize-copilot/use-hooks`, `…/tutorials/copilot-cli-hooks`*

Locations: `.github/hooks/*.json`, `~/.copilot/hooks/`, inline `hooks` in
`settings.json` files, plugins, and admin policy directories
(`/etc/github-copilot/policy.d/*.json`) which "cannot be disabled by
`disableAllHooks`".

> "Hook configuration files use JSON format with version `1`."

Command hook fields: `type`, `bash`/`powershell`/`command` (or CLI-only `exec` +
`args`), `cwd`, `env`, `timeoutSec` ("Default: `30`"). Changes load "when the
CLI starts."

Events: `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`,
`postToolUse`, `postToolUseFailure`, `permissionRequest`, `agentStop`,
`subagentStart`, `subagentStop`, `preCompact`, `errorOccurred`, `notification`,
`userPromptTransformed`.

What each can do (event table):

> preToolUse: "Yes — can allow, deny, or modify."
> postToolUse: "Yes — can modify the tool result or inject additional context for the model."
> agentStop: "Yes — can block and force continuation."

**Matcher.** Supported on `preToolUse`, `postToolUse`, `permissionRequest`
(all on `toolName`), `preCompact`, `subagentStart`, `notification`.

> "It is compiled as `^(?:PATTERN)$` and must match the full value."

Runtime tool names: `ask_user`, `bash`, `create`, `edit`, `glob`, `grep`,
`powershell`, `task`, `view`, `web_fetch`.

**Payload.** `toolArgs` is "A **JSON string** containing that tool's arguments"
(tutorial). Per-tool argument field names are **not** documented. Local test
command, verbatim:

```shell
echo '{"timestamp":1704614400000,"cwd":"/tmp","toolName":"bash","toolArgs":"{\"command\":\"ls\"}"}' | ./my-hook.sh
```

**preToolUse output.** `permissionDecision`: "allow", "deny" or "ask".

> "Empty output uses default behavior."

> `permissionDecisionReason`: "Reason shown to the agent. Required when decision is `\"deny\"`."

> "In Copilot CLI autopilot mode, no prompt is shown and `\"ask\"` is denied"

Tutorial example, verbatim:

```json
{"permissionDecision":"deny","permissionDecisionReason":"Privilege escalation requires manual approval."}
```

**postToolUse output.**

> `additionalContext`: "Additional guidance appended to `textResultForLlm` so the model sees it after the tool output on the same turn."

> "...joined with a double newline and capped at 10 KB."

**agentStop.** Input includes `stopReason` and `stop_hook_active`, "true when
this turn was already forced to continue by a prior \"block\" decision from
this hook".

> "`\"block\"` forces another agent turn using `reason` as the prompt."

> "After 8 consecutive `block` continuations, the CLI overrides the hook and ends the turn anyway"

**Exit codes and failure.**

> Exit 0: "Success. `stdout` is parsed as the hook output JSON if present."

> "For `permissionRequest` and `preToolUse`, exit `2` is treated as a deny"

> Other non-zero: "Logged as a hook failure. The run continues (fail-open)."

> "`preToolUse` is fail-closed—a non-zero exit (other than exit 2) denies the tool call"

> "Timeouts are fail-open for every event, including `preToolUse` and admin-deployed policy hooks"

Emit one JSON object on stdout; two concatenated objects are invalid and
ignored. Troubleshooting: "Ensure the output is on a single line."

**disableAllHooks.** In a `.github/hooks/*.json` file it skips that file only.
At the top of repository `settings.json` (CLI only): "Every hook from every
source (repository files, user files, plugins, and inline hook blocks) is
skipped". Policy hooks still run.

**Rollout (tutorial).**

> "Logging-first rollout (recommended): Start by logging prompts and tool usage without denying execution."

> "Update deny rules incrementally rather than adding broad matches."

> "Keep exceptions narrow and well-documented."

> "Avoid logging secrets or credentials."

## §6 Context and modes

*Source: `docs.github.com/copilot/concepts/agents/about-copilot-cli`*

> "When your conversation approaches 95% of the token limit, Copilot automatically compresses your history in the background..."

`/compact` compresses on demand; `/context` shows a token breakdown.

> "Press <kbd>Shift</kbd>+<kbd>Tab</kbd> to cycle between modes."

Plan mode: "Copilot analyzes your request, asks clarifying questions to
understand scope and requirements, and builds a plan before writing any code."

## §7 Programmatic mode

*Source: `…/reference/copilot-cli-reference/cli-programmatic-reference`*

`-p`/`--prompt` runs once and exits (non-zero if interrupted or the final
response is empty). `@path` in the prompt includes a file. `-s` prints only the
response. `--output-format=json` emits JSONL. Also: `--model`, `--agent`,
`--no-ask-user`, `--share=PATH`, `--secret-env-vars=VAR`.

Examples, verbatim:

```
copilot -p "Review the latest commit" \
  --allow-tool='shell' \
  --agent code-review
```

```
copilot -p "What does this project do?" -s --model claude-haiku-4.5
```

Model precedence: agent `model-policy: required` > `--model` > agent `model` >
`COPILOT_MODEL` > `settings.json` `"model"` > default. `settings.json` example,
verbatim:

```
{
  "model": "gpt-5.3-codex",
  "effortLevel": "low"
}
```

Token precedence: `COPILOT_GITHUB_TOKEN`, then `GH_TOKEN`, then `GITHUB_TOKEN`.

## §8 Install and Actions

*Sources: `…/set-up-copilot-cli/install-copilot-cli`, `…/copilot-cli/use-copilot-cli-in-actions` (via search summary; not read directly)*

Install with `npm install -g @github/copilot` (Node.js 22+), WinGet, Homebrew or
a script. In Actions, store a user-owned fine-grained PAT with the **Copilot
Requests** permission as a secret and pass it as `COPILOT_GITHUB_TOKEN`. In
organisation repos, the built-in token can work instead, given
`copilot-requests: write` and the org policy. The docs warn that running the CLI
directly in workflow steps gives it broad access to the workflow environment.

# 17 — pi's trust model

**~5 min · reading only · prerequisite: 16**

> **In one line:** pi says it has no permission system and then ships a careful one
> — for the threat it decided actually matters: a repository that runs code just by
> being opened.

## The idea

Lesson 10 quoted pi's stance:

> Pi does not include a built-in permission system for restricting filesystem,
> process, network, or credential access. By default, it runs with the permissions
> of the user and process that launched it.
> — [`excerpts.md` §2](../reading/excerpts.md)

And yet ([`excerpts.md` §8](../reading/excerpts.md)):

> On interactive startup, pi asks before trusting a project folder that contains
> project-local settings, resources, or project `.agents/skills` and has no saved
> decision for the folder or a parent folder in `~/.pi/agent/trust.json`. Trusting
> a project allows pi to load `.pi/settings.json` and `.pi` resources, install
> missing project packages, and execute project extensions.

Both are true, and the apparent contradiction is the lesson. **"No permission
system" means no per-tool-call prompting.** It does not mean no trust boundaries.
pi drew exactly one boundary, at the place where the threat is worst.

## Why *this* boundary

Consider what happens when you clone an unfamiliar repository and start an agent in
it. Without a trust check, the repo's `.pi/settings.json` is loaded and its
extensions **execute** — before you have read a line of the code. Not "the model
might be tricked into running something": your machine runs the repo's code because
you opened it.

That is qualitatively worse than a risky tool call. A tool call is at least
something the model chose, in the open, that a gate could see. This is code
executing before the agent has done anything at all. So it gets a prompt, and per-tool
prompting does not.

## The staged-loading detail

This is the part worth studying, because it is where these systems usually leak:

> Before the trust decision, pi loads only context files, user/global extensions,
> and CLI `-e` extensions so they can handle the `project_trust` event.
> Project-local extensions, project package-managed extensions, and project
> settings are loaded only after the project is trusted. This split also applies
> when switching to a session from a different cwd whose trust has not been
> resolved in the current process.

Two things are right here:

**Ordering.** Untrusted code is not loaded *in order to ask whether to trust it*.
The obvious implementation — load everything, then check — has already lost.

**The cwd-switch case.** Resuming a session from a different working directory
re-triggers the check. That is the boundary case people forget, and forgetting it
turns `/resume` into a bypass.

Note what is still loaded pre-trust: **context files.** `AGENTS.md` from the repo is
read before you trust it. It is not executed, but it is prompt — which is lesson
19's problem, not this one. The boundary is drawn at *execution*, not at *influence*.

## Non-interactive mode

> Non-interactive modes (`-p`, `--mode json`, and `--mode rpc`) do not show a trust
> prompt. Without an applicable saved trust decision, they use
> `defaultProjectTrust` from global settings: `ask` (default) and `never` ignore
> those project resources, while `always` trusts them.

The default fails **closed**. In CI, project resources are ignored unless you opted
in. Setting `defaultProjectTrust: "always"` in an automated environment is a
decision to execute arbitrary repository code on every run — occasionally correct,
never accidental.

## The honest summary of pi's posture

| Threat | pi's control |
|---|---|
| Repo executes code on open | **project trust prompt**, staged loading, `trust.json` |
| Model runs a destructive command | none in-process — *"run in a container"* |
| Model exfiltrates via network | none in-process — *"run in a container"* |
| Third-party package is malicious | none — *"review source code before installing"* |
| Instructions injected via file content | none — read lesson 19 |

That is a coherent, deliberate posture: **one in-process boundary where in-process
is the only place it can be, and the process boundary for everything else.** It is
also a posture that only delivers if you run it in a container, and most people
reading this are running these tools on their laptop with their credentials in the
environment.

## The trap

**Trusting a parent folder.** pi's `/trust` can save a decision for the immediate
parent folder — convenient when you keep every project under `~/work`, and it means
every future repo cloned there is trusted before it exists. Whether that is
sensible depends entirely on how things arrive in that directory.

## Read this

- **[`reading/excerpts.md` §8](../reading/excerpts.md)** — the trust section in
  full, including the non-interactive rules. The staged-loading paragraph is the
  one to reread.
- **[`reading/excerpts.md` §2](../reading/excerpts.md)** — the security stance and
  the package warning, for the contrast this lesson is built on.

## Teach it

**The analogy.** A building with no locks on the interior doors but a serious
question at the front desk about whether you are allowed in the building. Not
absurd — a considered bet about where the real risk is.

**The question to open with.** *"You clone a stranger's repo and open your coding
agent in it. What has already run?"* Most people have never asked. The answer,
across tools, is more than they expect.

**The 60-second version.** pi has no per-call permission prompts and one real trust
boundary: a repo's settings and extensions do not load until you say so, and the
check happens *before* that code is loaded, and again when you resume from a
different directory. Everything else is delegated to the container. Context files
are still read pre-trust — that is influence without execution, and it is lesson 19.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §2, §8 · verified 2026-08-31*

**Next:** [18 — How harnesses fail: reliability](18-failures-reliability.md)

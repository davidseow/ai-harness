# 13 — Rolling it out

**~4 min · M5 Automation · closes the track**

> **In one line:** Log first, deny later, and test every gate before you trust
> it. A gate that blocks good work gets switched off, and then it catches nothing.

## The order that works

GitHub's own rollout tutorial recommends starting with logging: "Start by
logging prompts and tool usage without denying execution" (§5). Then:

1. **Week 1: watch.** A `preToolUse` hook that only appends `toolName` and the
   command to a log, and never denies. You learn what Copilot actually runs.
   "Avoid logging secrets or credentials" (§5).
2. **Week 2: deny the few.** From the log, pick the handful of commands that
   should never run unattended. Deny those, with reasons that point to the right
   path (bite 09).
3. **Week 3: gate done.** Add the stop gate (bite 11) and the post-edit check
   (bite 10). Now "finished" means "green".
4. **Then: automate.** Headless review in CI (bite 12), after the deterministic
   job.

"Update deny rules incrementally rather than adding broad matches" and "Keep
exceptions narrow and well-documented" (§5). A broad match that blocks a common
command teaches people to reach for `disableAllHooks`, which at the top of the
repo `settings.json` switches off every hook from every source (§5).

## Test the gate before trusting it

Each hook gets a probe like [`hook-probe.sh`](../probes/hook-probe.sh). For each:

- a case it **must deny** (proves it fires),
- a case it **must allow** (proves it is not a false alarm),
- a **crash** case for `preToolUse` (proves you know it fails closed),
- a **slow** case (proves your timeout is longer than the check).

Re-run the probes whenever you edit a hook. Bite 09's bug exited 0 and printed
nothing wrong. Only a must-deny case caught it.

## The checklist

Speed:

- [ ] Always-on instructions fit on one screen; the rest is path-scoped or a skill
- [ ] Recurring procedures are skills with trigger-style descriptions
- [ ] Recurring roles are custom agents with narrow `tools:`
- [ ] A launcher allow-lists routine commands by exact name

Quality:

- [ ] `preToolUse` denies the few dangerous or contract-breaking actions, with
      reasons that say what to do instead
- [ ] `postToolUse` runs fast checks on edit, silent when green
- [ ] `agentStop` runs the real tests for what changed, with a loop guard
- [ ] Timeouts are longer than the checks they guard
- [ ] Every hook has a probe with a must-deny case, and the probe is re-run on edit
- [ ] CI runs exact checks first, model review second, and the review comments
      rather than approves

## Where this leaves the course's argument

Lesson 04 said the harness code is the only place anything is enforced. Copilot
CLI's hooks are where it lets you write some of that code. Everything in this
track is that one idea, applied: put speed in the advice layer, put quality in
the enforcement layer, and test the enforcement layer as hard as the code it
protects.

## Check yourself

### Q: A new deny rule blocks `npm test` by accident. Best response?
- A: `disableAllHooks: true` until it is fixed
- B: Narrow the rule, add `npm test` as a must-allow case in the probe, re-run
- C: Tell people to use `--allow-all`

<details><summary>Answer</summary>

**B** — the false alarm becomes a permanent test case.

</details>

**Next:** [back to the track](../README.md) · the quality track's
[release gates](../../quality/bites/18-release-gates.md) for the same idea at
release scale

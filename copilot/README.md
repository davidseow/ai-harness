# The Copilot CLI track

**Thirteen bites of 3–5 minutes on configuring GitHub Copilot CLI to work faster
without losing quality. Builds on the 21 lessons; uses this repo as the worked
example.**

The course says the harness is the only place anything is enforced (lesson 04).
Copilot CLI is a harness you can configure, and hooks are where it lets you
write some of that code. This track sorts every Copilot setting into one of two
jobs:

- **Speed** (the advice layer): instructions, skills, custom agents, allow lists.
  Fewer prompts, less re-explaining.
- **Quality** (the enforcement layer): hooks that deny, check and gate.
  "Done" becomes something the harness checks.

Every speed change removes a prompt, and every removed prompt was a check. The
track pairs them so nothing is lost.

## What you get

| Folder | What is in it |
|---|---|
| [`bites/`](bites/) | the 13 bites |
| [`kit/`](kit/) | working config for **this repo**, laid out as at a repo root: instructions, a skill, a reviewer agent, three hooks, a launcher, a CI workflow |
| [`probes/`](probes/) | `hook-probe.sh` runs the kit's hooks on fake payloads; `hook-probe.txt` is its captured output |
| [`sources.md`](sources.md) | GitHub's docs, quoted and dated, with what is **not** verified |

## The outline

⏱ is reading time. Tick them off as you go.

### M1 · Map — Copilot through the course's eyes

- [ ] [01 Copilot CLI is a harness you configure](bites/01-copilot-is-a-harness.md) · ⏱4 · after lesson 04
- [ ] [02 Where configuration lives](bites/02-where-config-lives.md) · ⏱4 · install the kit

### M2 · Context — stop re-explaining (speed)

- [ ] [03 Instructions are rent](bites/03-instructions-are-rent.md) · ⏱4 · after lesson 08
- [ ] [04 Skills: pay on demand](bites/04-skills-on-demand.md) · ⏱4
- [ ] [05 Custom agents: narrow the tools](bites/05-custom-agents.md) · ⏱4

### M3 · Permissions — fewer prompts, no `--yolo` (speed)

- [ ] [06 An allow list, not `--yolo`](bites/06-allow-list.md) · ⏱4 · after lesson 10
- [ ] [07 Shrink the tool surface](bites/07-shrink-the-surface.md) · ⏱3

### M4 · Quality gates — hooks (quality)

- [ ] [08 Hooks: anatomy and failure modes](bites/08-hooks-anatomy.md) · ⏱5 · after lessons 12, 15
- [ ] [09 The policy hook](bites/09-policy-hook.md) · ⏱5 · a real bug, caught by the probe
- [ ] [10 Fast feedback after each edit](bites/10-post-edit-feedback.md) · ⏱4
- [ ] [11 The stop gate](bites/11-stop-gate.md) · ⏱5 · "done" means green

### M5 · Automation — headless and team-wide

- [ ] [12 Headless runs and CI](bites/12-headless-and-ci.md) · ⏱5
- [ ] [13 Rolling it out](bites/13-rolling-it-out.md) · ⏱4 · the checklist

## Using the kit

From a clone of this repo, with Copilot CLI installed
(`npm install -g @github/copilot`, Node 22+) and `jq` on your path:

```bash
cp -R copilot/kit/.github .
mkdir -p bin && cp copilot/kit/bin/cop bin/
bin/cop          # Copilot with the allow list
```

Restart Copilot after any change to hooks or instructions; both load at
startup. `.github/workflows/copilot-review.yml` needs a `COPILOT_GITHUB_TOKEN`
secret (bite 12).

The kit stays under `copilot/kit/` rather than at the root on purpose: the
course itself does not depend on Copilot, and nothing here runs unless you copy
it in.

## Evidence

The course's evidence contract applies in spirit:

- **Hook behaviour** quoted in the bites comes from
  [`probes/hook-probe.txt`](probes/hook-probe.txt). Regenerate it from the repo
  root with `bash copilot/probes/hook-probe.sh > copilot/probes/hook-probe.txt`
  after editing any hook, and update the bites that quote it.
- **Copilot CLI claims** come from [`sources.md`](sources.md), fetched
  2026-11-24. Copilot CLI was **not** run for this track (it was not installed
  where the track was written). The hooks were tested against the documented
  payload shape, not against Copilot itself. The first time you run the kit for
  real, check that each hook fires (bite 13), and record anything that differs
  as a correction in `sources.md`.
- `tools/check-transcripts.py` scans only `lessons/`, so it does not check this
  folder.

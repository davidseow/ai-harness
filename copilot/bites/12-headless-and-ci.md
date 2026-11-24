# 12 — Headless runs and CI

**~5 min · M5 Automation · after lessons 11, 21**

> **In one line:** `copilot -p` runs once and exits, which makes it a CI step.
> No human is there to answer a prompt, so every permission has to be decided
> before it starts.

## The idea

`-p` runs one prompt and exits (§7). Useful flags for automation:

| Flag | What it is for |
|---|---|
| `-s` | print only the response; nothing to strip |
| `--output-format=json` | JSONL, one event per line, for a script to read |
| `--agent=NAME` | a fixed role (bite 05) |
| `--available-tools=…` | the tools the job may even see (bite 07) |
| `--no-ask-user` | no clarifying questions; nobody would answer |
| `@path` in the prompt | include a file as context |
| `--trust-folder` | load the repo's hooks and MCP servers for this run |

In autopilot and non-interactive runs, a hook's `"ask"` is treated as deny
(§5). Design for that: unattended means every grey area is a no.

## Two quick local uses

Draft a commit message from what is staged:

```bash
git diff --cached > staged.diff
copilot -p "Write a conventional commit message for @staged.diff" -s
```

Run the reviewer from bite 05 on your last commit:

```bash
git show HEAD > last.diff
copilot -p "Review @last.diff" --agent=evidence-reviewer \
  --available-tools='view,grep,glob' -s
```

Write the diff into the repo folder: Copilot's default file access is the
working directory, its subfolders and the temp directory (§4).

## Example — a pull-request review job

[`kit/.github/workflows/copilot-review.yml`](../kit/.github/workflows/copilot-review.yml),
in two jobs:

```yaml
jobs:
  deterministic-gate:          # cheap, exact, always
    steps:
      - run: cd build && npm ci && npm run smoke
      - run: python3 tools/check-transcripts.py

  copilot-review:
    needs: deterministic-gate  # no model review of red code
    steps:
      - run: npm install -g @github/copilot
      - env:
          COPILOT_GITHUB_TOKEN: ${{ secrets.COPILOT_GITHUB_TOKEN }}
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > pr.diff
          copilot -p "Review the changes in @pr.diff" \
            --agent=evidence-reviewer \
            --available-tools='view,grep,glob' \
            --no-ask-user -s > review.md
      - run: gh pr comment … --body-file review.md
```

(Trimmed; checkout and Node setup omitted.) Design choices:

- **Tests gate the model.** `needs:` means a red build never costs a review.
- **The reviewer has no shell.** The diff is passed in as a file. The job's
  token and environment are out of reach of anything the model decides to run.
  GitHub warns that the CLI in a workflow step has broad access to the workflow
  environment (§8): this is the answer to that.
- **Token**: a user-owned fine-grained PAT with the **Copilot Requests**
  permission, stored as a secret (§8). Not your general `GH_TOKEN`.
- **It comments; it does not approve.** A model review is a second reader, not
  a merge gate. The merge gate is the first job.

## Check yourself

### Q: A headless job hangs. Likely cause?
- A: The model is slow
- B: Something asked for permission or a clarification, and nobody is there
- C: JSONL is too long

<details><summary>Answer</summary>

**B** — decide permissions up front, and pass `--no-ask-user`.

</details>

### Q: Why does the review job run after the tests, not in parallel?
- A: GitHub requires it
- B: A model review of failing code is wasted money and noise; exact checks are cheaper and run first
- C: The model needs the test output

<details><summary>Answer</summary>

**B** — the testing pyramid (quality bite 03): cheap and exact at the bottom.

</details>

**Next:** [13 — Rolling it out](13-rolling-it-out.md)

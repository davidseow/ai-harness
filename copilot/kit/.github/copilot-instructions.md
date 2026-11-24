# Copilot instructions

CLAUDE.md at the repo root is also loaded and holds the full rules. This file
adds only what Copilot needs to know about its own setup here.

- A quality gate runs when you stop (`.github/hooks/`). If it blocks, read the
  failure and fix the cause. Never weaken a check to make it pass.
- Done means: `cd build && npm run smoke` and `python3 tools/check-transcripts.py`
  both pass for what you changed.
- To change any stage's printed output, use the `regen-transcripts` skill.

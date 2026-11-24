---
name: regen-transcripts
description: Change what a build stage prints and keep lessons in sync. Use when editing console output in build/src, the CHECKS array in build/scripts/smoke.ts, or a lesson that quotes a transcript.
---

Stage output is coupled in three places. Change all three, in this order:

1. The `console.log` in `build/src/`.
2. The matching string in the `CHECKS` array in `build/scripts/smoke.ts`.
3. Regenerate: `cd build && npm run transcripts`.
4. Run `npm run smoke` (from `build/`). Fix until green.
5. From the repo root: `python3 tools/check-transcripts.py`. Any NOT FOUND line
   is a lesson quoting output that no longer exists. Re-quote it from the new
   file in `build/transcripts/`. Do not edit the transcript.
6. Report which lessons changed, so a human can re-read them.

Never add a stage that needs `ANTHROPIC_API_KEY`. Everything runs offline.

# 08 — Stage 3: the system prompt is rent

**~4 min · reading only · prerequisite: 07**

> **In one line:** The system prompt is assembled from files on disk and charged on
> every turn, so its cost is size × turns × sessions — not size.

## The idea

Two facts about the system prompt that are individually obvious and jointly
under-appreciated.

**It is assembled, not written.** Real harnesses build it at startup by walking the
filesystem. pi loads `AGENTS.md` (or `CLAUDE.md`) from the global config dir, then
every parent directory walking up from the cwd, then the current directory, and
concatenates them — with `.pi/SYSTEM.md` able to replace the default outright and
`APPEND_SYSTEM.md` able to add to it ([`excerpts.md` §3](../reading/excerpts.md)).
So "the prompt" is the *output of a discovery algorithm*, and the first debugging
question is always: what did it actually assemble?

**It is rent, not a purchase.** It is re-sent on every turn (lesson 3). A prompt
1,000 tokens heavier does not cost 1,000 tokens. It costs 1,000 × turns ×
sessions, forever.

## Walk through it

Stage 3 assembles a prompt from three layered files, then runs one identical task
under a short prompt and a long one and measures. Real output from
[`build/transcripts/stage3-prompt.txt`](../build/transcripts/stage3-prompt.txt):

```
  › system prompt assembled from three files found on disk, nearest last:
         │ Always prefer British spelling.
         │ 
         │ This monorepo uses pnpm, never npm.
         │ 
         │ The API package targets Node 22.

         prompt     size      turns    total sent
         ─────────────────────────────────────────────
         minimal     43 tok   3        1490 tok
         heavy      255 tok   3        2126 tok

  › the heavy prompt is 212 tokens bigger, but cost 636 extra tokens across 3 turns
    -- it is charged once per turn, not once per session.
```

212 tokens bigger; **636 tokens more spent** — exactly 3×, because there were three
turns. The multiplier is the number of turns, and real sessions run far more than
three.

The stage puts the scale plainly:

```
  › Scale that: at 40 turns a session and 200 sessions a day, a 1,000-token prompt
    addition is 8M tokens/day. That is the real price of a house-style section.
```

That is one paragraph of house style. Not a bug — but a number worth knowing before
adding the paragraph, and one almost nobody computes.

## What this does *not* show

The mock replays a script, so it cannot tell you whether the heavier prompt makes
the agent **better**. It cannot, and the stage says so in its own output:

```
  › What this does NOT show is whether the heavy prompt makes the agent better.
    Only an eval against real tasks answers that -- and the cost above is what it has to beat.
```

That is the honest framing for every prompt change: you now know the price. Whether
it is worth paying is an empirical question, and the only instrument that answers
it is an eval on real tasks. "It feels better" is not evidence, because you
remember your successes.

## The trap

**Editing the system prompt mid-session.** Prompt caching is a *prefix* match, and
the request renders `tools` → `system` → `messages`. Change one byte of the system
prompt on turn 12 and you invalidate the cache for everything after it, for the
rest of the session. The same is true of adding or removing a tool.

So when you need to inject something mid-run — a reminder, an operator instruction,
a piece of retrieved context — **append it to the end of the messages**, not into
the system block. Stage 7 does exactly this, and says why in the code:

```ts
// Appended at the END of the message list, never spliced into the system
// prompt. Editing `system` mid-run changes the cached prefix and throws away
// the prompt cache for the whole session.
```

## Read this

- **[`reading/excerpts.md` §3](../reading/excerpts.md)** — pi's context-file
  discovery order and the `SYSTEM.md` / `APPEND_SYSTEM.md` override mechanism. Two
  paragraphs; it is the whole assembly model.
- **Anthropic, prompt caching** —
  `https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching`. Read for
  the prefix-match rule and the render order. Those two facts generate every
  caching guideline you will ever need.

## Teach it

**The analogy.** The system prompt is a subscription, not a purchase. Everyone
evaluates it on sticker price and pays it monthly.

**The question to open with.** *"You add 500 tokens of coding standards to your
system prompt. What does that cost you per day?"* Nobody has the number. Working it
out together — turns × sessions — changes how the room thinks about prompts
permanently.

**The 60-second version.** The prompt is assembled from layered files, so know what
was actually assembled. It is re-sent every turn, so its cost is size × turns ×
sessions. Adding to it is a recurring charge, and only an eval can tell you if the
charge is worth it. Never edit it mid-session — append to messages instead, or you
throw away the cache.

---
*Sources: [`build/transcripts/stage3-prompt.txt`](../build/transcripts/stage3-prompt.txt) · [`reading/excerpts.md`](../reading/excerpts.md) §3 · verified 2026-08-31*

**Next:** [09 — Stage 4: compaction, and the amnesia it causes](09-stage4-context.md)

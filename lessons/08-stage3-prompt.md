# 08 — Stage 3: the system prompt is rent

**~7 min · reading only · prerequisite: 07**

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
prompt on turn 12 and you have not invalidated "the system prompt's cache" — you
have invalidated every cached turn of the conversation behind it, because all of
them were prefilled with the old system prompt in their attention context. Adding
or removing a tool is worse still.

So when you need to inject something mid-run — a reminder, an operator instruction,
a piece of retrieved context — **append it to the end of the messages**, not into
the system block. Stage 7 does exactly this, and says why in the code:

```ts
// Appended at the END of the message list, never spliced into the system
// prompt. Editing `system` mid-run changes the cached prefix and throws away
// the prompt cache for the whole session.
```

### What is actually being cached

The question that clears this up: if the whole conversation is re-sent every turn
anyway, what is there to cache? **You do re-send every token.** Lesson 03 still
holds, and caching does not soften it. The cache does not save transmission — it
saves *prefill*.

Before the model generates anything it has to run every input token through the
network and compute the attention key/value state for it. On a 20,000-token prefix
that is most of the work in the turn, and you were repeating it identically on
every turn. Caching stores that computed state server-side, keyed by the exact
bytes of the prefix. The tokens still go over the wire; the server loads the state
instead of recomputing it, and prefills only the new tail.

The pricing follows the work, not the bytes. A cache **read** costs ~0.1× the base
input price; a cache **write** costs 1.25× at the 5-minute TTL and 2× at one hour.
At the 5-minute TTL two requests break even (1.25 + 0.1 = 1.35 against 2 uncached).
On a $5/MTok model a 20,000-token prefix is **$0.10 per turn cold and $0.01 per
turn cached** — across a 30-turn session, $3.00 against $0.30, plus a latency
difference on every turn, because time-to-first-token is mostly prefill.

That is also why the rule is a *prefix* rule. A KV state is only valid for the
exact token sequence that produced it, since every token's attention depends on
everything before it. There is no such thing as caching the middle.

### Not everything invalidates everything

The API keeps three cache tiers, and a change invalidates its own tier and below.
What survives:

| Change | tools | system | messages |
|---|:---:|:---:|:---:|
| Tool definitions (add / remove / reorder) | ✗ | ✗ | ✗ |
| Model switch | ✗ | ✗ | ✗ |
| System prompt content | survives | ✗ | ✗ |
| `tool_choice`, images | survives | survives | ✗ |
| Message content | survives | survives | ✗ |

Two things fall out of that table. **Appending to messages invalidates nothing**,
which is why the advice above is the advice. And **a tool change is strictly worse
than a system prompt edit** — tools render at position 0, so they take the system
block down with them. Adding a tool mid-session is the most expensive edit
available to you, not the equivalent of a prompt tweak.

### One correction, and one escape hatch

*"For the rest of the session"* overstates it. A **one-off** edit costs one
expensive turn — a full re-prefill from the system block onward, plus the 1.25×
write to re-cache at the new prefix — and from the next turn you are reading again
against the new prefix. The genuinely session-long version is a system prompt that
changes on **every** turn: an interpolated `datetime.now()`, a live task list, a
rotating mode header. Then there is never a read at all, you pay the write premium
every turn, and you are worse off than with no caching. That is the one people
actually ship, and the diagnostic is `usage.cache_read_input_tokens` — zero across
requests with a nominally identical prefix means something upstream is rewriting
it.

Appending to messages now has a first-class form rather than only a convention. On
Claude Opus 5, Opus 4.8 and the Fable/Mythos 5 family, an operator instruction can
be appended to `messages` as `{"role": "system", "content": "..."}`: it sits after
the cached prefix, so the history survives, and unlike text smuggled into a user
turn it cannot be forged by anything that writes user-visible input. Tool changes
have an equivalent (`tool_addition` / `tool_removal` blocks, Opus 5 onward), and
tool search sidesteps the problem entirely by *appending* schemas rather than
swapping the list. The constraint has not changed; harnesses have been given a
legal way to satisfy it.

**If you are running a harness rather than writing one**, this same mechanism
surfaces as a short list of things that reset your session's cache — switching
model, toggling a speed mode, compacting, adding an MCP server mid-session. See
[`reference/harness-deep-dive.md` §3.3](../reference/harness-deep-dive.md) for what
that looks like at the keyboard.

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
throw away the cache. What the cache saves is prefill, not transmission: you re-send
every token regardless, and the server either recomputes the prefix or loads it.

---
*Sources: [`build/transcripts/stage3-prompt.txt`](../build/transcripts/stage3-prompt.txt) · [`reading/excerpts.md`](../reading/excerpts.md) §3 · verified 2026-08-31*

**Next:** [09 — Stage 4: compaction, and the amnesia it causes](09-stage4-context.md)

# 01 — The model is not the agent

**~4 min · reading only**

> **In one line:** The model is a stateless function from text to text; everything
> that makes an agent an *agent* is supplied by the software around it.

## The idea

Strip away the interface and an LLM API is one function call. You send a blob of
text, you get back a blob of text. It has no memory of the last call. It cannot
read a file, run a command, or wait. It cannot do anything at all except produce
tokens.

So when an agent reads your codebase, edits three files and runs the tests, ask
the flat question: *which part of that did the model do?* The answer is that it
produced text saying it would like those things to happen. Every action was
performed by other software.

That other software is the **harness**. Its job list is short and unglamorous:

| The harness supplies | Without it |
|---|---|
| The loop | one reply, then nothing |
| Conversation state | no memory between calls |
| Tool execution | the model can ask, never act |
| Context management | the request eventually exceeds the window and fails |
| Permissions | every request the model makes is granted |
| Persistence | the run vanishes when the process exits |
| Stopping | it runs until you run out of money |

Here is the part that surprises people: **the same model behaves very differently
under different harnesses.** Same weights, same prompt, wildly different results —
because how tools are described, how errors come back, how much history survives,
and when the loop stops are all harness decisions. When an agent disappoints you,
the model is the less likely culprit.

## Why the distinction earns its keep

It tells you where to look. "The agent forgot what I told it" is not a model
limitation, it is a context-management decision (lesson 9). "The agent deleted
something it shouldn't have" is not a model alignment failure, it is a missing
permission gate (lesson 10). "The agent keeps using the wrong tool" is usually a
tool *description* problem — prompt, not intelligence (lesson 7).

Each of those has a fix, and none of the fixes is "wait for a better model".

## In the wild

pi.dev's philosophy section is a list of things it refuses to put in the harness —
MCP, sub-agents, permission popups, plan mode, to-dos, background bash — each
paired with the extension point where you build it yourself
([`excerpts.md` §1](../reading/excerpts.md)). Claude Code makes the opposite call
and ships all of them. Same models underneath. The disagreement is entirely about
the harness, which tells you how much of the product lives there.

## The trap

Attributing harness behaviour to the model. It sends teams down the wrong path
for weeks: swapping models, rewriting prompts, and tuning sampling parameters to
fix something that is a fifteen-line change in how tool results are truncated.
Before blaming the model, look at the request that was actually sent. Lesson 3
shows how different that usually is from what people imagine.

## Read this

- **[`reading/excerpts.md` §1](../reading/excerpts.md)** — pi's six refusals, in
  its own words. The clearest evidence that "what the harness does" is a design
  choice rather than a given. Two minutes.
- **Hugging Face, "Harness, Scaffold, and the AI Agent Terms Worth Getting
  Right"** — vocabulary hygiene, worth ten minutes because these words are used
  inconsistently everywhere.
  `https://huggingface.co/blog/agent-glossary`
- **[`reference/glossary.md`](../reference/glossary.md)** — skim the first six
  entries now; the rest will make more sense after lesson 3.

## Teach it

**The analogy.** The model is a brilliant consultant locked in a windowless room
with no phone. They can answer anything and do nothing. The harness is the
assistant outside the door who carries messages in, fetches what was asked for,
decides which requests are reasonable, and remembers what happened yesterday.
Swap the consultant and you notice a difference. Swap the assistant and you get a
different company.

**The question to open with.** *"When an agent edits a file — what actually wrote
the bytes?"* Let the room work it out. The moment it lands, the rest of the course
has somewhere to attach.

**The 60-second version.** LLMs are stateless text functions. Agents are loops
around them. Everything you associate with agents — memory, tools, safety,
persistence — lives in the loop, not the model. That is why two products built on
identical weights feel nothing alike.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §1 · verified 2026-08-31*

**Next:** [02 — The whole thing is a loop](02-the-loop.md)

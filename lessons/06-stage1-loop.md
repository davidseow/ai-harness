# 06 — Stage 1: the provider seam

**~4 min · reading only · prerequisite: 02**

> **In one line:** Put the model behind an interface and you can develop, test and
> teach the entire harness for free.

## The idea

Lesson 2 showed you the loop. This lesson is about the one architectural decision
that surrounds it, made before anything else: **the model is reached through an
interface, not called directly.**

```ts
export interface Provider {
  readonly name: string;
  send(request: ProviderRequest): Promise<ProviderResponse>;
}
```

One method. Everything the harness knows about "the model" is that you can hand it
a `{system, messages, tools}` and get back a `{stop_reason, content, usage}`.

That seam buys four things, and they are not small:

1. **Free development.** A scripted provider costs nothing, needs no key, and runs
   offline. Every stage in this course runs that way.
2. **Determinism.** The same input produces the same transcript, every time. You
   cannot debug a loop while the thing at the end of it is nondeterministic.
3. **Provider portability.** pi splits this out as an entire package, `pi-ai`,
   precisely so the loop never learns which vendor it is talking to
   ([`excerpts.md` §10](../reading/excerpts.md)).
4. **Observability.** A provider you control can record every request — which is
   how lesson 3 proved the history is re-sent, and how lesson 9 will prove a secret
   left the context.

## Walk through it

The mock is about thirty lines. The important part is the recording:

```ts
export class MockProvider implements Provider {
  readonly seen: ProviderRequest[] = [];
  private cursor = 0;

  constructor(private readonly script: ProviderResponse[]) {}

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    // Deep-copy so later mutation of the live history can't rewrite what we
    // recorded. A recorded request has to be a snapshot to be worth anything.
    this.seen.push(structuredClone(request));

    const next = this.script[this.cursor];
    if (!next) throw new Error(`mock script exhausted after ${this.cursor} replies`);
    this.cursor += 1;
    return structuredClone(next);
  }
}
```

The `structuredClone` matters more than it looks. The loop *mutates* `messages` in
place, turn after turn. Store a reference and every recorded request silently
becomes the final one — you would "prove" the history was always complete, because
you were looking at the same array seven times. A snapshot is the only honest
record.

Fixtures then read like a screenplay:

```ts
const provider = new MockProvider([
  saysAndCalls("Sure, echoing that now.",
    { id: "call_1", name: "echo", input: { text: "hello harness" } }),
  saysAndCalls("And once more.",
    { id: "call_2", name: "echo", input: { text: "second time" } }),
  says("Done -- I echoed both."),
]);
```

## What the mock is not

It replays replies written in advance. It does **not** simulate a model's judgement,
and no stage in this course pretends otherwise. Anywhere the honest answer is "only
a real model can show you this", the lesson says so — lesson 8 is explicit about it.

What the mock gives you is total clarity on the mechanical half: the loop, the
request rebuilt each turn, the tool plumbing, the token arithmetic. That half is
genuinely deterministic, and it is the half most people have never actually looked
at. Being able to inspect it for free is worth more than realism here.

## The trap

**Dropping content blocks you do not recognise.** A real provider returns block
types your harness was never written for — thinking blocks, citations, server-tool
results, whatever ships next quarter. Drop them when converting and you corrupt the
conversation you replay, and the error surfaces three turns later somewhere
unrelated. The build track models this explicitly:

```ts
/**
 * A block this harness does not understand, carried through untouched.
 * The rule is: if you did not author a block, round-trip it byte-for-byte
 * and never inspect it.
 */
export type OpaqueBlock = { type: "opaque"; raw: unknown };
```

Faithful round-tripping of the unknown is a harness invariant, not a nicety.

## Read this

- **[`build/src/provider/types.ts`](../build/src/provider/types.ts)** — the whole
  wire format in about eighty lines, commented. The fastest way to see what a
  harness actually manipulates.
- **[`build/src/provider/anthropic.ts`](../build/src/provider/anthropic.ts)** — the
  same interface against a real API. Note that it is the *only* file that knows
  about caching, thinking, or model IDs.
- **[`reading/excerpts.md` §10](../reading/excerpts.md)** — pi's package split.
  `pi-ai` versus `pi-agent-core` is this exact seam, drawn at production scale.

## Teach it

**The analogy.** A flight simulator. You are not pretending the simulator is a
plane; you are removing the one variable that makes the controls impossible to
study.

**The question to open with.** *"How would you write a test for an agent loop?"*
The road always leads back to controlling the model's replies — at which point the
provider interface invents itself.

**The 60-second version.** One interface, one method. Behind it, a scripted mock
for free deterministic development, or a real API for production. Record every
request the mock is sent — deep-copied — and the harness's behaviour becomes
something you can inspect instead of something you assume.

---
*Sources: [`build/src/provider/`](../build/src/provider/) · [`reading/excerpts.md`](../reading/excerpts.md) §10 · verified 2026-08-31*

**Next:** [07 — Stage 2: tools, errors, and parallelism](07-stage2-tools.md)

# 02 — The whole thing is a loop

**~4 min · reading only · prerequisite: 01**

> **In one line:** Send, execute, append, repeat until the model stops asking —
> that is the entire agent, and it is about twenty lines.

## The idea

Every agent harness in existence runs this loop:

```
messages = [the user's request]

forever:
    response = model(system, tools, messages)     # 1. send everything
    messages.append(response)                     # 2. record what it said

    if response.stop_reason != "tool_use":        # 3. it's done asking
        break

    results = [run(call) for call in response.tool_calls]   # 4. act
    messages.append(results)                      # 5. record what happened
```

That is not a simplification for teaching. That is the shape. pi runs it, Claude
Code runs it, every framework you have heard of runs it. What differs between
harnesses is entirely **what they let you do at each of those five steps** — and
that is the subject of lesson 15.

Three details in step 4 that account for a startling share of real bugs:

1. **Every tool call gets exactly one result**, paired by id. Miss one and the
   next request is malformed.
2. **All results go back in one message.** Splitting them across several is
   accepted by the API and quietly teaches the model to stop calling tools in
   parallel.
3. **A failed tool returns a result, not an exception.** Throwing ends the run;
   returning the error lets the agent read it and try something else (lesson 7).

## Walk through it

Here is the loop from [`build/src/stage1-loop.ts`](../build/src/stage1-loop.ts),
with the narration stripped out:

```ts
const messages: Message[] = [userText(prompt)];

for (let n = 1; ; n++) {
  const request = { system: SYSTEM, messages, tools: [ECHO] };
  const response = await provider.send(request);

  // The model's turn goes into history verbatim -- including the tool_use
  // blocks. Drop them and the tool_result blocks below have nothing to pair
  // with, and the next request is malformed.
  messages.push({ role: "assistant", content: response.content });

  if (response.stop_reason !== "tool_use") return messages;

  const results = [];
  for (const block of response.content) {
    if (block.type !== "tool_use") continue;
    const output = await execute(block.name, block.input);
    results.push({ type: "tool_result", tool_use_id: block.id, content: output });
  }
  messages.push({ role: "user", content: results });   // ONE message
}
```

Running it against a scripted model that asks for two `echo` calls and then stops
produces this — real output, from
[`build/transcripts/stage1-loop.txt`](../build/transcripts/stage1-loop.txt):

```
━━━ TURN 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → SENT   ~91 tok  ·  system 15 tok  ·  1 tools  ·  1 messages
          [user] Echo 'hello harness', then echo 'second time'.
  ← GOT    stop_reason=tool_use
          [assistant] Sure, echoing that now.
          [assistant] → echo({"text":"hello harness"})

  › ran echo -> "hello harness"

━━━ TURN 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → SENT   ~156 tok  ·  system 15 tok  ·  1 tools  ·  3 messages
          [user] Echo 'hello harness', then echo 'second time'.
          [assistant] Sure, echoing that now.
          [assistant] → echo({"text":"hello harness"})
          [user] ← hello harness
  ← GOT    stop_reason=tool_use
          [assistant] And once more.
          [assistant] → echo({"text":"second time"})

  › ran echo -> "second time"

━━━ TURN 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → SENT   ~219 tok  ·  system 15 tok  ·  1 tools  ·  5 messages
          [user] Echo 'hello harness', then echo 'second time'.
          [assistant] Sure, echoing that now.
          [assistant] → echo({"text":"hello harness"})
          [user] ← hello harness
          [assistant] And once more.
          [assistant] → echo({"text":"second time"})
          [user] ← second time
  ← GOT    stop_reason=end_turn
          [assistant] Done -- I echoed both.

  › stop_reason is "end_turn" -- the loop ends here.
```

Look at the SENT lines: **91 → 156 → 219 tokens, 1 → 3 → 5 messages.** Turn 3
re-sends every single thing that happened on turns 1 and 2. That is not
inefficiency to be optimised away. It is the only reason the model on turn 3 knows
about turn 1 — which is lesson 3.

## The trap

**No stopping condition.** The loop above says `for (;;)`. A model that keeps
asking for tools keeps being served, forever, at your expense. Every harness needs
a turn cap, and the honest thing is to treat hitting it as a real outcome rather
than pretending the agent finished. The shared loop used from stage 2 onward
returns `stoppedBy: "max_turns"` for exactly this reason.

## Read this

- **Anthropic, tool use** —
  `https://docs.anthropic.com/en/docs/build-with-claude/tool-use`. *Read only* the
  `tool_result` / `is_error` / parallel-tool-use sections. Those three details are
  the ones this lesson's numbered list is about.
- **[`build/src/shared/loop.ts`](../build/src/shared/loop.ts)** — the same loop
  with hooks added. Worth reading now so lesson 15 has something to compare pi's
  thirty events against.

## Teach it

**The analogy.** A phone call where you have to re-read the entire conversation
aloud from the beginning before every new sentence. Absurd — and exactly what is
happening. That absurdity is the source of every cost and memory problem later.

**The question to open with.** *"How does the model on turn 3 know what happened
on turn 1?"* Most people assume the API remembers. Watching them realise it does
not is the moment the whole subject clicks.

**The 60-second version.** Send everything. If it asked for tools, run them, add
the results, send everything again. Stop when it stops asking. The request grows
every turn because re-sending is the only memory there is.

---
*Sources: [`build/transcripts/stage1-loop.txt`](../build/transcripts/stage1-loop.txt) · captured 2026-08-31*

**Next:** [03 — Context is the only state](03-context-is-the-only-state.md)

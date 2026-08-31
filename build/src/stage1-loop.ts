/**
 * STAGE 1 -- The loop.
 *
 * This is the entire idea of an agent, and it is smaller than people expect.
 * Send a request. If the model asked for a tool, run it, append the result,
 * send again. Stop when it stops asking. That is the loop. Everything else in
 * this course -- context management, permissions, sessions, extensions -- is
 * something bolted onto these twenty lines.
 *
 * There are no real tools yet: `echo` is a stub that returns its own argument.
 * That is deliberate. With the tool trivial, the only thing left to look at is
 * the shape of the loop itself.
 */
import { MockProvider, saysAndCalls, says } from "./provider/mock.js";
import type { Message, ProviderRequest, ToolSchema } from "./provider/types.js";
import { userText } from "./provider/types.js";
import { banner, note, printRequest, printResponse, turn } from "./shared/trace.js";

const SYSTEM = "You are a small assistant. Use the echo tool when asked to.";

const ECHO: ToolSchema = {
  name: "echo",
  description: "Return the text you pass in, unchanged.",
  input_schema: {
    type: "object",
    properties: { text: { type: "string", description: "Text to echo back." } },
    required: ["text"],
  },
};

/** The stub. In stage 2 this becomes a real registry of real implementations. */
async function execute(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "echo") return String(input.text);
  return `no such tool: ${name}`;
}

// ---------------------------------------------------------------------------
// THE LOOP
// ---------------------------------------------------------------------------

async function runLoop(provider: MockProvider, prompt: string): Promise<Message[]> {
  // `messages` is the entire memory of this agent. Nothing persists anywhere
  // else. Every turn re-sends all of it.
  const messages: Message[] = [userText(prompt)];

  for (let n = 1; ; n++) {
    turn(n);

    const request: ProviderRequest = { system: SYSTEM, messages, tools: [ECHO] };
    printRequest(request, { full: true });

    const response = await provider.send(request);
    printResponse(response);

    // The model's turn goes into history verbatim -- including the tool_use
    // blocks. Drop them and the tool_result blocks below have nothing to pair
    // with, and the next request is malformed.
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      note(`stop_reason is "${response.stop_reason}" -- the loop ends here.`);
      return messages;
    }

    // Every tool_use block gets exactly one tool_result, and they all go back
    // in ONE user message. Splitting them across several messages is valid
    // JSON and quietly teaches the model to stop calling tools in parallel.
    const results = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const output = await execute(block.name, block.input);
      note(`ran ${block.name} -> ${JSON.stringify(output)}`);
      results.push({ type: "tool_result" as const, tool_use_id: block.id, content: output });
    }
    messages.push({ role: "user", content: results });
  }
}

// ---------------------------------------------------------------------------

const provider = new MockProvider([
  saysAndCalls("Sure, echoing that now.", {
    id: "call_1",
    name: "echo",
    input: { text: "hello harness" },
  }),
  saysAndCalls("And once more.", {
    id: "call_2",
    name: "echo",
    input: { text: "second time" },
  }),
  says("Done -- I echoed both."),
]);

banner("STAGE 1 -- The loop", "no real tools, no state, no safety. Just the cycle.");
const history = await runLoop(provider, "Echo 'hello harness', then echo 'second time'.");

note(`the loop ran ${provider.turns} turns and history is now ${history.length} messages long.`);
note(
  "Look at TURN 3's SENT block: it contains every earlier message again. " +
    "That re-send is not an optimisation choice -- it is the only reason the model knows what happened.",
);

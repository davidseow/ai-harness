/**
 * STAGE 2 -- Real tools.
 *
 * The loop is unchanged from stage 1. What changes is that `echo` becomes a
 * registry of implementations that touch a real filesystem, and with that come
 * the three things every tool layer has to get right:
 *
 *   1. the schema is prompt -- the model picks tools by reading it
 *   2. failures come back as results, not exceptions
 *   3. parallel calls come back in ONE message
 */
import { MockProvider, calls, says, saysAndCalls } from "./provider/mock.js";
import { userText } from "./provider/types.js";
import { runLoop } from "./shared/loop.js";
import { DEFAULT_TOOLS, ToolRegistry } from "./shared/tools.js";
import { banner, note, printResponse, render, requestSize, turn } from "./shared/trace.js";
import { freshWorkspace, seed } from "./shared/workspace.js";

const SYSTEM = "You are a coding assistant working in the current directory.";

const workspace = await freshWorkspace("stage2");
await seed(workspace, {
  "notes.md": "# Notes\n\nship the thing\nship the thing\n",
  "config.json": '{"retries": 3}\n',
});

const registry = new ToolRegistry(DEFAULT_TOOLS);

const provider = new MockProvider([
  // Two read-only calls in ONE assistant turn. Both are parallel-safe, so a
  // real harness may run them concurrently -- and both results must come back
  // in a single user message.
  saysAndCalls(
    "Let me look at both files.",
    { id: "c1", name: "read", input: { path: "notes.md" } },
    { id: "c2", name: "read", input: { path: "config.json" } },
  ),
  // A doomed edit: "ship the thing" appears twice, and `edit` refuses ambiguity.
  calls({
    id: "c3",
    name: "edit",
    input: { path: "notes.md", old: "ship the thing", new: "ship it" },
  }),
  // Having read the error, the agent picks a unique anchor and succeeds. This
  // recovery is only possible because the failure came back as a result.
  calls({
    id: "c4",
    name: "edit",
    input: { path: "notes.md", old: "# Notes", new: "# Release notes" },
  }),
  says("Read both files and retitled notes.md."),
]);

banner("STAGE 2 -- Real tools", `workspace: ${workspace}`);
note(`registry exposes ${registry.size} tools: ${registry.schemas().map((s) => s.name).join(", ")}`);
note(
  `those schemas cost ~${Math.ceil(JSON.stringify(registry.schemas()).length / 4)} tokens on ` +
    "EVERY turn -- tool descriptions are prompt you pay rent on.",
);

let n = 0;
const result = await runLoop({
  provider,
  registry,
  system: SYSTEM,
  workspace,
  messages: [userText("Read notes.md and config.json, then retitle notes.md.")],
  hooks: {
    beforeRequest(request) {
      turn(++n);
      console.log(`\n  → SENT   ~${requestSize(request)} tok  ·  ${request.messages.length} messages`);
      return request;
    },
    afterResponse(response) {
      printResponse(response);
    },
    afterTool(call, toolResult) {
      console.log(`  ${toolResult.is_error ? "✗" : "✓"} ${call.name}  ${render(toolResult)}`);
    },
  },
});

note(`finished in ${result.turns} turns, stoppedBy=${result.stoppedBy}`);
note(
  "TURN 2's single user message carried BOTH tool_results. Split them into two " +
    "messages and the API still accepts it -- while the model quietly learns to stop calling tools in parallel.",
);
note(
  "TURN 3 is the important one: the edit FAILED, the error came back as a tool_result " +
    "with is_error, and the agent recovered. Throw that error instead and the run is simply over.",
);

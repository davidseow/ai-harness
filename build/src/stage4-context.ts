/**
 * STAGE 4 -- Context management, and the amnesia it causes.
 *
 * Stage 1 showed the request growing every turn. That growth is not a nuisance
 * to be optimised away; it is the agent's entire memory. So every technique for
 * controlling it is a technique for deciding what the agent is allowed to
 * forget -- and the failure mode is not an error, it is confident wrongness.
 *
 * This stage does three things:
 *   1. truncates an oversized tool result (and labels the cut)
 *   2. compacts an over-long history
 *   3. PROVES a fact the user stated has left the context, by searching the
 *      request that actually goes on the wire
 */
import { MockProvider, calls, says } from "./provider/mock.js";
import type { Message, ProviderRequest } from "./provider/types.js";
import { userText } from "./provider/types.js";
import { compact, historyTokens, truncateToolResult } from "./shared/context.js";
import { runLoop } from "./shared/loop.js";
import { DEFAULT_TOOLS, ToolRegistry } from "./shared/tools.js";
import { banner, note, requestSize, turn } from "./shared/trace.js";
import { freshWorkspace, seed } from "./shared/workspace.js";

const SECRET = "PROD-7741";
const BUDGET = 260; // tokens; absurdly small so compaction fires in a short demo

const workspace = await freshWorkspace("stage4");
await seed(workspace, {
  // A file big enough to blow past the tool-result cap.
  "server.log": Array.from({ length: 120 }, (_, i) => `line ${i}: request handled in ${i}ms`).join("\n"),
  "app.ts": "const PORT = 3000\n",
});

banner("STAGE 4 -- Context management", `result cap 400 chars · history budget ${BUDGET} tok`);

const provider = new MockProvider([
  calls({ id: "c1", name: "read", input: { path: "server.log" } }),
  calls({ id: "c2", name: "read", input: { path: "app.ts" } }),
  calls({ id: "c3", name: "bash", input: { command: "wc -l server.log" } }),
  calls({ id: "c4", name: "ls", input: { path: "." } }),
  says("Done looking around."),
]);

const requests: ProviderRequest[] = [];
let n = 0;

const result = await runLoop({
  provider,
  registry: new ToolRegistry(DEFAULT_TOOLS),
  system: "You are a coding assistant.",
  workspace,
  // The user states the deploy key ONCE, at the very start. Watch it.
  messages: [userText(`The deploy key is ${SECRET}. Investigate the server log, then report.`)],
  hooks: {
    // -- 1. TRUNCATION: applied as each result arrives ------------------------
    afterTool(_call, toolResult) {
      const before = toolResult.content.length;
      const after = truncateToolResult(toolResult);
      if (after.content.length < before) {
        toolResult.content = after.content;
        console.log(`  ✂ truncated tool result: ${before} → ${after.content.length} chars`);
      }
    },

    // -- 2. COMPACTION: applied to the whole history before each send --------
    beforeRequest(request) {
      turn(++n);
      const size = historyTokens(request.messages);

      if (size > BUDGET) {
        const before = request.messages.length;
        const { messages, droppedCount, summary } = compact(request.messages, {
          keepRecent: 4,
          // A realistic summariser: it records what was DONE and loses what was
          // merely SAID. That asymmetry is where the amnesia comes from.
          summarise: (dropped) => summarise(dropped),
        });
        if (droppedCount > 0) {
          console.log(
            `\n  ⟲ COMPACTED  ${before} → ${messages.length} messages ` +
              `(${size} → ${historyTokens(messages)} tok)`,
          );
          console.log(`     summary written: "${summary}"`);
          // Only the REQUEST is rewritten. The loop's own history array still
          // holds everything -- which is exactly how pi.dev works: /compact
          // changes what the model sees, while the session JSONL keeps the
          // lossless record. Compaction is a lossy projection, not a delete.
          request = { ...request, messages };
        }
      }

      console.log(`  → SENT   ~${requestSize(request)} tok  ·  ${request.messages.length} messages`);
      requests.push(structuredClone(request));
      return request;
    },
  },
});

/** Summarises actions taken. Notice it never looks for facts the user stated. */
function summarise(dropped: Message[]): string {
  const actions: string[] = [];
  for (const message of dropped) {
    for (const block of message.content) {
      if (block.type === "tool_use") actions.push(String(block.name));
    }
  }
  return actions.length
    ? `The assistant ran: ${actions.join(", ")}. Investigation of the server log is in progress.`
    : "Earlier discussion.";
}

// -- 3. THE PROOF -------------------------------------------------------------
note(`run finished in ${result.turns} turns`);

const sawSecret = requests.map((r) => JSON.stringify(r).includes(SECRET));
console.log("");
console.log("         turn   was the deploy key still in the request?");
console.log("         ──────────────────────────────────────────────");
sawSecret.forEach((present, i) => {
  console.log(`         ${String(i + 1).padStart(4)}   ${present ? "yes" : "NO — it is gone"}`);
});

const lost = sawSecret.indexOf(false);
if (lost === -1) {
  note("the key survived the whole run.");
} else {
  note(
    `The user stated the deploy key on turn 1. From turn ${lost + 1} it is not in the request at all.`,
  );
  note(
    "Ask the agent for it now and it will not say 'I forgot' -- it has no way to know it ever knew. " +
      "It will infer, or invent. THAT is compaction amnesia, and no error is raised anywhere.",
  );
  note(
    "The fix is not a better summariser. It is to decide, explicitly, which facts are " +
      "pinned and must survive every compaction -- and to test that they do.",
  );
}

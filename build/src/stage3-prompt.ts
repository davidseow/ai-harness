/**
 * STAGE 3 -- The system prompt.
 *
 * Two things are true about the system prompt and both are easy to miss:
 *
 *   1. It is ASSEMBLED, not written. Real harnesses build it from layered files
 *      found on disk. pi.dev reads AGENTS.md/CLAUDE.md from the home config
 *      dir, then every parent directory, then the cwd -- and lets .pi/SYSTEM.md
 *      replace the whole thing or APPEND_SYSTEM.md add to the end.
 *
 *   2. It is RENT, not a one-off. It is re-sent on every single turn. A prompt
 *      2,000 tokens heavier does not cost you 2,000 tokens; it costs 2,000 x
 *      the number of turns, for the life of every session.
 *
 * The mock cannot show you a model *behaving* differently under two prompts --
 * it replays a script. What it can show you exactly is what each prompt costs,
 * which is the part teams consistently fail to measure.
 */
import { MockProvider, calls, says } from "./provider/mock.js";
import type { ProviderResponse } from "./provider/types.js";
import { userText } from "./provider/types.js";
import { runLoop } from "./shared/loop.js";
import { DEFAULT_TOOLS, ToolRegistry } from "./shared/tools.js";
import { banner, estimateTokens, note, requestSize } from "./shared/trace.js";
import { freshWorkspace, seed } from "./shared/workspace.js";

/** The pi.dev position: say the minimum, trust the model. */
const MINIMAL = `You are a coding assistant. You have tools for reading, writing and editing
files and for running shell commands. Prefer reading before editing. Stop when the task is done.`;

/** The batteries-included position: encode conventions, safety, and house style. */
const HEAVY = `You are a coding assistant operating inside a user's repository.

## Tone
Be concise. Do not preamble. Do not summarise what you just did unless asked.

## Reading before writing
Always read a file before editing it. Never edit a file you have not read in this
session. If an edit fails because the anchor is ambiguous, read the file again and
choose a longer, unique anchor rather than retrying the same string.

## Shell commands
Prefer dedicated tools over bash where one exists. Never run a command that deletes
data, rewrites history, or contacts the network without saying so first. Do not
chain commands with && when a single command will do.

## Editing conventions
Match the surrounding code: its naming, its comment density, its idiom. Do not
reformat lines you were not asked to touch. Do not add licence headers.

## Finishing
Report what you changed, in one sentence per file. If something failed, say so
plainly with the error text rather than describing it. Never claim a test passed
that you did not run.`;

// The same assembly rule pi uses: layered files, nearest wins, appended in order.
function assemble(layers: { source: string; text: string }[]): string {
  return layers.map((l) => l.text).join("\n\n");
}

const script: ProviderResponse[] = [
  calls({ id: "c1", name: "read", input: { path: "app.ts" } }),
  calls({ id: "c2", name: "edit", input: { path: "app.ts", old: "const PORT = 3000", new: "const PORT = 8080" } }),
  says("Changed the port to 8080."),
];

async function runWith(label: string, system: string): Promise<{ turns: number; total: number }> {
  const workspace = await freshWorkspace(`stage3-${label}`);
  await seed(workspace, { "app.ts": "const PORT = 3000\nexport { PORT }\n" });

  let total = 0;
  const result = await runLoop({
    provider: new MockProvider(script),
    registry: new ToolRegistry(DEFAULT_TOOLS),
    system,
    workspace,
    messages: [userText("Change the port to 8080.")],
    hooks: {
      beforeRequest(request) {
        total += requestSize(request);
        return request;
      },
    },
  });
  return { turns: result.turns, total };
}

banner("STAGE 3 -- The system prompt", "assembled from layers, and paid for every turn");

// --- 1. assembly, the way pi.dev does it -------------------------------------
const assembled = assemble([
  { source: "~/.pi/agent/AGENTS.md      (global)", text: "Always prefer British spelling." },
  { source: "../AGENTS.md               (parent)", text: "This monorepo uses pnpm, never npm." },
  { source: "./AGENTS.md                (cwd)", text: "The API package targets Node 22." },
]);
note("system prompt assembled from three files found on disk, nearest last:");
for (const line of assembled.split("\n")) console.log(`         │ ${line}`);

// --- 2. what each prompt costs across one identical run ----------------------
const minimal = await runWith("minimal", MINIMAL);
const heavy = await runWith("heavy", HEAVY);

console.log("");
console.log("         prompt     size      turns    total sent");
console.log("         ─────────────────────────────────────────────");
console.log(
  `         minimal   ${String(estimateTokens(MINIMAL)).padStart(4)} tok   ${minimal.turns}        ${minimal.total} tok`,
);
console.log(
  `         heavy     ${String(estimateTokens(HEAVY)).padStart(4)} tok   ${heavy.turns}        ${heavy.total} tok`,
);

const perTurn = estimateTokens(HEAVY) - estimateTokens(MINIMAL);
note(
  `the heavy prompt is ${perTurn} tokens bigger, but cost ${heavy.total - minimal.total} extra tokens ` +
    `across ${heavy.turns} turns -- it is charged once per turn, not once per session.`,
);
note(
  "Scale that: at 40 turns a session and 200 sessions a day, a 1,000-token prompt " +
    "addition is 8M tokens/day. That is the real price of a house-style section.",
);
note(
  "What this does NOT show is whether the heavy prompt makes the agent better. " +
    "Only an eval against real tasks answers that -- and the cost above is what it has to beat.",
);

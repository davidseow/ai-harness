/**
 * STAGE 6 -- Sessions: resume and fork.
 *
 * Everything so far has lived in a variable. Kill the process and the agent has
 * never existed. A session log fixes that, and once you have one you get two
 * capabilities that feel like features but are really just consequences of
 * having written history down:
 *
 *   RESUME -- replay the log into `messages` and carry on.
 *   FORK   -- replay only a PREFIX of the log and go a different way.
 *
 * Fork is the one worth understanding. Agents go wrong gradually; the ability
 * to rewind to the last good turn and try again is worth more than almost any
 * prompt improvement.
 */
import * as path from "node:path";
import { MockProvider, calls, says } from "./provider/mock.js";
import { userText } from "./provider/types.js";
import { runLoop } from "./shared/loop.js";
import { SessionLog } from "./shared/session.js";
import { DEFAULT_TOOLS, ToolRegistry } from "./shared/tools.js";
import { banner, note, render, truncate } from "./shared/trace.js";
import { freshWorkspace, seed } from "./shared/workspace.js";

const workspace = await freshWorkspace("stage6");
await seed(workspace, { "app.ts": "const PORT = 3000\n" });
const registry = new ToolRegistry(DEFAULT_TOOLS);
const SYSTEM = "You are a coding assistant.";

banner("STAGE 6 -- Sessions", `log: ${path.join(workspace, "session.jsonl")}`);

// ---- part 1: a run that writes itself down ---------------------------------
const log = await SessionLog.create(path.join(workspace, "session.jsonl"));

// Log the opening user message BEFORE the loop runs. The loop's onMessage hook
// only sees messages the loop itself appends, so a seed message that is not
// recorded here vanishes -- and a replayed conversation that starts with an
// assistant turn is malformed. Small bug, silent until you resume.
const opening = userText("What port does app.ts use?");
await log.append({ kind: "message", message: opening });

const first = await runLoop({
  provider: new MockProvider([
    calls({ id: "c1", name: "read", input: { path: "app.ts" } }),
    says("The port is 3000."),
  ]),
  registry,
  system: SYSTEM,
  workspace,
  messages: [opening],
  hooks: {
    async onMessage(message) {
      await log.append({ kind: "message", message });
    },
  },
});
note(`run 1 finished in ${first.turns} turns; ${log.all().length} entries logged`);

console.log("\n         THE LOG ON DISK (one JSON object per line)");
console.log("         ─────────────────────────────────────────────────────────");
for (const entry of log.all()) {
  const summary = entry.message ? entry.message.content.map((b) => render(b)).join(" ") : entry.note;
  console.log(
    `         seq=${entry.seq} parent=${entry.parent ?? "-"} ${entry.kind}  ${truncate(String(summary), 74)}`,
  );
}

// ---- part 2: resume ---------------------------------------------------------
const reopened = await SessionLog.open(log.path);
const resumed = reopened.messages();
note(`reopened the file in a fresh object: ${resumed.length} messages replayed from disk.`);

const second = await runLoop({
  provider: new MockProvider([says("Still 3000 -- I read it a moment ago.")]),
  registry,
  system: SYSTEM,
  workspace,
  messages: [...resumed, userText("Are you sure?")],
  hooks: {},
});
note(`run 2 continued the SAME conversation across a process boundary (${second.turns} turn).`);

// ---- part 3: fork -----------------------------------------------------------
const forkPoint = log.all()[0]!.seq; // just after the opening user message
const branch = await log.fork(forkPoint, path.join(workspace, "branch.jsonl"));
note(`forked at seq=${forkPoint} into branch.jsonl (${branch.all().length} entries kept).`);

const third = await runLoop({
  provider: new MockProvider([
    calls({ id: "c9", name: "edit", input: { path: "app.ts", old: "3000", new: "8080" } }),
    says("Changed it to 8080 instead."),
  ]),
  registry,
  system: SYSTEM,
  workspace,
  messages: branch.messages(),
  hooks: {
    async onMessage(message) {
      await branch.append({ kind: "message", message });
    },
  },
});

note(`the branch went a different way in ${third.turns} turns, from the same prefix.`);
note(
  "Both files still exist. The original run was not rewritten, and nothing was deleted -- " +
    "which is the whole point: a fork is a new path through a tree, not an undo.",
);
note(
  "This is also the answer to compaction amnesia from stage 4. The MODEL forgot the deploy key; " +
    "the LOG never did. Lossless on disk, lossy in context, and you choose the projection.",
);

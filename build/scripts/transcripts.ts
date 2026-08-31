/**
 * Capture each stage's real output into build/transcripts/.
 *
 * The lessons quote these files. Nothing in a lesson is hand-written output --
 * if the code changes, the transcripts are regenerated and the lessons are
 * re-checked against them.
 */
import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const STAGES = [
  "stage1-loop",
  "stage2-tools",
  "stage3-prompt",
  "stage4-context",
  "stage5-permissions",
  "stage6-sessions",
  "stage7-extensions",
];

const root = path.resolve(import.meta.dirname, "..");
await fs.mkdir(path.join(root, "transcripts"), { recursive: true });

for (const stage of STAGES) {
  // Explicitly strip the API key: these transcripts must be reproducible by
  // anyone, and a stage that quietly needs credentials would not be.
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;

  const { stdout, stderr } = await run(
    path.join(root, "node_modules/.bin/tsx"),
    [path.join(root, "src", `${stage}.ts`)],
    { cwd: root, env, maxBuffer: 10 * 1024 * 1024 },
  );

  // Workspace paths contain a temp dir that differs per machine; normalise so
  // the committed transcripts do not churn.
  const clean = (stdout + stderr).replace(/\/tmp\/harness-/g, "/tmp/harness-");
  await fs.writeFile(path.join(root, "transcripts", `${stage}.txt`), clean, "utf8");
  console.log(`captured ${stage} (${clean.split("\n").length} lines)`);
}

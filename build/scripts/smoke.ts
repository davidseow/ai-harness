/**
 * The gate: every stage must run to completion with NO API key set, and must
 * still demonstrate the thing it exists to demonstrate.
 *
 * The assertions are deliberately about outcomes, not output formatting. Stage
 * 5 must actually block; stage 4 must actually lose the secret. A stage that
 * prints the right words while doing the wrong thing fails here.
 */
import { execFile } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");

const CHECKS: { stage: string; mustContain: string[]; mustNotContain?: string[] }[] = [
  { stage: "stage1-loop", mustContain: ["TURN 3", 'stop_reason is "end_turn"', "5 messages"] },
  { stage: "stage2-tools", mustContain: ["✗ edit", "must be unique", "stoppedBy=end_turn"] },
  { stage: "stage3-prompt", mustContain: ["minimal", "heavy", "total sent"] },
  {
    stage: "stage4-context",
    mustContain: ["truncated tool result", "COMPACTED", "NO — it is gone"],
  },
  {
    stage: "stage5-permissions",
    mustContain: [
      "BLOCKED",
      "reports/q3.csv still on disk: YES",
      "reports/q4.csv still on disk: YES",
    ],
    mustNotContain: ["GUARDRAIL FAILED"],
  },
  { stage: "stage6-sessions", mustContain: ["seq=1 parent=-", "replayed from disk", "forked at"] },
  {
    stage: "stage7-extensions",
    mustContain: ["registry is now 6 tools", "[redacted]", "1 call(s) denied"],
    mustNotContain: ["PROD-7741"],
  },
];

const env = { ...process.env };
delete env.ANTHROPIC_API_KEY; // the hard gate: offline, free, no credentials

let failures = 0;
for (const check of CHECKS) {
  let output: string;
  try {
    const result = await run(
      path.join(root, "node_modules/.bin/tsx"),
      [path.join(root, "src", `${check.stage}.ts`)],
      { cwd: root, env, maxBuffer: 10 * 1024 * 1024 },
    );
    output = result.stdout + result.stderr;
  } catch (error) {
    console.log(`✗ ${check.stage}: exited non-zero`);
    console.log(String(error).split("\n").slice(0, 4).join("\n"));
    failures++;
    continue;
  }

  const missing = check.mustContain.filter((s) => !output.includes(s));
  const present = (check.mustNotContain ?? []).filter((s) => output.includes(s));

  if (missing.length === 0 && present.length === 0) {
    console.log(`✓ ${check.stage}`);
  } else {
    failures++;
    console.log(`✗ ${check.stage}`);
    for (const s of missing) console.log(`    missing: ${JSON.stringify(s)}`);
    for (const s of present) console.log(`    must not appear but did: ${JSON.stringify(s)}`);
  }
}

console.log(failures === 0 ? "\nall stages pass" : `\n${failures} stage(s) failed`);
process.exit(failures === 0 ? 0 : 1);

/**
 * Check one property of truncateMiddle (bite 07): the output must never be
 * longer than `max`. Example-based tests at the default (400) pass. Sweep the
 * parameter and see where the property breaks.
 *
 * Run from the repo root:  build/node_modules/.bin/tsx quality/probes/truncate-probe.ts
 */
import { truncateMiddle } from "../../build/src/shared/context.ts";

const input = "x".repeat(1000);
for (const max of [400, 100, 70, 62, 61, 60, 40]) {
  const out = truncateMiddle(input, max).length;
  console.log(`max=${String(max).padStart(3)}  input=1000  output=${String(out).padStart(4)}  ${out <= max ? "holds" : "BROKEN"}`);
}

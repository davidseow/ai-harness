/**
 * Printing, so you can see the harness think.
 *
 * These stages exist to be *read*, not just run. Every stage narrates what it
 * sends and what comes back, because the single hardest thing to picture about
 * an agent loop is what the request actually looks like on turn 3.
 */
import type { ContentBlock, ProviderRequest, ProviderResponse } from "../provider/types.js";

const RULE = "─".repeat(64);

export function banner(title: string, subtitle?: string): void {
  console.log(`\n┌${RULE}`);
  console.log(`│ ${title}`);
  if (subtitle) console.log(`│ ${subtitle}`);
  console.log(`└${RULE}`);
}

export function turn(n: number): void {
  console.log(`\n━━━ TURN ${n} ${"━".repeat(52 - String(n).length)}`);
}

export function note(s: string): void {
  console.log(`\n  › ${s}`);
}

/** Rough token estimate: ~4 chars per token. Good enough to reason about. */
export function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

export function requestSize(request: ProviderRequest): number {
  return estimateTokens(
    request.system + JSON.stringify(request.messages) + JSON.stringify(request.tools),
  );
}

export function printRequest(request: ProviderRequest, opts: { full?: boolean } = {}): void {
  console.log(
    `\n  → SENT   ~${requestSize(request)} tok  ·  ` +
      `system ${estimateTokens(request.system)} tok  ·  ` +
      `${request.tools.length} tools  ·  ` +
      `${request.messages.length} messages`,
  );
  if (opts.full) {
    for (const message of request.messages) {
      for (const block of message.content) {
        console.log(`          ${render(block, message.role)}`);
      }
    }
  }
}

export function printResponse(response: ProviderResponse): void {
  console.log(`  ← GOT    stop_reason=${response.stop_reason}`);
  for (const block of response.content) {
    console.log(`          ${render(block, "assistant")}`);
  }
}

export function render(block: ContentBlock, role?: string): string {
  const who = role ? `[${role}]` : "";
  switch (block.type) {
    case "text":
      return `${who} ${truncate(block.text, 120)}`;
    case "tool_use":
      return `${who} → ${block.name}(${truncate(JSON.stringify(block.input), 90)})`;
    case "tool_result":
      return `${who} ← ${block.is_error ? "ERROR " : ""}${truncate(block.content, 90)}`;
    case "opaque":
      return `${who} (opaque block, carried through untouched)`;
  }
}

export function truncate(s: string, max: number): string {
  const flat = s.replace(/\n/g, "↵");
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

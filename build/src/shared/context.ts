/**
 * Context management: deciding what the model is allowed to still remember.
 *
 * Two distinct operations that get conflated constantly:
 *
 *   TRUNCATION keeps the message but shortens its content. Cheap, local,
 *   lossless-at-the-edges (you keep the head and the tail, which is where the
 *   information usually is). Applied to tool results as they arrive.
 *
 *   COMPACTION removes messages entirely and puts a summary in their place.
 *   Lossy by construction. Applied when the whole history is too big.
 *
 * Truncation is a formatting decision. Compaction is a memory operation, and it
 * is where agents silently forget things they were told.
 */
import type { Message, ToolResultBlock } from "../provider/types.js";
import { estimateTokens } from "./trace.js";

export const DEFAULT_MAX_RESULT_CHARS = 400;

/**
 * Keep the head and the tail, drop the middle, and say so.
 *
 * Saying so matters: a silently truncated result looks to the model like a
 * complete one, so it will confidently reason about a file it only half saw.
 */
export function truncateMiddle(s: string, max = DEFAULT_MAX_RESULT_CHARS): string {
  if (s.length <= max) return s;
  const keep = Math.floor((max - 60) / 2);
  const dropped = s.length - keep * 2;
  return (
    s.slice(0, keep) +
    `\n\n… [${dropped} characters truncated by the harness] …\n\n` +
    s.slice(-keep)
  );
}

export function truncateToolResult(
  block: ToolResultBlock,
  max = DEFAULT_MAX_RESULT_CHARS,
): ToolResultBlock {
  return { ...block, content: truncateMiddle(block.content, max) };
}

export function historyTokens(messages: Message[]): number {
  return estimateTokens(JSON.stringify(messages));
}

/**
 * Replace the oldest messages with one summary message.
 *
 * `summarise` stands in for what a real harness does here: send the doomed
 * messages to a model and ask for a précis. The mechanism is identical; only
 * the quality of the summary differs. Note what the signature cannot promise:
 * that the summary preserves anything in particular. It preserves whatever the
 * summariser happened to think was important.
 */
export function compact(
  messages: Message[],
  opts: { keepRecent: number; summarise: (dropped: Message[]) => string },
): { messages: Message[]; droppedCount: number; summary: string } {
  if (messages.length <= opts.keepRecent) {
    return { messages, droppedCount: 0, summary: "" };
  }

  // Never split an assistant tool_use from its matching tool_result: the pair
  // has to survive together or the next request is malformed. Walk the cut
  // point back until what remains does not START with an orphan tool_result.
  let cut = messages.length - opts.keepRecent;
  while (cut > 0 && !isCleanBoundary(messages[cut])) cut--;

  const dropped = messages.slice(0, cut);
  if (dropped.length === 0) return { messages, droppedCount: 0, summary: "" };

  const summary = opts.summarise(dropped);
  const replacement: Message = {
    role: "user",
    content: [{ type: "text", text: `[Summary of ${dropped.length} earlier messages]\n${summary}` }],
  };
  return {
    messages: [replacement, ...messages.slice(cut)],
    droppedCount: dropped.length,
    summary,
  };
}

/**
 * A cut at index k is clean if messages[k] does not begin with a tool_result
 * whose tool_use we are about to drop. Assistant messages are fine to cut
 * before -- their own tool_use blocks and the results that answer them are
 * either both kept or both dropped.
 */
function isCleanBoundary(message: Message | undefined): boolean {
  if (!message) return false;
  if (message.role === "assistant") return true;
  return !message.content.some((b) => b.type === "tool_result");
}

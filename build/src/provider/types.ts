/**
 * The wire shapes an agent harness deals in.
 *
 * These mirror the Anthropic Messages API closely enough that everything you
 * learn here transfers, but they are trimmed to the fields a harness actually
 * has to reason about. Nothing here is Anthropic-specific in spirit: every
 * provider that supports tool calling exposes some version of these shapes.
 */

export type Role = "user" | "assistant";

/** Plain prose from the user or the model. */
export type TextBlock = { type: "text"; text: string };

/**
 * The model's request to run a tool. Note what this is NOT: it is not the tool
 * running. The model can only ever *ask*. Execution is the harness's job, and
 * that asymmetry is the whole reason harnesses exist.
 */
export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

/** The harness's answer to a ToolUseBlock. `tool_use_id` pairs them up. */
export type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  /** Errors are reported in-band, as results. They are not thrown away. */
  is_error?: boolean;
};

/**
 * A block this harness does not understand, carried through untouched.
 *
 * Real providers emit blocks your harness was not written for -- thinking
 * blocks, citations, server-tool results, whatever ships next quarter. A
 * harness that drops them corrupts the conversation it replays. The rule is:
 * if you did not author a block, round-trip it byte-for-byte and never inspect
 * it. This type exists to make that rule impossible to forget.
 */
export type OpaqueBlock = { type: "opaque"; raw: unknown };

export type ContentBlock =
  | TextBlock
  | ToolUseBlock
  | ToolResultBlock
  | OpaqueBlock;

export type Message = { role: Role; content: ContentBlock[] };

export type ToolSchema = {
  name: string;
  /** The model chooses tools by reading this. It is prompt, not documentation. */
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
};

/**
 * One request to the model. The harness rebuilds this from scratch every turn.
 * There is no server-side conversation to append to: whatever is not in this
 * object does not exist as far as the model is concerned.
 */
export type ProviderRequest = {
  system: string;
  messages: Message[];
  tools: ToolSchema[];
};

export type StopReason = "end_turn" | "tool_use" | "max_tokens";

export type ProviderResponse = {
  stop_reason: StopReason;
  content: ContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
};

export interface Provider {
  readonly name: string;
  send(request: ProviderRequest): Promise<ProviderResponse>;
}

/* ---- small helpers used by every stage ---- */

export function text(s: string): TextBlock {
  return { type: "text", text: s };
}

export function userText(s: string): Message {
  return { role: "user", content: [text(s)] };
}

export function toolUses(msg: ProviderResponse | Message): ToolUseBlock[] {
  return msg.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
}

export function textOf(content: ContentBlock[]): string {
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

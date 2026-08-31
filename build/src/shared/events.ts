/**
 * A minimal extension surface.
 *
 * pi.dev exposes roughly thirty lifecycle events -- before_agent_start,
 * tool_call, tool_result, context, session_before_compact, before_provider_
 * request, and so on -- and lets a TypeScript module subscribe to any of them.
 * This is the same idea with five events, which is enough to show the shape.
 *
 * The claim worth testing: once a harness has an event surface, the interesting
 * work stops happening in the core. Everything in stage 7 -- a new tool, secret
 * redaction, an injected reminder -- is added from OUTSIDE, and `loop.ts` is
 * not edited once.
 */
import type { Message, ProviderRequest, ProviderResponse, ToolResultBlock, ToolUseBlock } from "../provider/types.js";
import type { Tool, ToolRegistry } from "./tools.js";

export type Events = {
  /** Mutate what goes on the wire. Compaction and context injection live here. */
  before_request: (request: ProviderRequest) => ProviderRequest;
  after_response: (response: ProviderResponse) => void;
  /** Return a string to DENY with that reason. The permission gate is one of these. */
  tool_call: (call: ToolUseBlock) => true | string;
  /** Last chance to change a result before the model ever sees it. */
  tool_result: (result: ToolResultBlock, call: ToolUseBlock) => ToolResultBlock;
  message: (message: Message) => void;
};

type Handler<K extends keyof Events> = Events[K];

export class Harness {
  private handlers: { [K in keyof Events]: Handler<K>[] } = {
    before_request: [],
    after_response: [],
    tool_call: [],
    tool_result: [],
    message: [],
  };

  constructor(readonly registry: ToolRegistry) {}

  on<K extends keyof Events>(event: K, handler: Handler<K>): void {
    this.handlers[event].push(handler);
  }

  /** Extensions add capability, they do not ask the core for permission. */
  registerTool(tool: Tool): void {
    this.registry.register(tool);
  }

  emitBeforeRequest(request: ProviderRequest): ProviderRequest {
    return this.handlers.before_request.reduce((acc, h) => h(acc), request);
  }

  emitAfterResponse(response: ProviderResponse): void {
    for (const h of this.handlers.after_response) h(response);
  }

  /** First refusal wins. A single "no" from any extension is a denial. */
  emitToolCall(call: ToolUseBlock): true | string {
    for (const h of this.handlers.tool_call) {
      const verdict = h(call);
      if (verdict !== true) return verdict;
    }
    return true;
  }

  emitToolResult(result: ToolResultBlock, call: ToolUseBlock): ToolResultBlock {
    return this.handlers.tool_result.reduce((acc, h) => h(acc, call), result);
  }

  emitMessage(message: Message): void {
    for (const h of this.handlers.message) h(message);
  }
}

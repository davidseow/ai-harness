/**
 * The loop from stage 1, factored out so later stages can add one capability
 * each without reprinting it. The shape has not changed at all: send, execute,
 * append, repeat. What changed is that the hooks below let you intervene.
 *
 * Those hooks are the point. A harness is not defined by its loop -- every
 * harness has the same loop -- it is defined by what it lets you do at each
 * step of it. Compare this handful of hooks with pi.dev's event list (lesson
 * 15) and you are looking at the same idea at two different scales.
 */
import type {
  ContentBlock,
  Message,
  Provider,
  ProviderRequest,
  ProviderResponse,
  ToolResultBlock,
  ToolUseBlock,
} from "../provider/types.js";
import type { ToolRegistry } from "./tools.js";

export type Hooks = {
  /** Last chance to change what the model sees. Compaction lives here. */
  beforeRequest?(request: ProviderRequest, turn: number): ProviderRequest | Promise<ProviderRequest>;
  afterResponse?(response: ProviderResponse, turn: number): void | Promise<void>;
  /**
   * Called before a tool runs. Return `false` to deny it. This single hook is
   * where a permission system, an audit log, and a sandbox all attach.
   */
  beforeTool?(call: ToolUseBlock): boolean | string | Promise<boolean | string>;
  afterTool?(call: ToolUseBlock, result: ToolResultBlock): void | Promise<void>;
  onMessage?(message: Message): void | Promise<void>;
};

export type LoopOptions = {
  provider: Provider;
  registry: ToolRegistry;
  system: string;
  workspace: string;
  messages?: Message[];
  /** A hard stop. Without one, a model that loops forever costs money forever. */
  maxTurns?: number;
  hooks?: Hooks;
};

export type LoopResult = { messages: Message[]; turns: number; stoppedBy: string };

export async function runLoop(options: LoopOptions): Promise<LoopResult> {
  const { provider, registry, workspace, hooks = {} } = options;
  const maxTurns = options.maxTurns ?? 12;
  const messages: Message[] = options.messages ?? [];

  for (let turn = 1; turn <= maxTurns; turn++) {
    let request: ProviderRequest = {
      system: options.system,
      messages,
      tools: registry.schemas(),
    };
    if (hooks.beforeRequest) request = await hooks.beforeRequest(request, turn);

    const response = await provider.send(request);
    await hooks.afterResponse?.(response, turn);

    const assistant: Message = { role: "assistant", content: response.content };
    messages.push(assistant);
    await hooks.onMessage?.(assistant);

    if (response.stop_reason !== "tool_use") {
      return { messages, turns: turn, stoppedBy: response.stop_reason };
    }

    const calls = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    const results: ContentBlock[] = [];

    for (const call of calls) {
      results.push(await executeOne(call, registry, workspace, hooks));
    }

    const toolTurn: Message = { role: "user", content: results };
    messages.push(toolTurn);
    await hooks.onMessage?.(toolTurn);
  }

  // Falling out of the loop is a real outcome, not an error. Say so plainly
  // rather than pretending the agent finished.
  return { messages, turns: maxTurns, stoppedBy: "max_turns" };
}

async function executeOne(
  call: ToolUseBlock,
  registry: ToolRegistry,
  workspace: string,
  hooks: Hooks,
): Promise<ToolResultBlock> {
  const gate = await hooks.beforeTool?.(call);
  if (gate === false || typeof gate === "string") {
    const denied: ToolResultBlock = {
      type: "tool_result",
      tool_use_id: call.id,
      content: typeof gate === "string" ? gate : "Denied by the user.",
      is_error: true,
    };
    // A denial is still a tool result and still an observable event. Skipping
    // afterTool here would make the one thing worth auditing the one thing
    // invisible in the log.
    await hooks.afterTool?.(call, denied);
    return denied;
  }

  const tool = registry.get(call.name);
  if (!tool) {
    return {
      type: "tool_result",
      tool_use_id: call.id,
      content: `No tool named "${call.name}".`,
      is_error: true,
    };
  }

  let result: ToolResultBlock;
  try {
    result = {
      type: "tool_result",
      tool_use_id: call.id,
      content: await tool.execute(call.input, { workspace }),
    };
  } catch (error) {
    // A failed tool is not an exception to propagate -- it is information the
    // model needs in order to try something else. Throwing here would end the
    // run; returning the error lets the agent recover.
    result = {
      type: "tool_result",
      tool_use_id: call.id,
      content: error instanceof Error ? error.message : String(error),
      is_error: true,
    };
  }

  await hooks.afterTool?.(call, result);
  return result;
}

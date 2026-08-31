import type {
  Provider,
  ProviderRequest,
  ProviderResponse,
} from "./types.js";

/**
 * A scripted stand-in for a real model.
 *
 * Be clear about what this does and does not do. It does NOT simulate a model's
 * judgement -- it replays replies you wrote in advance. What it buys you is the
 * ability to see the *harness* with total clarity: the loop, the request that
 * gets rebuilt each turn, the tool plumbing, the context arithmetic. Those are
 * mechanical and deterministic, and they are what these stages are about.
 *
 * The most useful thing it does is record every request it was sent, so you can
 * look at exactly what the model would have seen on turn 3.
 */
export class MockProvider implements Provider {
  readonly name = "mock";
  /** Every request this provider was handed, in order. */
  readonly seen: ProviderRequest[] = [];
  private cursor = 0;

  constructor(private readonly script: ProviderResponse[]) {}

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    // Deep-copy so later mutation of the live history can't rewrite what we
    // recorded. A recorded request has to be a snapshot to be worth anything.
    this.seen.push(structuredClone(request));

    const next = this.script[this.cursor];
    if (!next) {
      throw new Error(
        `mock script exhausted after ${this.cursor} replies; the loop asked for one more`,
      );
    }
    this.cursor += 1;
    return structuredClone(next);
  }

  /** How many turns the loop actually ran. */
  get turns(): number {
    return this.cursor;
  }
}

/* ---- terse builders, so fixtures read like a screenplay ---- */

export function says(text: string): ProviderResponse {
  return {
    stop_reason: "end_turn",
    content: [{ type: "text", text }],
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

export function calls(
  ...tools: { id: string; name: string; input: Record<string, unknown> }[]
): ProviderResponse {
  return {
    stop_reason: "tool_use",
    content: tools.map((t) => ({ type: "tool_use" as const, ...t })),
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

/** A turn that says something *and* calls a tool -- the common real-world shape. */
export function saysAndCalls(
  text: string,
  ...tools: { id: string; name: string; input: Record<string, unknown> }[]
): ProviderResponse {
  return {
    stop_reason: "tool_use",
    content: [
      { type: "text", text },
      ...tools.map((t) => ({ type: "tool_use" as const, ...t })),
    ],
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

/**
 * The real provider. Everything in these stages runs against MockProvider by
 * default; this file is the one-file swap that points the same harness at a
 * live model.
 *
 * You do not need to run this to follow the lessons. It is here so that the
 * mock is honest about what it is standing in for.
 *
 * Requires: `npm i @anthropic-ai/sdk` and an ANTHROPIC_API_KEY (or an
 * `ant auth login` profile, which the SDK picks up with no env var set).
 */
import type {
  ContentBlock,
  Message,
  Provider,
  ProviderRequest,
  ProviderResponse,
  StopReason,
} from "./types.js";

const MODEL = "claude-opus-5";

export class AnthropicProvider implements Provider {
  readonly name = "anthropic";
  // Typed as unknown so this file compiles with the SDK absent. The real type
  // is Anthropic from "@anthropic-ai/sdk".
  private client: any;

  private constructor(client: unknown) {
    this.client = client;
  }

  /** Async because the SDK is imported on demand -- absent SDK, absent cost. */
  static async create(): Promise<AnthropicProvider> {
    // @ts-ignore -- optional dependency. The SDK is deliberately NOT installed
    // by default so that `npm install` costs nothing and no stage can be
    // tempted into spending money. Run `npm i @anthropic-ai/sdk` to enable it.
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    return new AnthropicProvider(new Anthropic());
  }

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Adaptive thinking is the current shape; `budget_tokens` is rejected on
      // this model family. Claude decides depth per request.
      thinking: { type: "adaptive" },
      // Prompt caching is a prefix-match: tools render first, then system, then
      // messages. Marking the end of `system` caches everything stable above it.
      // Anything volatile must live *after* this point or the cache never hits.
      system: [
        {
          type: "text",
          text: request.system,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: request.tools,
      messages: request.messages.map(toSdkMessage),
    });

    return {
      stop_reason: response.stop_reason as StopReason,
      content: response.content.map(fromSdkBlock),
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    };
  }
}

/** Our shape -> the wire. Opaque blocks go back exactly as they arrived. */
function toSdkMessage(message: Message): unknown {
  return {
    role: message.role,
    content: message.content.map((block) =>
      block.type === "opaque" ? block.raw : block,
    ),
  };
}

/**
 * The wire -> our shape. Anything we did not model becomes opaque rather than
 * being dropped. Dropping a thinking block here is the kind of bug that shows
 * up three turns later as an unexplained API error.
 */
function fromSdkBlock(block: any): ContentBlock {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.text };
    case "tool_use":
      return {
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: block.input,
      };
    default:
      return { type: "opaque", raw: block };
  }
}

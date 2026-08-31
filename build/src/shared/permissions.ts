/**
 * The permission gate.
 *
 * This is the entire security boundary of an agent, and it is worth being
 * precise about where it sits: NOT in the system prompt, NOT in the tool
 * descriptions, NOT in the model's good judgement. It sits here, in code that
 * runs between the model asking and the tool running. Everything above this
 * line is advice the model may or may not follow. This line is enforcement.
 *
 * Note the asymmetry the policy below is forced into. A dedicated tool arrives
 * with typed arguments you can inspect exactly. `bash` arrives as one opaque
 * string, so the only available check is pattern-matching -- which is a
 * blocklist, and blocklists lose. `rm -rf x`, `rm  -rf x`, `$(echo rm) -rf x`
 * and `find . -delete` are the same intent wearing four hats.
 *
 * That is the concrete argument for promoting an action out of bash into a
 * tool of its own: not tidiness, but the ability to gate it precisely.
 */
import type { ToolUseBlock } from "../provider/types.js";

export type Decision = { allow: true } | { allow: false; reason: string };

export type Policy = (call: ToolUseBlock) => Decision;

const DESTRUCTIVE = [
  /\brm\s+-[a-z]*[rf]/i,
  /\bgit\s+push\s+--force/i,
  /\bgit\s+reset\s+--hard/i,
  /\bfind\b.*-delete/i,
  /\b(mkfs|dd)\b/i,
  /:\(\)\s*\{.*\}\s*;/, // fork bomb
];

/** Anything that could carry data off the machine. */
const NETWORK = [/\bcurl\b/i, /\bwget\b/i, /\bnc\b/i, /\bssh\b/i];

export const readOnlyPolicy: Policy = (call) => {
  if (call.name === "read" || call.name === "ls") return { allow: true };
  return { allow: false, reason: `Denied: this session is read-only (tried "${call.name}").` };
};

/**
 * The policy the stage demonstrates: allow ordinary work, refuse the two
 * categories you cannot undo -- destroying data, and moving it off-machine.
 */
export const defaultPolicy: Policy = (call) => {
  if (call.name !== "bash") return { allow: true };

  const command = String(call.input.command ?? "");
  if (DESTRUCTIVE.some((re) => re.test(command))) {
    return { allow: false, reason: `Denied: "${command}" destroys data irreversibly.` };
  }
  if (NETWORK.some((re) => re.test(command))) {
    return {
      allow: false,
      reason: `Denied: "${command}" contacts the network. Anything in context can leave this way.`,
    };
  }
  return { allow: true };
};

/** Every decision, so you can show your work afterwards. */
export type AuditEntry = { tool: string; input: unknown; allowed: boolean; reason?: string };

export class Gate {
  readonly audit: AuditEntry[] = [];

  constructor(private readonly policy: Policy) {}

  /** Shaped for `Hooks.beforeTool`: true to allow, a string to deny with a reason. */
  check = (call: ToolUseBlock): true | string => {
    const decision = this.policy(call);
    this.audit.push({
      tool: call.name,
      input: call.input,
      allowed: decision.allow,
      reason: decision.allow ? undefined : decision.reason,
    });
    return decision.allow ? true : decision.reason;
  };
}

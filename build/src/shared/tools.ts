/**
 * The tool registry: schemas the model reads, and implementations it never sees.
 *
 * Two halves, and keeping them straight is most of tool design:
 *
 *   schema  -- prompt. The model picks tools by reading `description`. A vague
 *              description is a prompt bug that looks like a model failure.
 *   execute -- code. The model cannot run this. It can only ask, and the harness
 *              decides whether to comply. Every safety property you have lives
 *              on this side of the line.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolSchema } from "../provider/types.js";

const run = promisify(execFile);

export type ToolContext = { workspace: string };

export type Tool = {
  schema: ToolSchema;
  /**
   * Read-only tools can be run concurrently; anything that mutates cannot.
   * The harness can only know this for *dedicated* tools -- it cannot tell a
   * parallel-safe `grep` from a parallel-unsafe `git push` when both arrive as
   * an opaque `bash` string. That is one concrete reason to promote an action
   * out of bash and into a tool of its own.
   */
  parallelSafe: boolean;
  execute(input: Record<string, unknown>, ctx: ToolContext): Promise<string>;
};

/** Keep every path inside the workspace. The model does not get to escape it. */
function resolveInside(workspace: string, relative: string): string {
  const target = path.resolve(workspace, relative);
  const root = path.resolve(workspace);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(`path escapes the workspace: ${relative}`);
  }
  return target;
}

export const readTool: Tool = {
  parallelSafe: true,
  schema: {
    name: "read",
    description:
      "Read a UTF-8 text file from the workspace. Returns the file's full contents.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string", description: "Path relative to the workspace root." } },
      required: ["path"],
    },
  },
  async execute(input, ctx) {
    return fs.readFile(resolveInside(ctx.workspace, String(input.path)), "utf8");
  },
};

export const writeTool: Tool = {
  parallelSafe: false,
  schema: {
    name: "write",
    description: "Create or overwrite a file in the workspace with the given contents.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path relative to the workspace root." },
        contents: { type: "string", description: "The full text to write." },
      },
      required: ["path", "contents"],
    },
  },
  async execute(input, ctx) {
    const target = resolveInside(ctx.workspace, String(input.path));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, String(input.contents), "utf8");
    return `wrote ${input.path} (${String(input.contents).length} bytes)`;
  },
};

export const editTool: Tool = {
  parallelSafe: false,
  schema: {
    name: "edit",
    description:
      "Replace an exact string in a file. Fails if the string is absent or appears more than once.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path relative to the workspace root." },
        old: { type: "string", description: "Exact text to replace. Must be unique in the file." },
        new: { type: "string", description: "Replacement text." },
      },
      required: ["path", "old", "new"],
    },
  },
  async execute(input, ctx) {
    const target = resolveInside(ctx.workspace, String(input.path));
    const before = await fs.readFile(target, "utf8");
    const old = String(input.old);
    const hits = before.split(old).length - 1;
    // Refusing an ambiguous edit is the whole reason `edit` exists as a tool
    // rather than as a `sed` call through bash: the harness can enforce an
    // invariant that an opaque shell string cannot express.
    if (hits === 0) throw new Error(`string not found in ${input.path}`);
    if (hits > 1) throw new Error(`string appears ${hits} times in ${input.path}; must be unique`);
    await fs.writeFile(target, before.replace(old, String(input.new)), "utf8");
    return `edited ${input.path}`;
  },
};

export const lsTool: Tool = {
  parallelSafe: true,
  schema: {
    name: "ls",
    description: "List the files and directories at a path in the workspace.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string", description: "Path relative to the workspace root." } },
      required: ["path"],
    },
  },
  async execute(input, ctx) {
    const entries = await fs.readdir(resolveInside(ctx.workspace, String(input.path)), {
      withFileTypes: true,
    });
    return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name)).join("\n") || "(empty)";
  },
};

export const bashTool: Tool = {
  parallelSafe: false,
  schema: {
    name: "bash",
    description:
      "Run a shell command in the workspace and return its combined stdout and stderr.",
    input_schema: {
      type: "object",
      properties: { command: { type: "string", description: "The shell command to run." } },
      required: ["command"],
    },
  },
  async execute(input, ctx) {
    const { stdout, stderr } = await run("bash", ["-c", String(input.command)], {
      cwd: ctx.workspace,
      timeout: 10_000,
    });
    return (stdout + stderr).trim() || "(no output)";
  },
};

/** pi.dev ships four tools by default. These are they, plus `ls` for legibility. */
export const DEFAULT_TOOLS: Tool[] = [readTool, writeTool, editTool, bashTool, lsTool];

export class ToolRegistry {
  private readonly byName = new Map<string, Tool>();

  constructor(tools: Tool[] = []) {
    for (const tool of tools) this.register(tool);
  }

  register(tool: Tool): void {
    this.byName.set(tool.schema.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.byName.get(name);
  }

  /** Exactly what gets sent to the model -- and what it is billed for, every turn. */
  schemas(): ToolSchema[] {
    return [...this.byName.values()].map((t) => t.schema);
  }

  get size(): number {
    return this.byName.size;
  }
}

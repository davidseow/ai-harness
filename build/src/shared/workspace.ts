/**
 * A scratch directory each stage works in.
 *
 * Every stage gets a fresh one so transcripts are reproducible. It is also the
 * crudest possible sandbox: the tools in `tools.ts` refuse to resolve a path
 * outside it. That is real containment for file paths and no containment at
 * all for `bash`, which is precisely the gap stage 5 is about.
 */
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export async function freshWorkspace(name: string): Promise<string> {
  const dir = path.join(os.tmpdir(), `harness-${name}`);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function seed(
  workspace: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [rel, contents] of Object.entries(files)) {
    const target = path.join(workspace, rel);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, contents, "utf8");
  }
}

export async function exists(workspace: string, rel: string): Promise<boolean> {
  try {
    await fs.stat(path.join(workspace, rel));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sessions: an append-only log of everything that happened.
 *
 * The format is JSONL -- one JSON object per line -- and the choice is not
 * incidental. Append-only means a crash mid-turn loses at most the last line;
 * line-oriented means you can tail it, grep it, and replay a prefix of it
 * without parsing the whole file. pi.dev stores sessions exactly this way, in
 * ~/.pi/agent/sessions/.
 *
 * The important property is that the log is LOSSLESS while the context is not.
 * Compaction (stage 4) throws away what the model can see; the log still has
 * it. That gap is what makes /fork and "what did it actually do?" possible
 * after the fact.
 */
import * as fs from "node:fs/promises";
import type { Message } from "../provider/types.js";

export type Entry = {
  /** Monotonic id. Forking means "replay every entry up to this one". */
  seq: number;
  /** Parent entry, so branches form a tree rather than a list. */
  parent: number | null;
  at: string;
  kind: "message" | "note";
  message?: Message;
  note?: string;
};

export class SessionLog {
  private seq = 0;
  private last: number | null = null;

  private constructor(
    readonly path: string,
    private entries: Entry[],
  ) {
    const tail = entries[entries.length - 1];
    this.seq = tail ? tail.seq : 0;
    this.last = tail ? tail.seq : null;
  }

  static async create(path: string): Promise<SessionLog> {
    await fs.writeFile(path, "", "utf8");
    return new SessionLog(path, []);
  }

  static async open(path: string): Promise<SessionLog> {
    const raw = await fs.readFile(path, "utf8");
    const entries = raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as Entry);
    return new SessionLog(path, entries);
  }

  async append(entry: Omit<Entry, "seq" | "parent" | "at">): Promise<Entry> {
    const full: Entry = {
      seq: ++this.seq,
      parent: this.last,
      at: new Date().toISOString(),
      ...entry,
    };
    this.last = full.seq;
    this.entries.push(full);
    // One line, one flush. Nothing is "in flight" between turns.
    await fs.appendFile(this.path, JSON.stringify(full) + "\n", "utf8");
    return full;
  }

  /** The conversation as the loop wants it: messages only, in order. */
  messages(upTo = Infinity): Message[] {
    return this.entries
      .filter((e) => e.kind === "message" && e.seq <= upTo && e.message)
      .map((e) => e.message!);
  }

  all(): Entry[] {
    return [...this.entries];
  }

  /**
   * Fork: keep history up to `seq`, then continue somewhere else. Nothing is
   * deleted -- the abandoned branch stays in the file, which is why you can
   * navigate back to it.
   */
  async fork(seq: number, toPath: string): Promise<SessionLog> {
    const kept = this.entries.filter((e) => e.seq <= seq);
    await fs.writeFile(toPath, kept.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");
    return SessionLog.open(toPath);
  }
}

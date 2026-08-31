/**
 * Concatenate lessons/ into COURSE.md — one continuous read.
 *
 * Cross-references between lessons become anchors within the single document, and
 * "Next:" footers are dropped because in a single scroll the next lesson is simply
 * next. Links out to build/ and reading/ are kept: they still resolve on GitHub,
 * and in the PDF they read as citations.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const lessonDir = path.join(root, "lessons");
const files = (await fs.readdir(lessonDir)).filter((f) => f.endsWith(".md")).sort();

const slug = (f) => f.replace(/\.md$/, "");
const anchors = new Map(files.map((f) => [f, `#${slug(f)}`]));

const parts = [
  `# How an AI Harness Works`,
  ``,
  `*A course in 21 short lessons. Every transcript is real captured output.*`,
  ``,
  `Generated from [\`lessons/\`](lessons/) on ${new Date().toISOString().slice(0, 10)}.`,
  `The individual lesson files, the runnable code, the reference catalogues and the`,
  `teaching kit all live in the repository.`,
  ``,
  `---`,
  ``,
  `## Contents`,
  ``,
];

for (const file of files) {
  const text = await fs.readFile(path.join(lessonDir, file), "utf8");
  const title = text.match(/^# (.+)$/m)?.[1] ?? slug(file);
  parts.push(`- [${title}](${anchors.get(file)})`);
}
parts.push("", "---", "");

for (const file of files) {
  let text = await fs.readFile(path.join(lessonDir, file), "utf8");

  // Drop the "Next:" footer -- meaningless in a single scroll.
  text = text.replace(/\n\*\*Next:\*\*.*$/s, "\n");
  // Rewrite lesson-to-lesson links into in-document anchors.
  for (const [target, anchor] of anchors) {
    text = text.replaceAll(`](${target})`, `](${anchor})`);
  }
  // Paths were relative to lessons/; from the repo root they lose the "../".
  text = text.replace(/\]\(\.\.\//g, "](");
  // Demote inner headings FIRST, then promote the title. Doing it the other way
  // round demotes the title too, because by then it is also an h2.
  text = text.replace(/^## /gm, "### ");
  // Give each lesson a stable anchor for the contents list above.
  text = text.replace(/^# /m, `<a id="${slug(file)}"></a>\n\n## `);

  parts.push(text.trimEnd(), "", "---", "");
}

await fs.writeFile(path.join(root, "COURSE.md"), parts.join("\n"), "utf8");
console.log(`COURSE.md written from ${files.length} lessons`);

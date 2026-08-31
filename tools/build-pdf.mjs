/**
 * Render COURSE.md to course.pdf for reading on a phone.
 *
 * Chromium is already on this machine (Playwright's copy), so there is no
 * dependency to install beyond a markdown parser. The print CSS matters more than
 * it looks: the transcripts in this course are wide, monospaced, and the whole
 * point of the PDF is that they stay legible on a small screen.
 */
import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import { marked } from "marked";

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const markdown = await fs.readFile(path.join(root, "COURSE.md"), "utf8");
const body = marked.parse(markdown, { gfm: true, breaks: false });

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>How an AI Harness Works</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font: 10.5pt/1.55 "DejaVu Serif", Georgia, serif;
    color: #1a1a1a; max-width: 100%; margin: 0;
  }
  h1 { font-size: 22pt; line-height: 1.2; margin: 0 0 4pt; }
  /* Each lesson starts on a fresh page -- they are meant to be read one at a time. */
  h2 { font-size: 15pt; margin: 0 0 10pt; padding-top: 4pt; break-before: page; }
  h1 + p + p + p, .toc { break-after: page; }
  h3 { font-size: 11.5pt; margin: 16pt 0 5pt; color: #000; }
  h2, h3 { font-family: "DejaVu Sans", Helvetica, sans-serif; break-after: avoid; }
  p, li { orphans: 2; widows: 2; }
  a { color: #14507a; text-decoration: none; }
  blockquote {
    margin: 10pt 0; padding: 6pt 10pt; border-left: 3px solid #b8b8b8;
    background: #f6f6f4; break-inside: avoid;
  }
  /* Transcripts are the reason this document exists. Keep them whole and small
     enough that the widest line fits the page rather than wrapping into soup. */
  pre {
    font-family: "DejaVu Sans Mono", monospace; font-size: 6.6pt; line-height: 1.35;
    background: #f6f6f4; border: 1px solid #e0e0dc; border-radius: 3px;
    padding: 7pt 8pt; overflow-wrap: break-word; white-space: pre-wrap;
    break-inside: avoid-page;
  }
  code { font-family: "DejaVu Sans Mono", monospace; font-size: 8.6pt; background: #f0f0ee; padding: 0 2px; }
  pre code { background: none; font-size: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 8.8pt; margin: 10pt 0; break-inside: avoid; }
  th, td { border: 1px solid #d5d5d0; padding: 3.5pt 5pt; text-align: left; vertical-align: top; }
  th { background: #efefec; font-family: "DejaVu Sans", sans-serif; }
  hr { border: none; border-top: 1px solid #ddd; margin: 14pt 0; }
  details { margin: 8pt 0; }
  ul, ol { padding-left: 18pt; }
</style></head><body>${body}</body></html>`;

const htmlPath = path.join(root, ".course.tmp.html");
await fs.writeFile(htmlPath, html, "utf8");

await run(CHROME, [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "--no-pdf-header-footer",
  `--print-to-pdf=${path.join(root, "course.pdf")}`,
  `file://${htmlPath}`,
], { timeout: 120_000 });

await fs.rm(htmlPath, { force: true });
const { size } = await fs.stat(path.join(root, "course.pdf"));
console.log(`course.pdf written (${(size / 1024).toFixed(0)} KB)`);

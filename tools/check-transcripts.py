#!/usr/bin/env python3
"""Every transcript line a lesson quotes must exist verbatim in a captured source.

This is the gate behind the README's claim that no output was written by hand.
Sources are build/transcripts/ (captured stage output) and reading/excerpts.md
(verbatim quotes from pi.dev's repository).
"""
import os, sys

MARKERS = ('→ SENT', '← GOT', '⟲ COMPACTED', '✂ truncated', 'BLOCKED',
           'seq=', 'allow  bash', 'DENY   bash', 'reports/q', '├─►', '└─►',
           'NO — it is gone', 'registry is now', '[redacted]')

sources = []
for fn in sorted(os.listdir('build/transcripts')):
    sources.append(open(f'build/transcripts/{fn}', encoding='utf8').read())
sources.append(open('reading/excerpts.md', encoding='utf8').read())
corpus = "\n".join(sources)

def fenced_blocks(text):
    """Yield the contents of fenced code blocks, tracking fence state by line."""
    inside, buf = False, []
    for line in text.split('\n'):
        if line.startswith('```'):
            if inside:
                yield '\n'.join(buf); buf = []
            inside = not inside
            continue
        if inside:
            buf.append(line)

missing, checked = [], 0
for fn in sorted(os.listdir('lessons')):
    text = open(f'lessons/{fn}', encoding='utf8').read()
    for block in fenced_blocks(text):
        for line in block.split('\n'):
            if not any(m in line for m in MARKERS):
                continue
            probe = line.strip().split('…')[0].rstrip()
            if len(probe) < 12:
                continue
            checked += 1
            if probe not in corpus:
                missing.append((fn, probe[:100]))

print(f"checked {checked} quoted transcript lines against captured sources")
if missing:
    print(f"\n{len(missing)} NOT FOUND:")
    for fn, l in missing:
        print(f"  {fn}: {l}")
    sys.exit(1)
print("every quoted line appears verbatim in a captured source")

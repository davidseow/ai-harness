#!/usr/bin/env python3
"""Build quality/harness-qe.html: the quality track as one offline phone app.

Source of truth is the markdown in quality/ (bites, notebook, flashcards). This
script only re-presents it: quizzes become tap-to-answer, flashcards become a
flip deck, progress is kept in the phone's browser. No network at runtime.

Run from the repo root:  python3 tools/build-quality-app.py [--fragment PATH]
--fragment also writes a copy without the <html>/<head> wrapper, for publishing.
"""
import html, json, os, re, sys

ROOT = 'quality'
OUT = f'{ROOT}/harness-qe.html'

# ---- a deliberately small markdown converter (only what quality/ uses) ------

def inline(text):
    # links first, so a label that is itself `code` still becomes a link
    pieces = re.split(r'(\[[^\]]+\]\([^)\s]+\))', text)
    if len(pieces) > 1:
        return ''.join(link(re.match(r'\[([^\]]+)\]\(([^)]+)\)', p)) if i % 2 else inline_text(p)
                       for i, p in enumerate(pieces))
    return inline_text(text)

def inline_text(text):
    parts = re.split(r'(`[^`]+`)', text)
    out = []
    for p in parts:
        if p.startswith('`') and p.endswith('`') and len(p) > 1:
            out.append(f'<code>{html.escape(p[1:-1])}</code>')
            continue
        s = html.escape(p, quote=False)
        s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
        s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
        out.append(s)
    return ''.join(out)

def link(m):
    label, url = inline_text(m.group(1)), m.group(2)
    bite = re.search(r'(?:^|/)(\d\d)-[\w-]+\.md$', url)
    if bite and 'lessons' not in url:
        return f'<a href="#bite-{bite.group(1)}">{label}</a>'
    if url.endswith('notebook.md'):
        return f'<a href="#notebook">{label}</a>'
    if url.endswith('README.md') and 'quality' in url or url == '../README.md':
        return f'<a href="#home">{label}</a>'
    if url.startswith('http'):
        return f'<a href="{url}" rel="noopener">{label}</a>'
    return f'<span class="ref" title="{html.escape(url)}">{label}</span>'

def md(src):
    lines = src.split('\n')
    out, para, i = [], [], 0

    def flush():
        if para:
            out.append('<p>' + inline(' '.join(para)) + '</p>')
            para.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if s.startswith('```'):
            flush(); i += 1; buf = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                buf.append(lines[i]); i += 1
            out.append('<div class="scroll"><pre><code>' + html.escape('\n'.join(buf)) + '</code></pre></div>')
        elif not s:
            flush()
        elif s == '---':
            flush(); out.append('<hr>')
        elif s.startswith('<details>') or s == '</details>':
            flush()
            m = re.match(r'<details><summary>(.*)</summary>', s)
            out.append(f'<details><summary>{inline(m.group(1))}</summary>' if m else '</details>')
        elif s.startswith('#'):
            flush()
            n = len(s) - len(s.lstrip('#'))
            out.append(f'<h{n + 1}>{inline(s[n:].strip())}</h{n + 1}>')
        elif s.startswith('|'):
            flush(); rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append(lines[i].strip()); i += 1
            i -= 1
            cells = [[c.strip() for c in r.strip('|').split('|')] for r in rows]
            body = [r for r in cells[1:] if not all(re.fullmatch(r':?-+:?', c) for c in r)]
            t = '<div class="scroll"><table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in cells[0]) + '</tr></thead><tbody>'
            t += ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in body)
            out.append(t + '</tbody></table></div>')
        elif s.startswith('>'):
            flush(); buf = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                buf.append(lines[i].strip()[1:].strip()); i += 1
            i -= 1
            out.append('<blockquote>' + inline(' '.join(buf)) + '</blockquote>')
        elif re.match(r'(- |\d+\. )', s):
            flush()
            tag = 'ol' if s[0].isdigit() else 'ul'
            items = []
            while i < len(lines):
                t = lines[i]
                if re.match(r'\s*(- |\d+\. )', t) and (len(t) - len(t.lstrip())) < 2:
                    items.append(re.sub(r'^\s*(- |\d+\. )', '', t))
                elif t.startswith('  ') and t.strip() and items:
                    items[-1] += ' ' + t.strip()
                else:
                    break
                i += 1
            i -= 1
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x)}</li>' for x in items) + f'</{tag}>')
        else:
            para.append(s)
        i += 1
    flush()
    return '\n'.join(out)

# ---- bites ------------------------------------------------------------------

def parse_quiz(section):
    quiz = []
    for chunk in section.split('### Q:')[1:]:
        q = chunk.split('\n', 1)[0].strip()
        opts = re.findall(r'^- ([A-D]): (.+)$', chunk, re.M)
        ans = re.search(r'\*\*([A-D])\*\* — (.+?)\n\n</details>', chunk, re.S)
        if not (opts and ans):
            sys.exit(f'quiz parse failed near: {q[:60]}')
        quiz.append({'q': inline(q), 'options': [{'k': k, 'text': inline(t)} for k, t in opts],
                     'answer': ans.group(1), 'why': inline(' '.join(ans.group(2).split()))})
    return quiz

bites = []
for fn in sorted(os.listdir(f'{ROOT}/bites')):
    src = open(f'{ROOT}/bites/{fn}', encoding='utf8').read()
    num, title = re.match(r'# (\d\d) — (.+)', src).groups()
    meta = re.search(r'^\*\*(~\d+ min[^*]+)\*\*', src, re.M).group(1)
    module = re.search(r'· (M\d) ([^·*]+)', meta)
    oneline = re.search(r'\*\*In one line:\*\* (.+?)\n\n', src, re.S).group(1)
    oneline = ' '.join(l.lstrip('> ').strip() for l in oneline.split('\n'))
    body = src.split('\n## ', 1)[1]
    body = '## ' + re.sub(r'\n\*\*Next:\*\*.*', '', body, flags=re.S)
    sections = re.split(r'(?m)^(?=## )', body)
    quiz, rest = [], []
    for sec in sections:
        if sec.startswith('## Check yourself'):
            quiz = parse_quiz(sec)
        else:
            rest.append(sec)
    bites.append({'id': num, 'title': title, 'minutes': int(re.search(r'~(\d+)', meta).group(1)),
                  'module': module.group(1), 'moduleName': module.group(2).strip(),
                  'oneline': inline(oneline), 'html': md(''.join(rest)), 'quiz': quiz})

cards = []
for row in open(f'{ROOT}/flashcards.md', encoding='utf8').read().split('\n'):
    if row.startswith('|') and not row.startswith('|---') and not row.startswith('| Front'):
        front, back = [c.strip() for c in row.strip('|').split('|')]
        cards.append({'front': inline(front), 'back': inline(back)})

notebook = open(f'{ROOT}/notebook.md', encoding='utf8').read().split('\n', 1)[1]
data = {'bites': bites, 'cards': cards, 'notebook': md(notebook)}

template = open(f'{ROOT}/app-template.html', encoding='utf8').read()
page = template.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
open(OUT, 'w', encoding='utf8').write(page)
print(f'wrote {OUT}: {len(bites)} bites, {sum(len(b["quiz"]) for b in bites)} questions, {len(cards)} cards')

if '--fragment' in sys.argv:
    path = sys.argv[sys.argv.index('--fragment') + 1]
    frag = re.sub(r'(?s)^.*?<head>\s*', '', page)
    frag = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', '', frag)
    frag = frag.replace('</head>', '').replace('<body>', '').replace('</body>', '').replace('</html>', '')
    open(path, 'w', encoding='utf8').write(frag)
    print(f'wrote {path}')

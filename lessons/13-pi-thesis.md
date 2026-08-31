# 13 — pi.dev's thesis: what a harness refuses to do

**~5 min · reading only · prerequisite: 12**

> **In one line:** pi is defined by six things it deliberately does not ship, each
> paired with the extension point where you build it yourself.

## The idea

Most harnesses are described by their feature list. pi is best understood by its
refusals, which it states outright:

> Pi is aggressively extensible so it doesn't have to dictate your workflow.
> Features that other tools bake in can be built with extensions, skills, or
> installed from third-party pi packages. This keeps the core minimal while letting
> you shape pi to fit how you work.
>
> **No MCP.** Build CLI tools with READMEs (see Skills), or build an extension that
> adds MCP support.
>
> **No sub-agents.** There's many ways to do this. Spawn pi instances via tmux, or
> build your own with extensions, or install a package that does it your way.
>
> **No permission popups.** Run in a container, or build your own confirmation flow
> with extensions inline with your environment and security requirements.
>
> **No plan mode.** Write plans to files, or build it with extensions, or install a
> package.
>
> **No built-in to-dos.** They confuse models. Use a TODO.md file, or build your own
> with extensions.
>
> **No background bash.** Use tmux. Full observability, direct interaction.
>
> — [`excerpts.md` §1](../reading/excerpts.md)

Read the structure, not just the content. Every refusal names its replacement. This
is not minimalism as an aesthetic — it is a claim that **the core should contain
only what cannot be built at the edges**, plus enough extension surface to build
the rest.

Three of the six are worth arguing with:

- **"No to-dos. They confuse models."** An empirical claim about model behaviour,
  stated flatly. It may or may not hold for your model and tasks — but notice it is
  the kind of claim you could actually test.
- **"No permission popups. Run in a container."** Lesson 10's route 2. Coherent, and
  it moves work onto you.
- **"No MCP."** The most contested. pi's author argues CLI tools with READMEs beat a
  protocol; the linked blog post is the argument, and it is worth reading precisely
  because it opposes something this course otherwise treats as normal.

## A correction worth making

You will read, in several places, that pi ships "four tools" and a "sub-1,000-token
system prompt". **Neither figure appears in pi's documentation.** The verified list
is eight:

> Available built-in tools: `read`, `bash`, `powershell` (Windows), `edit`,
> `write`, `grep`, `find`, `ls`
> — [`excerpts.md` §4](../reading/excerpts.md)

Seven cross-platform, plus `powershell` on Windows. The prompt size is not stated
anywhere in the docs, so this course does not repeat it.

This is worth flagging for its own sake: **secondary summaries of agent harnesses
drift fast, and the numbers are the first thing to go.** The primary source took
about ninety seconds to check. Do that before teaching a number to anyone.

The minimal-core thesis does not need the tidy figures. The six refusals make the
case far better, and they are verbatim.

## The package split

pi is a monorepo with a seam in the right place
([`excerpts.md` §10](../reading/excerpts.md)):

| Package | Role |
|---|---|
| `pi-ai` | unified multi-provider LLM API (OpenAI, Anthropic, Google, …) |
| `pi-agent-core` | agent runtime: tool calling and state management |
| `pi-coding-agent` | the interactive CLI |
| `pi-tui` | terminal UI with differential rendering |
| `pi-telemetry` | vendor-neutral telemetry contracts |

The seam that matters is `pi-ai` ↔ `pi-agent-core` — exactly the provider interface
from lesson 6, drawn at production scale. The loop never learns which vendor it is
talking to. The TUI being a separate package is the same instinct applied again:
rendering is not the agent.

## The trap

**Adopting the minimal core without adopting the responsibilities.** pi's position
only works if you actually do the things it points you at. "No permission popups"
is safe *in a container*; on a laptop with production credentials in the
environment, it is just no permission popups. The refusals are a division of labour,
and the other half of the labour is yours.

## Read this

- **[`reading/excerpts.md` §1](../reading/excerpts.md)** — the philosophy section
  in full. Two minutes, and the most quotable page in the course.
- **"What if you don't need MCP?"** — `https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/`
  The argument behind refusal number one. Read it to disagree well.
- **[`reading/excerpts.md` §4, §10](../reading/excerpts.md)** — the verified tool
  list and the package table.

## Teach it

**The analogy.** A kit car versus a hatchback. The kit car is not unfinished — it
has decided that *you* should choose the seats, and given you real mounting points.
That is only a good deal if you were going to change the seats.

**The question to open with.** *"Name a feature your agent tool has that you have
never used."* Everyone has one. pi's bet is that your list and mine barely overlap,
so the core should hold neither.

**The 60-second version.** pi ships eight tools and six explicit refusals — no MCP,
no subagents, no permission popups, no plan mode, no to-dos, no background bash —
each pointing at extensions. The core holds only what cannot be built at the edges.
That is a real design position, and it hands you responsibilities along with the
freedom.

---
*Sources: [`reading/excerpts.md`](../reading/excerpts.md) §1, §4, §10 · verified 2026-08-31*

**Next:** [14 — How pi assembles a system prompt](14-pi-context-assembly.md)

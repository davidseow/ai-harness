# Diagrams

Mermaid, so they render on GitHub and in most markdown viewers without a build step.
Each is paired with the lesson it belongs to and the one sentence it exists to make.

---

## 1. The loop (lesson 02)

> *The agent is a loop. Everything else is bolted onto it.*

```mermaid
flowchart TD
    A[user prompt] --> B[messages = prompt]
    B --> C{{"send: system + tools + ALL messages"}}
    C --> D[model responds]
    D --> E[append assistant turn to messages]
    E --> F{stop_reason?}
    F -- end_turn --> G([done])
    F -- max_turns --> H([stopped, NOT finished])
    F -- tool_use --> I[run each tool call]
    I --> J["append ALL results in ONE user message"]
    J --> C
```

Point at the edge from `J` back to `C`. That arrow is the whole subject: it re-sends
everything, every time.

---

## 2. Context is the only state (lesson 03)

> *Nothing persists. The request is rebuilt from scratch every turn.*

```mermaid
flowchart LR
    subgraph T1["turn 1 — 91 tok"]
        A1[user]
    end
    subgraph T2["turn 2 — 156 tok"]
        A2[user] --> B2[assistant] --> C2[tool result]
    end
    subgraph T3["turn 3 — 219 tok"]
        A3[user] --> B3[assistant] --> C3[tool result] --> D3[assistant] --> E3[tool result]
    end
    T1 --> T2 --> T3
```

Real numbers from `build/transcripts/stage1-loop.txt`. The growth is not waste; it is
the memory.

---

## 3. What a request is made of (lesson 04)

> *Four surfaces, and only one of them is cheap to change.*

```mermaid
flowchart TB
    subgraph REQ["one request — rebuilt every turn"]
        direction TB
        T["tools — schemas · fixed cost per turn"]
        S["system — assembled from files on disk"]
        M["messages — grows without bound"]
    end
    P["sampling params — model, thinking, effort"] -.-> REQ
    REQ --> API[(model)]
```

Render order is `tools` → `system` → `messages`. That order is why prompt caching
works the way it does: change anything early and everything after it is invalidated.

---

## 4. Truncation versus compaction (lesson 09)

> *One shortens a value. The other deletes history. Only one causes amnesia.*

```mermaid
flowchart TB
    R["tool result — 3979 chars"] -->|truncate: keep head+tail, LABEL the cut| R2["390 chars + marker"]
    R2 --> H["history"]
    H -->|grows past budget| CMP{compact}
    CMP -->|summarise dropped span| SUM["[Summary of 4 earlier messages]"]
    CMP -->|keep recent| KEEP["last N messages"]
    SUM --> H2["new history — the deploy key is GONE"]
    KEEP --> H2
    H -->|"unchanged, lossless"| LOG[("session JSONL")]
```

The two arrows out of `H` are the design: lossy to the model, lossless to disk.

---

## 5. The trust boundary (lessons 10, 19)

> *The gate is the only enforcement. Everything above it is advice.*

```mermaid
flowchart TB
    M[model] -->|"tool_use — a REQUEST, never an action"| G{permission gate}
    G -->|deny| D["tool_result is_error — agent recovers"]
    G -->|allow| X[tool executes]
    X --> W[(filesystem · network · credentials)]

    subgraph ADVICE["advice — persuasion only"]
        SP[system prompt]
        TD[tool descriptions]
    end
    subgraph ENFORCE["enforcement"]
        G
    end
    subgraph CONTAIN["containment — holds when the gate is wrong"]
        W
    end
```

The three boxes are the lesson. Most teams put safety properties in the top box.

---

## 6. Where untrusted text gets in (lesson 19)

> *Everything arrives as tokens. The model cannot tell data from instruction.*

```mermaid
flowchart LR
    F["repo files · AGENTS.md"] --> CTX
    W["fetched web pages"] --> CTX
    I["issue / PR comments"] --> CTX
    MCP["MCP tool descriptions"] --> CTX
    B["command output"] --> CTX
    SA["another agent's report"] --> CTX
    CTX[["context — all of it is just tokens"]] --> MODEL[model]
    MODEL --> ACT["exfiltrate · destroy · persist"]
```

Draw this, then ask which of the six inputs the audience has actually reviewed.

---

## 7. pi's intervention points (lesson 15)

> *Read the verbs. Interceptors let you govern; notifications only let you watch.*

```mermaid
flowchart TB
    PT["project_trust — CAN GATE"] --> SS[session_start]
    SS --> IN["input — CAN TRANSFORM"]
    IN --> BAS["before_agent_start — CAN INJECT / MODIFY PROMPT"]
    BAS --> TS[turn_start]
    TS --> CX["context — CAN MODIFY MESSAGES"]
    CX --> BPR["before_provider_request — CAN REPLACE PAYLOAD"]
    BPR --> LLM[model responds]
    LLM --> TC["tool_call — CAN BLOCK"]
    TC --> TR["tool_result — CAN MODIFY"]
    TR --> TE[turn_end]
    TE -->|more tool calls| TS
    TE --> AE[agent_end]
    AE --> CMP["session_before_compact — CAN CANCEL / CUSTOMISE"]
```

Simplified from pi's own diagram — the full version is in
[`../reading/excerpts.md`](../reading/excerpts.md) §7. Capitalised verbs are the
interceptors; plain nodes are notifications.

---

## 8. Sessions as a tree (lesson 11)

> *Fork is not undo. Nothing is deleted.*

```mermaid
flowchart TB
    S1["seq=1 — user: what port?"] --> S2["seq=2 — read app.ts"]
    S2 --> S3["seq=3 — result: PORT = 3000"]
    S3 --> S4["seq=4 — 'The port is 3000.'"]
    S4 --> S5["resumed: 'Are you sure?'"]
    S1 --> B1["branch: edit 3000 → 8080"]
    B1 --> B2["'Changed it to 8080 instead.'"]
```

Both paths exist in the log at once. Rewinding to a good turn removes bad reasoning
instead of arguing with it — which is why fork beats correction.

---

## Drawing these live

If you are at a whiteboard rather than a screen, draw only **1**, **5** and **7** —
in that order. The loop, the trust boundary, the intervention points. Everything else
in the course can be said in words once those three are on the wall.

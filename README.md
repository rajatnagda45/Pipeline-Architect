# VectorShift Pipeline Builder

A no-code AI pipeline builder — take-home technical assessment.

---

## Run Instructions

Two terminals, order matters (backend first so the frontend can reach it on submit).

### Terminal 1 — Backend

```bash
cd backend

# First time: create a Python 3.12 venv and install deps
python3.12 -m venv venv
# Windows:  .\venv\Scripts\pip install -r requirements.txt
# macOS/Linux: venv/bin/pip install -r requirements.txt
pip install -r requirements.txt

# Start the server
# Windows:  .\venv\Scripts\uvicorn main:app --reload
# macOS/Linux: uvicorn main:app --reload
uvicorn main:app --reload
# → http://localhost:8000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

### Tests

```bash
cd backend
# Windows:  .\venv\Scripts\python -m pytest test_dag.py -v
python -m pytest test_dag.py -v
# 13 tests, all should pass
```

---

## Architecture (3 sentences)

The Zustand store is the single source of truth for nodes and edges; every field edit calls `updateNodeField` which immutably updates store state, triggering a re-render of only the affected node. `BaseNode.js` is a single renderer driven by a `config` data object — static nodes are one-line wrappers around `<BaseNode config={…} />`; the Text node computes its input handles at render time by calling `config.computeInputs(data)`, so `{{ variable }}` expressions become live handles without any changes to BaseNode. On Submit, the frontend POSTs `{ nodes, edges }` to FastAPI's `/pipelines/parse`, which runs Kahn's topological sort and returns `{ num_nodes, num_edges, is_dag }`.

---

## Key Design Decision

**Config-driven node abstraction (`nodeConfigs.js` → `BaseNode.js`)**

The load-bearing question was: *how do you make five nodes that look similar without copy-pasting code, while still letting one node (Text) have dynamic handles?*

The answer is to separate *what a node is* (a plain data object) from *how it renders* (one component). A node config describes its title, accent color, field list, and handle list. BaseNode interprets any config. Static nodes are a single line: `(props) => <BaseNode {...props} config={inputNodeConfig} />`. Dynamic behavior is expressed as a function on the config (`computeInputs(data)`), called by BaseNode on every render — so handles update live as the user types without BaseNode knowing anything about `{{ }}` syntax.

The evidence that the abstraction is right: adding one of the five demo nodes required only a config object and a one-line wrapper. Zero changes to BaseNode.

**Why this over per-node components:**
- Per-node components duplicate handle positioning, field rendering, and style logic across every file
- When you change the visual design (border radius, header padding, hover state) you change it in one place instead of nine
- The contrast between the complex BaseNode and the trivial node wrappers is itself the demonstration — a reviewer can see the abstraction working

---

## DAG Algorithm Choice

**Kahn's topological sort** (iterative BFS, `O(V + E)`)

Build an in-degree count for every node. Enqueue all zero-in-degree nodes. Repeatedly dequeue, visit, and decrement neighbors — enqueue any neighbor whose in-degree reaches zero. `visited == len(nodes)` is a DAG; any remainder is in a cycle.

**Why Kahn's over recursive DFS-coloring:**
- Iterative → no Python recursion-depth limit on deep pipeline chains
- Single boolean signal (`visited == len(nodes)`) vs managing three color states
- Topological order is produced as a side effect — directly maps to pipeline execution order

**Dangling edge policy:** edges referencing a node id not in the node list are silently ignored. The graph is evaluated with only valid edges. This means a stale frontend edge never crashes the server.

---

## File Map

```
frontend/src/
│
├── nodes/
│   ├── BaseNode.js        ← single renderer for all node types
│   ├── nodeConfigs.js     ← declarative config for all 9 nodes
│   ├── fields/            ← TextField, SelectField, SliderField,
│   │                         TextareaField (mirror autoresize), NumberField
│   │
│   ├── inputNode.js       ← (props) => <BaseNode config={inputNodeConfig} />
│   ├── outputNode.js      ← same, one line
│   ├── llmNode.js         ← same, one line
│   ├── textNode.js        ← manages minWidth state + injects onResize callback
│   │
│   └── demo/              ← 5 nodes; each is one line — proof of concept
│       ├── filterNode.js
│       ├── mathNode.js
│       ├── apiNode.js
│       ├── delayNode.js
│       └── noteNode.js
│
├── lib/
│   └── parseVariables.js  ← extracts {{ valid_js_identifier }} from text
│
├── styles/
│   ├── theme.js           ← all design tokens (colors, spacing, radii, shadows)
│   └── nodeStyles.js      ← style-factory functions used by BaseNode + fields
│
├── store.js               ← Zustand: nodes, edges, updateNodeField (immutable)
├── ui.js                  ← ReactFlow canvas, drag-drop, node type registry
├── toolbar.js             ← draggable node palette
└── submit.js              ← POST pipeline, inline result panel (3 error types)

backend/
├── main.py                ← FastAPI + CORS
├── dag.py                 ← is_dag() — pure function, isolated
├── models.py              ← Pydantic: Node (id only required), Edge (source+target only)
└── test_dag.py            ← 13 tests covering the full spec case matrix
```

---

## Known Limitations & What I'd Do With More Time

**Inline styles instead of a CSS framework**
Tailwind would require ejecting or adding CRACO. Chakra/MUI would add weight for a demo. Instead, all tokens live in `theme.js` and all style logic in `nodeStyles.js` — same single-source-of-truth discipline, different delivery mechanism. With more time: add Tailwind via `craco` config and convert.

**No persistence**
Nodes live in memory. Refreshing the page loses the canvas. Fix: Zustand's `persist` middleware + `localStorage`. Two lines of code; skipped to stay in scope.

**Result panel instead of toast**
The inline result panel replaced `alert()` (blocking, mobile-hostile) but doesn't auto-dismiss or stack multiple results. Fix: `react-hot-toast` — one `npm install` and a one-line wrapper.

**No cycle visualisation**
When `is_dag: false`, the backend identifies the graph has a cycle but doesn't return *which* edges form it. A better UX would highlight the cycle in red on the canvas. Fix: extend the backend response with `cycle_edges: list[str]` (Kahn's naturally identifies stranded nodes) and apply a red stroke in the frontend.

**No edge type enforcement**
Any handle can connect to any other handle. A production system would declare handle types on configs (e.g. `type: 'text' | 'file'`) and validate compatibility on `onConnect`.

**TypeScript**
The config shape, field types, and handle types are documented in JSDoc comments but not enforced. With more time: convert to `.tsx` and define `NodeConfig`, `FieldConfig`, `HandleConfig` interfaces — the existing structure maps cleanly to a discriminated union.

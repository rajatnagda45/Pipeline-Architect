# Pipeline Architect

Pipeline Architect is a modern visual workflow builder that enables users to create, validate, and manage AI-powered pipelines through a drag-and-drop interface. The platform uses a Directed Acyclic Graph (DAG) architecture, allowing users to visually connect nodes and design complex workflows without writing extensive code.

---

## 🚀 Features

### Visual Workflow Builder
- Drag-and-drop workflow creation
- Interactive node-based canvas
- Real-time connection management
- Smooth zooming and navigation

### Advanced Node System
Built-in support for:
- Input Node
- Output Node
- Text Node
- LLM Node
- Filter Node
- API Node
- Math Node
- Delay Node
- Note Node

### Dynamic Template Variables
- Supports variables using `{{variable}}` syntax
- Automatic variable detection
- Dynamic handle generation
- Visual mapping between inputs and templates

### DAG Validation
- Backend-powered pipeline analysis
- Detects cyclic dependencies
- Calculates node count
- Calculates edge count
- Validates workflow structure

### Workflow Templates
- Basic Q&A
- Template Completion
- API + Summarize
- Filter & Branch

### Productivity Features
- Command Palette
- Keyboard Shortcuts
- Execution Logs
- Quick Node Search
- Undo / Redo Support

### Modern UI/UX
- Dark theme interface
- Responsive design
- Smooth animations
- Professional dashboard experience
- Interactive landing page

---

## 🏗️ System Architecture

Frontend:
- React
- TypeScript
- React Flow
- Zustand
- Framer Motion
- Tailwind CSS

Backend:
- Python
- FastAPI

Validation:
- Kahn's Algorithm
- Directed Acyclic Graph (DAG) Validation

---

## 🔄 Workflow

1. User drags nodes from the Node Library.
2. Nodes are connected through edges.
3. Workflow is stored in application state.
4. User submits pipeline.
5. Frontend sends nodes and edges to FastAPI backend.
6. Backend constructs graph structure.
7. DAG validation is performed using Kahn's Algorithm.
8. Results are returned to frontend.
9. Validation status is displayed to user.

---

## 📊 DAG Validation Response

Example:

```json
{
  "num_nodes": 4,
  "num_edges": 3,
  "is_dag": true
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|-----------|---------|
| Ctrl + K | Open Command Palette |
| Ctrl + Z | Undo |
| Ctrl + Y | Redo |
| Ctrl + A | Select All |
| Ctrl + C | Copy |
| Ctrl + V | Paste |

---

## 🎯 Use Cases

- AI Workflow Design
- Prompt Engineering Pipelines
- API Orchestration
- Data Processing Flows
- Automation Systems
- Educational Workflow Visualization
- Rapid Prototyping

---

## 🧠 Algorithm Used

### Kahn's Algorithm

Pipeline Architect uses Kahn's Algorithm to validate whether a workflow forms a valid Directed Acyclic Graph (DAG).

Benefits:
- Detects cycles efficiently
- Ensures valid execution order
- Time Complexity: O(V + E)

Where:
- V = Number of Nodes
- E = Number of Edges

---

## 🔮 Future Enhancements

- Real Workflow Execution Engine
- Multi-user Collaboration
- Authentication & Authorization
- Cloud Deployment
- Pipeline Versioning
- Workflow Scheduling
- AI Agent Integration
- Export / Import Pipelines

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

## 👨‍💻 Author

Rajat Nagda

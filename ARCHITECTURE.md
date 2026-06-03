# Architecture Rationale

This document explains the *why* behind the three load-bearing decisions. The *what* is in the README; the *how* is in the code.

---

## 1. Config-Driven Node Abstraction

### The problem

A pipeline builder has N node types. Each needs: a title, a colour, some input fields, left-side handles, right-side handles, and consistent visual styling. The naive implementation is N separate React components. The problems:

- Every visual design change (border radius, header padding, hover state) requires N edits
- Adding a new node type requires copy-pasting the rendering skeleton
- Demonstrating "I can build a good abstraction" is the stated goal of the assessment

### The solution

Separate *what a node is* from *how it renders*:

```
nodeConfigs.js   ← plain data objects (what)
BaseNode.js      ← single React component (how)
inputNode.js     ← (props) => <BaseNode config={inputNodeConfig} />
```

A config is just a JavaScript object. It carries no logic. It has no dependencies. You can `JSON.stringify` most of it. This means:

- Adding a node type is adding a data object — not writing a component
- BaseNode is the only place where rendering logic lives — change it once
- The config is the contract: a reviewer can read `filterNodeConfig` and understand the node completely without reading any component code

### The seam: static vs dynamic handles

90% of nodes have fixed handles (`inputs: [{ id: 'value' }]`). But the Text node must update its input handles as the user types `{{ variable }}`.

The abstraction handles this with a single escape hatch: `computeInputs(data)`. If this function is present, BaseNode calls it with current field data instead of reading the static `inputs` array. The Text node's config defines this function; all other configs omit it. BaseNode doesn't know or care which nodes use it.

This is the design proof: the abstraction is *not too rigid* for dynamic behaviour. The TextNode wrapper is slightly thicker (manages a `minWidth` state for autoresize) but BaseNode is unchanged.

### What "correct" looks like here

The acceptance test is behavioural: after typing `{{ foo }} {{ bar }}` in the Text node textarea, two left handles named `foo` and `bar` appear. Deleting `{{ bar }}` removes its handle. Typing `{{ 123bad }}` produces no handle. This is directly observable without any test harness.

---

## 2. Kahn's Algorithm for DAG Detection

### The contract first

Before choosing an algorithm, the contract was defined:

```
is_dag(nodes: list[Node], edges: list[Edge]) -> bool

Case matrix (all must pass):
  empty pipeline            → True
  single node, no edges     → True
  linear chain A→B→C        → True
  diamond A→B, A→C, B→D, C→D → True
  simple cycle A→B→A        → False
  self-loop A→A              → False
  disconnected (all acyclic) → True
  dangling edge (missing node) → True, no crash
```

The algorithm choice is secondary to having these cases as explicit tests. Any correct algorithm passes all of them.

### Why Kahn's specifically

Three reasons, in priority order:

**1. Iterative, not recursive.**
Python's default recursion limit is 1000 frames. A DFS-based cycle detector on a pipeline with 1000+ nodes would hit `RecursionError`. Kahn's is a BFS — it uses an explicit queue, not the call stack. No limit.

**2. One clean signal.**
Kahn's termination condition is `visited == len(nodes)`. If every node was reachable via zero-in-degree traversal, there are no cycles. If any nodes are stranded (in-degree never reached zero), they're in a cycle. This is one integer comparison, not a three-colour state machine.

**3. Topological order as a side effect.**
The order in which Kahn's visits nodes is a valid topological order — which is exactly the order a pipeline executor would run the nodes. This is a natural follow-up talking point and a building block for any real execution engine.

### Dangling edge decision

Edges that reference a node id not in the node list are silently dropped before the traversal. This is documented in `dag.py` and tested explicitly. The alternative — returning an error — would couple the backend to frontend implementation details (the frontend could legitimately have edges in-flight during a drag operation). Silently ignoring them is the more resilient contract.

---

## 3. Accepting the Raw ReactFlow Shape

### The decision

The `/pipelines/parse` endpoint accepts the raw ReactFlow node/edge objects. It doesn't validate field values, node types, or data payloads. The only required fields are `id` on nodes and `source`/`target` on edges.

### Why

**Resilience over strictness.**
If the backend validated node types against an enum, every time the frontend added a new node type the backend would need a coordinated update. Accepting the raw shape means the frontend can evolve independently. The backend's job is structural analysis (DAG check), not semantic validation.

**The contract is in the response, not the request.**
The mandated output — `{ num_nodes: int, num_edges: int, is_dag: bool }` — is precise. The input is deliberately permissive. This mirrors how real API design works: strict outputs, lenient inputs.

**Pydantic still validates the structure.**
Even though field values aren't validated, Pydantic ensures the JSON is well-formed and has the expected shape. A completely malformed request returns a 422 with a clear error — the frontend distinguishes this from a network error or a 5xx.

### The tradeoff

In a production system you'd want stricter input validation: node types against an enum, field values against schemas, connection validity (output handle type matches input handle type). That's left as a known limitation. For this assessment, the structural/algorithmic correctness is the story; the semantic validation would be noise.

---

## The Store Mutation Bug (fix applied)

The starter code's `updateNodeField` mutated the node object directly:

```js
// before (starter code) — WRONG
nodes: get().nodes.map((node) => {
  if (node.id === nodeId) {
    node.data = { ...node.data, [fieldName]: fieldValue };  // mutates node in place
  }
  return node;
}),
```

This spreads `data` (creating a new object) but assigns it back to the *same* node reference. React's reconciler sees the same object reference for the node and may skip re-rendering. The TextNode's live handle update depends on re-rendering when `data.text` changes — the mutation bug would silently break it.

```js
// after (fixed) — correct
nodes: get().nodes.map((node) =>
  node.id === nodeId
    ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
    : node
),
```

Spreading the node creates a new object reference, guaranteeing React detects the change.

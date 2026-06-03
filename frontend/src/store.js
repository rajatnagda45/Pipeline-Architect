/**
 * store.js — Zustand global state for the pipeline canvas.
 *
 * PERSISTENCE
 *   zustand/middleware `persist` saves { nodes, edges, nodeIDs } to localStorage
 *   under the key 'pipeline-architect-v1'.  Non-serialisable values (rfInstance)
 *   and session-only state (past, future, clipboard, savedLayout) are excluded
 *   via `partialize`.  The pipeline survives page refresh automatically.
 *
 * UNDO / REDO
 *   Every mutation that changes the graph calls `withHistory(state)` as part of
 *   its `set((state) => ...)` call so the snapshot is created atomically with the
 *   change — no separate `_pushHistory` method, no double render.
 *
 *   History is NOT persisted: undo/redo resets on reload (standard behaviour).
 *   Stack depth: MAX_HISTORY = 50 entries.
 *
 *   What is undoable            What is NOT undoable
 *   ─────────────────────────── ────────────────────────────
 *   addNode / deleteNode        updateNodeField (per-keystroke — use
 *   addEdge (onConnect)           browser's native text-field undo instead)
 *   deleteEdge / reconnectEdge  selectAll / deselectAll
 *   duplicateNode / paste       copySelection
 *   drag end (position change)
 *   edge removal
 *   loadTemplate
 *   layoutHorizontal/Vertical
 *   restoreLayout
 *   clearCanvas
 *
 * EDGE COLORS
 *   Each new edge receives the source node's accent color.
 *   Duplicate connections between the same pair cycle through DUPE_COLORS so
 *   parallel edges stay visually distinguishable.
 */

import { create } from 'zustand';
import { persist  } from 'zustand/middleware';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

// ── Graph layout engine ───────────────────────────────────────────────────────

function computeLayout(nodes, edges, direction) {
  if (!nodes.length) return nodes;

  const NODE_W    = 280;
  const NODE_H    = 160;
  const LEVEL_GAP = 100;
  const RANK_GAP  = 40;

  const adj   = {};
  const inDeg = {};
  nodes.forEach((n) => { adj[n.id] = []; inDeg[n.id] = 0; });
  edges.forEach((e) => {
    if (adj[e.source])               adj[e.source].push(e.target);
    if (inDeg[e.target] !== undefined) inDeg[e.target]++;
  });

  const depth = {};
  nodes.forEach((n) => { depth[n.id] = 0; });

  const topo   = [];
  const queue  = nodes.filter((n) => !inDeg[n.id]).map((n) => n.id);
  const queued = new Set(queue);
  topo.push(...queue);

  let qi = 0;
  while (qi < topo.length) {
    const cur = topo[qi++];
    (adj[cur] || []).forEach((nxt) => {
      depth[nxt] = Math.max(depth[nxt] ?? 0, (depth[cur] ?? 0) + 1);
      if (!queued.has(nxt)) { queued.add(nxt); topo.push(nxt); }
    });
  }

  const byDepth = {};
  nodes.forEach((n) => {
    const d = depth[n.id] ?? 0;
    (byDepth[d] = byDepth[d] || []).push(n.id);
  });

  const pos    = {};
  const levels = Object.keys(byDepth).map(Number).sort((a, b) => a - b);

  levels.forEach((d) => {
    const ids      = byDepth[d];
    const perpSize = direction === 'horizontal'
      ? ids.length * NODE_H + (ids.length - 1) * RANK_GAP
      : ids.length * NODE_W + (ids.length - 1) * RANK_GAP;
    const perpStart = -perpSize / 2;

    ids.forEach((id, i) => {
      pos[id] = direction === 'horizontal'
        ? { x: d * (NODE_W + LEVEL_GAP), y: perpStart + i * (NODE_H + RANK_GAP) }
        : { x: perpStart + i * (NODE_W + RANK_GAP), y: d * (NODE_H + LEVEL_GAP) };
    });
  });

  return nodes.map((n) => ({ ...n, position: pos[n.id] ?? n.position }));
}

// ── Edge color helpers ────────────────────────────────────────────────────────

const NODE_COLORS = {
  customInput: '#ff79c6', customOutput: '#ff5555', llm: '#bd93f9',
  text: '#60a5fa', filter: '#50fa7b', math: '#f1fa8c',
  api: '#fb923c', delay: '#22d3ee', note: '#f0abfc',
};
const DUPE_COLORS = ['#ff79c6', '#50fa7b', '#f1fa8c', '#22d3ee', '#fb923c', '#bd93f9'];

function pickEdgeColor(connection, nodes, edges) {
  const src       = nodes.find((n) => n.id === connection.source);
  const baseColor = NODE_COLORS[src?.type] ?? '#bd93f9';
  const existing  = edges.filter(
    (e) => e.source === connection.source && e.target === connection.target
  );
  if (existing.length === 0) return baseColor;
  const pool = DUPE_COLORS.filter((c) => c !== baseColor);
  return pool[(existing.length - 1) % pool.length];
}

// ── History helper ────────────────────────────────────────────────────────────
// Merge into any `set((state) => ...)` call to snapshot the current graph
// and clear the redo stack in one atomic update.

function withHistory(state) {
  return {
    past:   [...state.past.slice(-(MAX_HISTORY - 1)), { nodes: state.nodes, edges: state.edges }],
    future: [],
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Persisted state ──────────────────────────────────────────────────────
      nodes:   [],
      edges:   [],
      nodeIDs: {},  // per-type counters, e.g. { llm: 2, text: 1 }

      // ── Session-only state (not persisted) ───────────────────────────────────
      rfInstance:  null,
      clipboard:   null,
      savedLayout: null,
      past:        [],   // undo stack
      future:      [],   // redo stack

      // ── Undo / Redo ───────────────────────────────────────────────────────────

      undo: () => set((state) => {
        if (!state.past.length) return {};
        const prev = state.past[state.past.length - 1];
        return {
          nodes:  prev.nodes,
          edges:  prev.edges,
          past:   state.past.slice(0, -1),
          future: [{ nodes: state.nodes, edges: state.edges }, ...state.future].slice(0, MAX_HISTORY),
        };
      }),

      redo: () => set((state) => {
        if (!state.future.length) return {};
        const [next, ...remaining] = state.future;
        return {
          nodes:  next.nodes,
          edges:  next.edges,
          past:   [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-MAX_HISTORY),
          future: remaining,
        };
      }),

      // ── Selection helpers ─────────────────────────────────────────────────────

      selectAll: () =>
        set((s) => ({ nodes: s.nodes.map((n) => ({ ...n, selected: true })) })),

      deselectAll: () =>
        set((s) => ({ nodes: s.nodes.map((n) => ({ ...n, selected: false })) })),

      // ── Node ID generation ────────────────────────────────────────────────────

      getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        if (newIDs[type] === undefined) newIDs[type] = 0;
        newIDs[type] += 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
      },

      // ── Canvas mutations (all undoable) ───────────────────────────────────────

      addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node],
        ...withHistory(state),
      })),

      clearCanvas: () => set((state) => ({
        nodes: [],
        edges: [],
        ...withHistory(state),
      })),

      setRFInstance: (instance) => set({ rfInstance: instance }),

      loadTemplate: (nodes, edges) => set((state) => ({
        nodes, edges, nodeIDs: {},
        ...withHistory(state),
      })),

      deleteNode: (nodeId) => set((state) => ({
        nodes: state.nodes.filter((n) => n.id !== nodeId),
        edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
        ...withHistory(state),
      })),

      deleteEdge: (edgeId) => set((state) => ({
        edges: state.edges.filter((e) => e.id !== edgeId),
        ...withHistory(state),
      })),

      reconnectEdge: (oldEdge, newConnection) => set((state) => ({
        edges: state.edges.map((e) =>
          e.id === oldEdge.id
            ? {
                ...e,
                source:       newConnection.source,
                target:       newConnection.target,
                sourceHandle: newConnection.sourceHandle,
                targetHandle: newConnection.targetHandle,
                style: {
                  ...e.style,
                  stroke: pickEdgeColor(
                    newConnection, state.nodes,
                    state.edges.filter((x) => x.id !== oldEdge.id)
                  ),
                },
              }
            : e
        ),
        ...withHistory(state),
      })),

      duplicateNode: (nodeId) => set((state) => {
        const source = state.nodes.find((n) => n.id === nodeId);
        if (!source) return {};
        const newID = `${source.type}-${Date.now()}`;
        return {
          nodes: [
            ...state.nodes,
            {
              ...source,
              id:       newID,
              position: { x: source.position.x + 30, y: source.position.y + 30 },
              data:     { ...source.data, id: newID },
              selected: false,
            },
          ],
          ...withHistory(state),
        };
      }),

      // ── Copy / Paste ──────────────────────────────────────────────────────────
      // copySelection does NOT push history (reading state is not a mutation).

      copySelection: () => {
        const { nodes, edges } = get();
        const selected = nodes.filter((n) => n.selected);
        if (!selected.length) return;
        const ids = new Set(selected.map((n) => n.id));
        set({ clipboard: { nodes: selected, edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)) } });
      },

      pasteSelection: () => set((state) => {
        if (!state.clipboard?.nodes?.length) return {};
        const OFFSET = 40;
        const idMap  = {};
        const stamp  = Date.now();
        const newNodes = state.clipboard.nodes.map((n, i) => {
          const newId = `${n.type}-paste-${stamp}-${i}`;
          idMap[n.id] = newId;
          return { ...n, id: newId, position: { x: n.position.x + OFFSET, y: n.position.y + OFFSET }, selected: true, data: { ...n.data, id: newId } };
        });
        const newEdges = state.clipboard.edges.map((e, i) => ({
          ...e, id: `e-paste-${stamp}-${i}`,
          source: idMap[e.source] ?? e.source,
          target: idMap[e.target] ?? e.target,
        }));
        return {
          nodes: [...state.nodes.map((n) => ({ ...n, selected: false })), ...newNodes],
          edges: [...state.edges, ...newEdges],
          ...withHistory(state),
        };
      }),

      // ── ReactFlow change handlers ─────────────────────────────────────────────
      // onNodesChange: record history only when a drag *ends* or nodes are removed.
      // Mid-drag position events (dragging: true) and selection-only events are
      // not recorded — they fire too frequently and selection isn't undoable.

      onNodesChange: (changes) => set((state) => {
        const shouldRecord = changes.some(
          (c) => (c.type === 'position' && c.dragging === false) || c.type === 'remove'
        );
        const newNodes = applyNodeChanges(changes, state.nodes);
        return shouldRecord
          ? { nodes: newNodes, ...withHistory(state) }
          : { nodes: newNodes };
      }),

      onEdgesChange: (changes) => set((state) => {
        const shouldRecord = changes.some((c) => c.type === 'remove');
        const newEdges = applyEdgeChanges(changes, state.edges);
        return shouldRecord
          ? { edges: newEdges, ...withHistory(state) }
          : { edges: newEdges };
      }),

      onConnect: (connection) => set((state) => ({
        edges: addEdge(
          {
            ...connection,
            type:      'smoothstep',
            animated:  true,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style:     { stroke: pickEdgeColor(connection, state.nodes, state.edges), strokeWidth: 1.5 },
          },
          state.edges
        ),
        ...withHistory(state),
      })),

      // ── Auto-layout ───────────────────────────────────────────────────────────

      layoutHorizontal: () => {
        const rfInstance = get().rfInstance;
        set((state) => {
          const snapshot = Object.fromEntries(state.nodes.map((n) => [n.id, { ...n.position }]));
          return { nodes: computeLayout(state.nodes, state.edges, 'horizontal'), savedLayout: snapshot, ...withHistory(state) };
        });
        setTimeout(() => rfInstance?.fitView({ duration: 400, padding: 0.12 }), 60);
      },

      layoutVertical: () => {
        const rfInstance = get().rfInstance;
        set((state) => {
          const snapshot = Object.fromEntries(state.nodes.map((n) => [n.id, { ...n.position }]));
          return { nodes: computeLayout(state.nodes, state.edges, 'vertical'), savedLayout: snapshot, ...withHistory(state) };
        });
        setTimeout(() => rfInstance?.fitView({ duration: 400, padding: 0.12 }), 60);
      },

      restoreLayout: () => {
        const rfInstance = get().rfInstance;
        set((state) => {
          if (!state.savedLayout) return {};
          return {
            nodes: state.nodes.map((n) => ({ ...n, position: state.savedLayout[n.id] ?? n.position })),
            savedLayout: null,
            ...withHistory(state),
          };
        });
        setTimeout(() => rfInstance?.fitView({ duration: 400, padding: 0.12 }), 60);
      },

      // updateNodeField is NOT pushed to history — it fires on every keystroke.
      // The browser's native text-field Ctrl+Z handles in-field undo instead.
      updateNodeField: (nodeId, fieldName, fieldValue) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
              : node
          ),
        })),
    }),

    // ── Persist config ─────────────────────────────────────────────────────────
    {
      name: 'pipeline-architect-v1',
      // Only serialise the graph data — skip rfInstance (non-serialisable),
      // past/future (session-only history), clipboard, savedLayout.
      partialize: (state) => ({
        nodes:   state.nodes,
        edges:   state.edges,
        nodeIDs: state.nodeIDs,
      }),
    }
  )
);

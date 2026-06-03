/**
 * store.test.js — Unit tests for the Zustand pipeline store.
 *
 * Strategy:
 *   - Import useStore and call store actions directly (no React component needed).
 *   - Reset store state before each test via the internal set API.
 *   - localStorage is auto-mocked by Jest's jsdom environment.
 */

import { act } from 'react-dom/test-utils';
import { useStore } from '../store';

// Helper: get current state snapshot
const getState = () => useStore.getState();

// Reset store to a clean slate before every test
beforeEach(() => {
  act(() => {
    useStore.setState({
      nodes: [],
      edges: [],
      nodeIDs: {},
      past: [],
      future: [],
      clipboard: null,
      savedLayout: null,
      rfInstance: null,
    });
  });
});

// ── getNodeID ─────────────────────────────────────────────────────────────────
describe('getNodeID', () => {
  it('generates sequential IDs for the same type', () => {
    const id1 = getState().getNodeID('llm');
    const id2 = getState().getNodeID('llm');
    expect(id1).toBe('llm-1');
    expect(id2).toBe('llm-2');
  });

  it('maintains independent counters per type', () => {
    const a = getState().getNodeID('text');
    const b = getState().getNodeID('api');
    expect(a).toBe('text-1');
    expect(b).toBe('api-1');
  });
});

// ── addNode ───────────────────────────────────────────────────────────────────
describe('addNode', () => {
  it('appends a node to the nodes array', () => {
    const node = { id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: {} };
    act(() => getState().addNode(node));
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('text-1');
  });

  it('pushes a history entry', () => {
    const node = { id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: {} };
    act(() => getState().addNode(node));
    expect(getState().past).toHaveLength(1);
  });

  it('clears the redo stack', () => {
    // Put something in future first
    useStore.setState({ future: [{ nodes: [], edges: [] }] });
    act(() => getState().addNode({ id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: {} }));
    expect(getState().future).toHaveLength(0);
  });
});

// ── deleteNode ────────────────────────────────────────────────────────────────
describe('deleteNode', () => {
  it('removes the node and its connected edges', () => {
    useStore.setState({
      nodes: [
        { id: 'a', type: 'text', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'text', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'a' },
      ],
    });
    act(() => getState().deleteNode('a'));
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('b');
    expect(getState().edges).toHaveLength(0);
  });

  it('is a no-op for a non-existent nodeId', () => {
    useStore.setState({ nodes: [{ id: 'x', type: 'text', position: { x: 0, y: 0 }, data: {} }] });
    act(() => getState().deleteNode('does-not-exist'));
    expect(getState().nodes).toHaveLength(1);
  });
});

// ── clearCanvas ───────────────────────────────────────────────────────────────
describe('clearCanvas', () => {
  it('empties nodes and edges', () => {
    useStore.setState({
      nodes: [{ id: 'a', type: 'text', position: { x: 0, y: 0 }, data: {} }],
      edges: [{ id: 'e', source: 'a', target: 'b' }],
    });
    act(() => getState().clearCanvas());
    expect(getState().nodes).toEqual([]);
    expect(getState().edges).toEqual([]);
  });

  it('pushes to history', () => {
    useStore.setState({ nodes: [{ id: 'a', type: 'text', position: { x: 0, y: 0 }, data: {} }] });
    act(() => getState().clearCanvas());
    expect(getState().past.length).toBeGreaterThan(0);
  });
});

// ── updateNodeField ────────────────────────────────────────────────────────────
describe('updateNodeField', () => {
  it('updates the correct field on the correct node', () => {
    useStore.setState({
      nodes: [
        { id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: { text: 'old' } },
        { id: 'n2', type: 'text', position: { x: 0, y: 0 }, data: { text: 'other' } },
      ],
    });
    act(() => getState().updateNodeField('n1', 'text', 'new value'));
    const [n1, n2] = getState().nodes;
    expect(n1.data.text).toBe('new value');
    expect(n2.data.text).toBe('other');
  });

  it('does NOT push to history (called on every keystroke)', () => {
    useStore.setState({
      nodes: [{ id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: { text: '' } }],
      past: [],
    });
    act(() => getState().updateNodeField('n1', 'text', 'a'));
    expect(getState().past).toHaveLength(0);
  });
});

// ── undo / redo ───────────────────────────────────────────────────────────────
describe('undo / redo', () => {
  it('restores the previous state after addNode', () => {
    act(() => getState().addNode({ id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: {} }));
    expect(getState().nodes).toHaveLength(1);
    act(() => getState().undo());
    expect(getState().nodes).toHaveLength(0);
  });

  it('redo re-applies the undone change', () => {
    act(() => getState().addNode({ id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: {} }));
    act(() => getState().undo());
    act(() => getState().redo());
    expect(getState().nodes).toHaveLength(1);
  });

  it('undo on empty past is a no-op', () => {
    expect(() => act(() => getState().undo())).not.toThrow();
    expect(getState().nodes).toEqual([]);
  });

  it('redo on empty future is a no-op', () => {
    expect(() => act(() => getState().redo())).not.toThrow();
  });

  it('new mutation clears the redo stack', () => {
    act(() => getState().addNode({ id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: {} }));
    act(() => getState().undo());
    expect(getState().future).toHaveLength(1);
    act(() => getState().addNode({ id: 'n2', type: 'api', position: { x: 0, y: 0 }, data: {} }));
    expect(getState().future).toHaveLength(0);
  });
});

// ── selectAll / deselectAll ───────────────────────────────────────────────────
describe('selectAll / deselectAll', () => {
  beforeEach(() => {
    useStore.setState({
      nodes: [
        { id: 'a', type: 'text', position: { x: 0, y: 0 }, data: {}, selected: false },
        { id: 'b', type: 'text', position: { x: 0, y: 0 }, data: {}, selected: false },
      ],
    });
  });

  it('selectAll marks every node as selected', () => {
    act(() => getState().selectAll());
    getState().nodes.forEach((n) => expect(n.selected).toBe(true));
  });

  it('deselectAll clears selection', () => {
    act(() => getState().selectAll());
    act(() => getState().deselectAll());
    getState().nodes.forEach((n) => expect(n.selected).toBe(false));
  });
});

// ── duplicateNode ─────────────────────────────────────────────────────────────
describe('duplicateNode', () => {
  it('adds a new node with a different id and offset position', () => {
    useStore.setState({
      nodes: [{ id: 'text-1', type: 'text', position: { x: 100, y: 100 }, data: { text: 'hello' } }],
    });
    act(() => getState().duplicateNode('text-1'));
    const nodes = getState().nodes;
    expect(nodes).toHaveLength(2);
    const clone = nodes[1];
    expect(clone.id).not.toBe('text-1');
    expect(clone.position.x).toBe(130);
    expect(clone.position.y).toBe(130);
  });

  it('is a no-op for unknown nodeId', () => {
    useStore.setState({ nodes: [] });
    act(() => getState().duplicateNode('ghost'));
    expect(getState().nodes).toHaveLength(0);
  });
});

// ── copySelection / pasteSelection ───────────────────────────────────────────
describe('copy / paste', () => {
  it('copySelection stores selected nodes in clipboard', () => {
    useStore.setState({
      nodes: [
        { id: 'a', type: 'text', position: { x: 0, y: 0 }, data: {}, selected: true },
        { id: 'b', type: 'api',  position: { x: 0, y: 0 }, data: {}, selected: false },
      ],
      edges: [],
    });
    act(() => getState().copySelection());
    expect(getState().clipboard.nodes).toHaveLength(1);
    expect(getState().clipboard.nodes[0].id).toBe('a');
  });

  it('pasteSelection creates new nodes offset from originals', () => {
    useStore.setState({
      nodes: [{ id: 'a', type: 'text', position: { x: 10, y: 20 }, data: {}, selected: true }],
      edges: [],
    });
    act(() => getState().copySelection());
    act(() => getState().pasteSelection());
    const nodes = getState().nodes;
    expect(nodes).toHaveLength(2);
    const pasted = nodes[1];
    expect(pasted.position.x).toBe(50);  // 10 + 40
    expect(pasted.position.y).toBe(60);  // 20 + 40
  });

  it('pasteSelection on empty clipboard is a no-op', () => {
    useStore.setState({ clipboard: null });
    act(() => getState().pasteSelection());
    expect(getState().nodes).toHaveLength(0);
  });
});

// ── loadTemplate ──────────────────────────────────────────────────────────────
describe('loadTemplate', () => {
  it('replaces nodes, edges, and resets nodeIDs', () => {
    useStore.setState({ nodes: [{ id: 'old' }], nodeIDs: { llm: 5 } });
    const newNodes = [{ id: 'n1', type: 'text', position: { x: 0, y: 0 }, data: {} }];
    const newEdges = [];
    act(() => getState().loadTemplate(newNodes, newEdges));
    expect(getState().nodes).toHaveLength(1);
    expect(getState().nodes[0].id).toBe('n1');
    expect(getState().nodeIDs).toEqual({});
  });
});

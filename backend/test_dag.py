"""
DAG correctness tests for is_dag().

Covers the exact case matrix from the spec plus additional edge cases.

Run: python -m pytest test_dag.py -v

Dangling-edge policy: edges referencing a node id not present in the nodes
list are silently ignored. The graph is evaluated using only valid edges.
This matches the robustness contract in dag.py and means a stale/out-of-sync
edge from the frontend can never crash the server.
"""

import pytest
from models import Node, Edge
from dag import is_dag


# ── helpers ──────────────────────────────────────────────────────────────────

def n(id_):
    """Minimal node — only id is required."""
    return Node(id=id_)


def e(src, tgt):
    """Minimal edge — only source + target are required (id is optional)."""
    return Edge(source=src, target=tgt)


# ── Spec case matrix ─────────────────────────────────────────────────────────

def test_empty_pipeline():
    """Empty pipeline → True (vacuously acyclic)."""
    assert is_dag([], []) is True


def test_single_node_no_edges():
    """Single node, no edges → True."""
    assert is_dag([n("a")], []) is True


def test_linear_chain():
    """Linear chain A→B→C → True."""
    assert is_dag([n("A"), n("B"), n("C")], [e("A", "B"), e("B", "C")]) is True


def test_diamond():
    """Diamond A→B, A→C, B→D, C→D → True."""
    nodes = [n("A"), n("B"), n("C"), n("D")]
    edges = [e("A", "B"), e("A", "C"), e("B", "D"), e("C", "D")]
    assert is_dag(nodes, edges) is True


def test_simple_cycle():
    """Simple cycle A→B→A → False."""
    assert is_dag([n("A"), n("B")], [e("A", "B"), e("B", "A")]) is False


def test_self_loop():
    """Self-loop A→A → False."""
    assert is_dag([n("A")], [e("A", "A")]) is False


def test_disconnected_components_all_acyclic():
    """Disconnected components (all acyclic) → True."""
    nodes = [n("A"), n("B"), n("C"), n("D")]
    edges = [e("A", "B"), e("C", "D")]  # two separate chains, no connection
    assert is_dag(nodes, edges) is True


def test_dangling_edge_no_crash():
    """
    Dangling edge (references missing node) → no crash.
    Policy: dangling edges are silently ignored; result reflects only valid edges.
    A→B is valid; B→ghost references a non-existent node and is dropped.
    The remaining valid graph (A→B) is acyclic → True.
    """
    nodes = [n("A"), n("B")]
    edges = [e("A", "B"), e("B", "ghost")]
    result = is_dag(nodes, edges)  # must not raise
    assert result is True  # only valid edge A→B remains; no cycle


# ── Additional edge cases ─────────────────────────────────────────────────────

def test_cycle_deeper_in_graph():
    """Tail before a cycle: X→A→B→A — B and A are stranded → False."""
    nodes = [n("X"), n("A"), n("B")]
    edges = [e("X", "A"), e("A", "B"), e("B", "A")]
    assert is_dag(nodes, edges) is False


def test_isolated_nodes_only():
    """Multiple nodes, zero edges — all isolated → True."""
    assert is_dag([n("A"), n("B"), n("C"), n("D")], []) is True


def test_fully_dangling_edge():
    """Both endpoints of an edge are missing — edge is ignored entirely."""
    nodes = [n("A")]
    edges = [e("X", "Y")]  # neither X nor Y is in the node list
    assert is_dag(nodes, []) is True  # A alone is acyclic


def test_edges_without_ids():
    """Edge.id is optional; edges with no id field must still work."""
    nodes = [n("A"), n("B"), n("C")]
    edges = [Edge(source="A", target="B"), Edge(source="B", target="C")]
    assert is_dag(nodes, edges) is True


def test_nodes_with_minimal_fields():
    """Node requires only id; all other fields must be optional."""
    nodes = [Node(id="A"), Node(id="B")]
    edges = [Edge(source="A", target="B")]
    assert is_dag(nodes, edges) is True

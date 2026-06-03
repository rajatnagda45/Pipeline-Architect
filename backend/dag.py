"""
DAG detection via Kahn's topological sort (iterative, O(V+E)).

Why Kahn's over DFS-coloring:
- No recursion depth risk on long pipeline chains
- Single clean signal: visited == node_count means no cycles
- Topological order produced is the natural pipeline execution order
"""

from typing import List
from models import Node, Edge


def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    if not nodes:
        return True

    node_ids = {node.id for node in nodes}

    # Build adjacency list and in-degree count, ignoring dangling edge refs
    adj: dict[str, list[str]] = {nid: [] for nid in node_ids}
    in_degree: dict[str, int] = {nid: 0 for nid in node_ids}

    for edge in edges:
        src, tgt = edge.source, edge.target
        if src in node_ids and tgt in node_ids:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    queue = [nid for nid, deg in in_degree.items() if deg == 0]
    visited = 0

    while queue:
        node = queue.pop(0)
        visited += 1
        for neighbor in adj[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # If every node was visited, no cycle exists
    return visited == len(nodes)

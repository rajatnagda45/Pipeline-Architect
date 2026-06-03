from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class Node(BaseModel):
    id: str
    type: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    data: Optional[Dict[str, Any]] = None


class Edge(BaseModel):
    # id is optional: the spec only requires source + target on edges
    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class PipelineRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

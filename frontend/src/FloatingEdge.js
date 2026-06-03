/**
 * FloatingEdge.js — Direction-agnostic edge that auto-routes to the closest
 * border point of each node, regardless of whether nodes are arranged
 * horizontally, vertically, or in a tree/graph layout.
 *
 * How it works:
 *   1. Find the center of both the source and target nodes.
 *   2. Trace a line between the two centers.
 *   3. Find where that line intersects each node's bounding rectangle
 *      (the "exit/entry" point on the node's actual border).
 *   4. Determine which side of the rectangle was hit (Top/Right/Bottom/Left).
 *   5. Feed those points + positions into getBezierPath for a smooth curve.
 *
 * Result: edges naturally flow left→right, top→bottom, diagonally — whatever
 * matches the physical layout of nodes on the canvas without any manual config.
 */

import { useCallback } from 'react';
import {
  useStore as useRFStore,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  Position,
  MarkerType,
} from 'reactflow';
import { useStore } from './store';
import { colors } from './styles/theme';

// ── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * Intersection of line (cx,cy)→(tx,ty) with axis-aligned rectangle centered
 * at (cx,cy) with half-dimensions (w,h).
 * Returns the point on the rectangle's border that the line exits through.
 */
function getNodeIntersection(node, targetNode) {
  const { positionAbsolute: pos, width = 240, height = 100 } = node;
  const targetPos = targetNode.positionAbsolute;

  const w = width  / 2;
  const h = height / 2;
  const cx = pos.x + w;
  const cy = pos.y + h;
  const tx = targetPos.x + (targetNode.width  ?? 240) / 2;
  const ty = targetPos.y + (targetNode.height ?? 100) / 2;

  // Normalised direction components in the "diamond" coordinate system
  const dx = (tx - cx) / (2 * w);
  const dy = (ty - cy) / (2 * h);
  const scale = 1 / (Math.abs(dx) + Math.abs(dy) || 1);

  return {
    x: cx + w * scale * (dx + dy),
    y: cy + h * scale * (dy - dx),
  };
}

/**
 * Which side of node did the intersection point land on?
 * Returns a ReactFlow Position enum value.
 */
function getEdgePosition(node, intersect) {
  const { positionAbsolute: pos, width = 240, height = 100 } = node;
  const n = { x: Math.round(intersect.x), y: Math.round(intersect.y) };
  const nx = Math.round(pos.x);
  const ny = Math.round(pos.y);
  const px = Math.round(pos.x + width);
  const py = Math.round(pos.y + height);

  if (n.x <= nx + 1) return Position.Left;
  if (n.x >= px - 1) return Position.Right;
  if (n.y <= ny + 1) return Position.Top;
  if (n.y >= py - 1) return Position.Bottom;
  return Position.Top;
}

/** Compute the floating edge parameters for a given source→target pair. */
function getEdgeParams(sourceNode, targetNode) {
  const sx = getNodeIntersection(sourceNode, targetNode);
  const tx = getNodeIntersection(targetNode, sourceNode);
  return {
    sx: sx.x, sy: sx.y,
    tx: tx.x, ty: tx.y,
    sourcePos: getEdgePosition(sourceNode, sx),
    targetPos: getEdgePosition(targetNode, tx),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const FloatingEdge = ({
  id,
  source,
  target,
  markerEnd,
  style,
  selected,
  data,
}) => {
  const deleteEdge = useStore((s) => s.deleteEdge);

  // Read live node positions from ReactFlow's internal store
  const sourceNode = useRFStore(useCallback(
    (s) => s.nodeInternals.get(source), [source]
  ));
  const targetNode = useRFStore(useCallback(
    (s) => s.nodeInternals.get(target), [target]
  ));

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx, sourceY: sy, sourcePosition: sourcePos,
    targetX: tx, targetY: ty, targetPosition: targetPos,
  });

  const strokeColor = selected ? colors.primary : (style?.stroke ?? colors.llm);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 2.25 : 1.5,
          filter: selected
            ? `drop-shadow(0 0 6px ${colors.primary}88)`
            : undefined,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
      />

      {/* Delete button — visible only when edge is selected */}
      {selected && (
        <EdgeLabelRenderer>
          <button
            onClick={() => deleteEdge(id)}
            title="Delete edge"
            style={{
              position:   'absolute',
              transform:  `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              width:      '20px',
              height:     '20px',
              borderRadius: '50%',
              background: colors.surfaceHigh,
              border:     `1px solid ${colors.danger}`,
              color:      colors.danger,
              fontSize:   '11px',
              fontWeight: 700,
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor:     'pointer',
              lineHeight: 1,
              transition: 'background 0.12s',
              zIndex:     10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${colors.danger}22`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.surfaceHigh)}
            className="nodrag nopan"
          >
            ✕
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

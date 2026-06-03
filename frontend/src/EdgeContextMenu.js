/**
 * EdgeContextMenu.js — Right-click context menu for edges.
 *
 * Triggered by onEdgeContextMenu in ui.js.
 * Options:
 *   • Delete Edge — removes the connection immediately
 *   • Info row   — shows source → target for quick debugging
 *
 * Tip shown: "Drag either endpoint to reconnect" — this surfaces the
 * ReactFlow onReconnect feature which lets users fix wrong connections
 * by dragging an edge's source or target handle to a new node.
 */

import { useEffect } from 'react';
import { useStore } from './store';
import { colors, typography, radii } from './styles/theme';

export const EdgeContextMenu = ({ x, y, edge, onClose }) => {
  const deleteEdge = useStore((s) => s.deleteEdge);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const left = Math.min(x, window.innerWidth  - 210);
  const top  = Math.min(y, window.innerHeight - 140);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 499 }} />

      <div style={{
        position: 'fixed',
        left, top,
        zIndex: 500,
        width: '200px',
        background: colors.surfaceContainer,
        border: `1px solid ${colors.outlineStrong}`,
        borderRadius: radii.sm,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'fade-in 0.08s ease',
      }}>
        {/* Header with edge info */}
        <div style={{
          padding: '6px 12px 5px',
          borderBottom: `1px solid ${colors.outlineSubtle}`,
        }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            EDGE · {edge.id?.slice(0, 12)?.toUpperCase()}
          </span>
        </div>

        {/* Source → Target info */}
        <div style={{
          padding: '7px 12px',
          borderBottom: `1px solid ${colors.outlineSubtle}`,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ ...typography.code, color: colors.textMuted, fontSize: '10px' }}>
            {edge.source?.slice(0, 10)}
          </span>
          <span style={{ color: colors.primary, fontSize: '10px' }}>→</span>
          <span style={{ ...typography.code, color: colors.textMuted, fontSize: '10px' }}>
            {edge.target?.slice(0, 10)}
          </span>
        </div>

        {/* Reconnect tip */}
        <div style={{
          padding: '6px 12px',
          borderBottom: `1px solid ${colors.outlineSubtle}`,
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ color: colors.textDim, fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>
            info
          </span>
          <span style={{ ...typography.body, color: colors.textDim, fontSize: '10px', lineHeight: 1.4 }}>
            Drag either endpoint to reconnect to a different node
          </span>
        </div>

        {/* Delete */}
        <button
          onClick={() => { deleteEdge(edge.id); onClose(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '9px 12px',
            background: 'transparent', border: 'none',
            color: colors.danger, cursor: 'pointer',
            textAlign: 'left',
            ...typography.body, fontSize: '12px',
            transition: 'background 0.08s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = `${colors.danger}14`)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: colors.danger }}>
            link_off
          </span>
          Delete Edge
        </button>
      </div>
    </>
  );
};

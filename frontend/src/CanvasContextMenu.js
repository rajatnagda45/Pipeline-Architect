/**
 * CanvasContextMenu.js — Right-click context menu for the empty canvas.
 *
 * Triggered by onPaneContextMenu in ui.js. Shows:
 *   • Quick-add node at cursor position (all 9 types)
 *   • Separator
 *   • Fit View
 *   • Select All
 *   • Clear Canvas
 *
 * This is distinct from ContextMenu.js (which is node-specific).
 * Placing nodes via right-click is more ergonomic than dragging from
 * the sidebar when the user already knows what they want to add.
 */

import { useEffect, useCallback } from 'react';
import { useStore } from './store';
import { colors, typography, radii } from './styles/theme';
import { shallow } from 'zustand/shallow';
import { nodeColorMap } from './nodes/nodeConfigs';

const NODE_TYPES = [
  { type: 'customInput',  label: 'Input',  icon: 'login',        color: nodeColorMap.customInput  },
  { type: 'llm',          label: 'LLM',    icon: 'psychology',   color: nodeColorMap.llm          },
  { type: 'text',         label: 'Text',   icon: 'description',  color: nodeColorMap.text         },
  { type: 'customOutput', label: 'Output', icon: 'logout',       color: nodeColorMap.customOutput },
  { type: 'filter',       label: 'Filter', icon: 'filter_alt',   color: nodeColorMap.filter       },
  { type: 'math',         label: 'Math',   icon: 'calculate',    color: nodeColorMap.math         },
  { type: 'api',          label: 'API',    icon: 'api',          color: nodeColorMap.api          },
  { type: 'delay',        label: 'Delay',  icon: 'timer',        color: nodeColorMap.delay        },
  { type: 'note',         label: 'Note',   icon: 'sticky_note_2',color: nodeColorMap.note         },
];

export const CanvasContextMenu = ({
  x, y,           // screen coordinates of right-click
  canvasX, canvasY, // canvas-space coordinates (projected)
  rfInstance,
  onClose,
}) => {
  const { getNodeID, addNode, onNodesChange, layoutHorizontal, layoutVertical, restoreLayout, savedLayout } =
    useStore(
      (s) => ({
        getNodeID:       s.getNodeID,
        addNode:         s.addNode,
        onNodesChange:   s.onNodesChange,
        layoutHorizontal:s.layoutHorizontal,
        layoutVertical:  s.layoutVertical,
        restoreLayout:   s.restoreLayout,
        savedLayout:     s.savedLayout,
      }),
      shallow
    );

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addNodeAt = useCallback((type) => {
    const nodeID = getNodeID(type);
    const position = rfInstance
      ? rfInstance.project({ x: canvasX, y: canvasY })
      : { x: canvasX, y: canvasY };
    addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type } });
    onClose();
  }, [getNodeID, addNode, rfInstance, canvasX, canvasY, onClose]);

  const fitView = useCallback(() => {
    rfInstance?.fitView({ duration: 300 });
    onClose();
  }, [rfInstance, onClose]);

  const selectAll = useCallback(() => {
    onNodesChange(
      useStore.getState().nodes.map((n) => ({ id: n.id, type: 'select', selected: true }))
    );
    onClose();
  }, [onNodesChange, onClose]);

  const clearCanvas = useCallback(() => {
    useStore.getState().clearCanvas();
    onClose();
  }, [onClose]);

  // Clamp to viewport so menu never clips outside the window
  const menuW = 210;
  const menuH = 560;
  const left = Math.min(x, window.innerWidth  - menuW - 8);
  const top  = Math.min(y, window.innerHeight - menuH - 8);

  return (
    <>
      {/* Invisible backdrop to catch clicks outside */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 499 }} />

      <div
        style={{
          position: 'fixed',
          left, top,
          zIndex: 500,
          width: `${menuW}px`,
          background: colors.surfaceContainer,
          border: `1px solid ${colors.outlineStrong}`,
          borderRadius: radii.sm,
          boxShadow: '0 8px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          animation: 'fade-in 0.08s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '5px 12px 4px',
          borderBottom: `1px solid ${colors.outlineSubtle}`,
        }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            CANVAS · ADD NODE
          </span>
        </div>

        {/* Node types */}
        {NODE_TYPES.map(({ type, label, icon, color }) => (
          <MenuItem
            key={type}
            icon={icon}
            label={label}
            color={color}
            onClick={() => addNodeAt(type)}
          />
        ))}

        {/* Separator */}
        <div style={{ height: '1px', background: colors.outlineSubtle, margin: '3px 0' }} />

        {/* Auto-arrange section */}
        <div style={{ padding: '5px 12px 3px' }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            AUTO-ARRANGE
          </span>
        </div>
        <MenuItem
          icon="view_column"
          label="Horizontal"
          color={colors.textMuted}
          hoverBg={`${colors.primary}12`}
          onClick={() => { layoutHorizontal(); onClose(); }}
        />
        <MenuItem
          icon="table_rows"
          label="Vertical"
          color={colors.textMuted}
          hoverBg={`${colors.primary}12`}
          onClick={() => { layoutVertical(); onClose(); }}
        />
        <MenuItem
          icon="history"
          label="Restore Layout"
          color={savedLayout ? colors.textMuted : colors.textDim}
          hoverBg={savedLayout ? `${colors.primary}12` : undefined}
          disabled={!savedLayout}
          onClick={() => { if (savedLayout) { restoreLayout(); onClose(); } }}
        />

        {/* Separator */}
        <div style={{ height: '1px', background: colors.outlineSubtle, margin: '3px 0' }} />

        {/* Canvas actions */}
        <MenuItem
          icon="fit_screen"
          label="Fit View"
          color={colors.textMuted}
          hoverBg={`${colors.primary}12`}
          onClick={fitView}
        />
        <MenuItem
          icon="select_all"
          label="Select All"
          color={colors.textMuted}
          hoverBg={`${colors.primary}12`}
          onClick={selectAll}
        />
        <div style={{ height: '1px', background: colors.outlineSubtle, margin: '3px 0' }} />
        <MenuItem
          icon="delete_sweep"
          label="Clear Canvas"
          color={colors.danger}
          hoverBg={`${colors.danger}14`}
          onClick={clearCanvas}
        />
      </div>
    </>
  );
};

const MenuItem = ({ icon, label, color, hoverBg, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '7px 12px',
      background: 'transparent', border: 'none',
      color, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
      opacity: disabled ? 0.4 : 1,
      ...typography.body, fontSize: '12px',
      transition: 'background 0.08s',
    }}
    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = hoverBg || `${color}18`; }}
    onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = 'transparent'; }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '14px', color, opacity: 0.9, flexShrink: 0 }}>
      {icon}
    </span>
    {label}
  </button>
);

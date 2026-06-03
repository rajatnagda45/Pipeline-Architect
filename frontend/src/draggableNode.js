/**
 * draggableNode.js — Sidebar chip (drag source).
 *
 * Renders a Material Symbol icon + uppercase label. Hover swaps the border
 * to the node's accent color and glows the icon.
 *
 * Drag protocol:
 *   dataTransfer key: 'application/reactflow'
 *   payload: JSON.stringify({ nodeType }) — decoded in ui.js onDrop
 */

import { useState } from 'react';
import { colors, typography, radii, transitions } from './styles/theme';
import { useTheme } from './ThemeContext';

export const DraggableNode = ({ type, label, icon, color = colors.primary }) => {
  useTheme();
  const [hovered, setHovered] = useState(false);

  const onDragStart = (event) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType: type })
    );
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.style.opacity = '0.55';
  };

  const onDragEnd = (event) => {
    event.currentTarget.style.opacity = '1';
  };

  return (
    <div
      className={type}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '10px',
        padding:        '9px 11px',
        background:     hovered ? colors.surfaceHigh : colors.surfaceContainer,
        border:         `1px solid ${hovered ? color : colors.outline}`,
        borderRadius:   radii.sm,
        cursor:         'grab',
        userSelect:     'none',
        transition:     transitions.border,
        position:       'relative',
        overflow:       'hidden',
      }}
    >
      {/* Accent dot + icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <span
          style={{
            width:        '5px',
            height:       '5px',
            borderRadius: '50%',
            background:   color,
            boxShadow:    hovered ? `0 0 8px ${color}` : 'none',
            flexShrink:   0,
            transition:   transitions.fast,
          }}
        />
        <span
          className="material-symbols-outlined"
          style={{
            fontSize:   '15px',
            color:      hovered ? color : colors.textMuted,
            lineHeight: 1,
            transition: transitions.fast,
            filter:     hovered ? `drop-shadow(0 0 4px ${color}88)` : 'none',
          }}
        >
          {icon}
        </span>
        <span
          style={{
            ...typography.label,
            color:     colors.text,
            fontSize:  '11px',
            letterSpacing: '0.1em',
          }}
        >
          {label}
        </span>
      </div>

      {/* "ADD" hint — only visible on hover */}
      <span
        style={{
          ...typography.code,
          color:    colors.textDim,
          fontSize: '9px',
          opacity:  hovered ? 1 : 0,
          transition: 'opacity 0.18s ease',
        }}
      >
        DRAG
      </span>
    </div>
  );
};

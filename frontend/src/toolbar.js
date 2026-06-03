import { useState } from 'react';
import { DraggableNode } from './draggableNode';
import { useStore } from './store';
import { colors, typography, radii, spacing } from './styles/theme';
import { nodeColorMap } from './nodes/nodeConfigs';
import { useTheme } from './ThemeContext';

export const SIDEBAR_WIDTH  = 280;
export const TOPBAR_HEIGHT  = 56;

// Colors come from nodeColorMap (category-derived) so toolbar chips always
// match the rendered nodes — changing a category color is a one-token edit.
const CATEGORIES = [
  {
    label: 'Core',
    nodes: [
      { type: 'customInput',  label: 'Input',  icon: 'login',       color: nodeColorMap.customInput  },
      { type: 'llm',          label: 'LLM',    icon: 'psychology',  color: nodeColorMap.llm          },
      { type: 'text',         label: 'Text',   icon: 'description', color: nodeColorMap.text         },
      { type: 'customOutput', label: 'Output', icon: 'logout',      color: nodeColorMap.customOutput },
    ],
  },
  {
    label: 'Utilities',
    nodes: [
      { type: 'filter', label: 'Filter', icon: 'filter_alt',    color: nodeColorMap.filter },
      { type: 'math',   label: 'Math',   icon: 'calculate',     color: nodeColorMap.math   },
      { type: 'api',    label: 'API',    icon: 'api',           color: nodeColorMap.api    },
      { type: 'delay',  label: 'Delay',  icon: 'timer',         color: nodeColorMap.delay  },
      { type: 'note',   label: 'Note',   icon: 'sticky_note_2', color: nodeColorMap.note   },
    ],
  },
];

const ALL_NODES = CATEGORIES.flatMap((c) => c.nodes);

export const PipelineToolbar = ({ onOpenTemplates, onOpenLogs }) => {
  useTheme(); // subscribe to theme context for instant re-render on toggle
  const [query,     setQuery]     = useState('');
  const [collapsed, setCollapsed] = useState({});

  const toggle = (label) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const filtered = query.trim()
    ? ALL_NODES.filter(
        (n) =>
          n.label.toLowerCase().includes(query.toLowerCase()) ||
          n.type.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <aside
      style={{
        position:      'fixed',
        left:          0,
        top:           `${TOPBAR_HEIGHT}px`,
        width:         `${SIDEBAR_WIDTH}px`,
        height:        `calc(100vh - ${TOPBAR_HEIGHT}px)`,
        background:    colors.surface,
        borderRight:   `1px solid ${colors.outline}`,
        display:       'flex',
        flexDirection: 'column',
        padding:       '16px 16px 20px',
        zIndex:        40,
      }}
    >
      {/* Section heading */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ ...typography.label, color: colors.textMuted, fontSize: '10px' }}>
          Node Library
        </h2>
        <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
          {ALL_NODES.length} TYPES
        </span>
      </div>

      {/* Search input */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 10px',
          background: colors.canvasDeep,
          border: `1px solid ${colors.outlineSubtle}`,
          borderRadius: radii.sm,
          marginBottom: '14px',
          transition: 'border-color 0.12s',
        }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = `${colors.primary}60`)}
        onBlurCapture={(e)  => (e.currentTarget.style.borderColor = colors.outlineSubtle)}
      >
        <span className="material-symbols-outlined" style={{ color: colors.textDim, fontSize: '14px' }}>
          search
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter nodes…"
          style={{
            flex: 1, background: 'transparent',
            border: 'none', outline: 'none',
            color: colors.text,
            fontFamily: typography.fontFamily,
            fontSize: '12px', fontWeight: 400,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              background: 'transparent', border: 'none',
              color: colors.textDim, cursor: 'pointer',
              fontSize: '11px', lineHeight: 1, padding: '0',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {filtered ? (
          filtered.length === 0 ? (
            <p style={{ ...typography.body, color: colors.textDim, fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
              No nodes match "{query}"
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {filtered.map(({ type, label, icon, color }) => (
                <DraggableNode key={type} type={type} label={label} icon={icon} color={color} />
              ))}
            </div>
          )
        ) : (
          CATEGORIES.map(({ label, nodes }) => (
            <div key={label} style={{ marginBottom: '12px' }}>
              <button
                onClick={() => toggle(label)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%',
                  padding: '4px 0 6px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.outlineSubtle}`,
                  marginBottom: '6px',
                }}
              >
                <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
                  {label.toUpperCase()}
                </span>
                <span style={{
                  color: colors.textDim, fontSize: '10px', lineHeight: 1,
                  transform: collapsed[label] ? 'rotate(-90deg)' : 'rotate(0)',
                  transition: 'transform 0.15s ease',
                  display: 'inline-block',
                }}>
                  ▾
                </span>
              </button>

              {!collapsed[label] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                  {nodes.map(({ type, label: nLabel, icon, color }) => (
                    <DraggableNode key={type} type={type} label={nLabel} icon={icon} color={color} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer: shortcuts hints + Templates + Logs */}
      <div
        style={{
          marginTop: '12px', paddingTop: '12px',
          borderTop: `1px solid ${colors.outlineSubtle}`,
          display: 'flex', flexDirection: 'column', gap: '5px',
        }}
      >
        {/* Shortcut hints */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>SHORTCUTS</span>
        </div>
        <Hint k="Drag"         v="Add node to canvas"   />
        <Hint k="Drag handle"  v="Connect nodes"        />
        <Hint k="Del"          v="Remove selection"     />
        <Hint k="Right-click"  v="Node / canvas menu"   />
        <Hint k="Ctrl K"       v="Command palette"      />
        <Hint k="?"            v="Show all shortcuts"   />

        {/* Templates + Logs */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <FooterButton icon="auto_awesome_motion" label="Templates" color={colors.primary} onClick={onOpenTemplates} />
          <FooterButton icon="list_alt"            label="Logs"      color={colors.textMuted} onClick={onOpenLogs} />
        </div>

        {/* Hint: auto-arrange moved to right-click canvas menu */}
        <Hint k="Right-click canvas" v="Auto-arrange layout" />
      </div>
    </aside>
  );
};

const Hint = ({ k, v }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span
      style={{
        ...typography.code,
        color: colors.primary,
        background: `${colors.primary}14`,
        border: `1px solid ${colors.primary}33`,
        borderRadius: radii.xs,
        padding: '1px 6px',
        fontSize: '9px',
        whiteSpace: 'nowrap',
      }}
    >
      {k}
    </span>
    <span style={{ ...typography.body, color: colors.textDim, fontSize: '10.5px' }}>{v}</span>
  </div>
);

const FooterButton = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '7px 10px',
      background: `${color}0f`,
      border: `1px solid ${color}28`,
      borderRadius: radii.sm,
      color,
      cursor: 'pointer',
      transition: 'background 0.12s, border-color 0.12s',
      ...typography.code,
      fontSize: '9px',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = `${color}22`;
      e.currentTarget.style.borderColor = `${color}55`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = `${color}0f`;
      e.currentTarget.style.borderColor = `${color}28`;
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '13px', color }}>
      {icon}
    </span>
    {label}
  </button>
);


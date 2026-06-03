import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';
import { colors, typography, radii, shadows } from './styles/theme';
import { useTheme } from './ThemeContext';
import { nodeColorMap } from './nodes/nodeConfigs';

// All_NODES colors come from nodeColorMap so they always match what renders on canvas.
const ALL_NODES = [
  { type: 'customInput',  label: 'Input',        icon: 'login',         color: nodeColorMap.customInput,  desc: 'Pipeline data entry point',    group: 'Core'      },
  { type: 'llm',          label: 'LLM',          icon: 'psychology',    color: nodeColorMap.llm,          desc: 'Language model inference',     group: 'Core'      },
  { type: 'text',         label: 'Text',         icon: 'description',   color: nodeColorMap.text,         desc: 'Template with {{variables}}',  group: 'Core'      },
  { type: 'customOutput', label: 'Output',       icon: 'logout',        color: nodeColorMap.customOutput, desc: 'Pipeline result sink',         group: 'Core'      },
  { type: 'filter',       label: 'Filter',       icon: 'filter_alt',    color: nodeColorMap.filter,       desc: 'Conditional data filter',      group: 'Utilities' },
  { type: 'math',         label: 'Math',         icon: 'calculate',     color: nodeColorMap.math,         desc: 'Arithmetic operations',        group: 'Utilities' },
  { type: 'api',          label: 'API',          icon: 'api',           color: nodeColorMap.api,          desc: 'HTTP / REST request',          group: 'Utilities' },
  { type: 'delay',        label: 'Delay',        icon: 'timer',         color: nodeColorMap.delay,        desc: 'Time-based execution delay',   group: 'Utilities' },
  { type: 'note',         label: 'Note',         icon: 'sticky_note_2', color: nodeColorMap.note,         desc: 'Canvas annotation block',      group: 'Utilities' },
];

export const CommandPalette = ({ open, onClose }) => {
  useTheme();
  const [query,     setQuery]     = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  const getNodeID   = useStore((s) => s.getNodeID);
  const addNode     = useStore((s) => s.addNode);
  const rfInstance  = useStore((s) => s.rfInstance);

  const filtered = ALL_NODES.filter((n) => {
    const q = query.toLowerCase();
    return (
      n.label.toLowerCase().includes(q) ||
      n.desc.toLowerCase().includes(q)  ||
      n.group.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const addToCanvas = useCallback((nodeType) => {
    const nodeID = getNodeID(nodeType);
    let position = { x: 300, y: 200 };
    if (rfInstance) {
      try {
        const el = document.querySelector('.react-flow__viewport')?.parentElement;
        if (el) {
          const b = el.getBoundingClientRect();
          const raw = rfInstance.project({ x: b.width / 2, y: b.height / 2 });
          position = { x: raw.x - 120, y: raw.y - 50 };
        }
      } catch {}
    }
    addNode({ id: nodeID, type: nodeType, position, data: { id: nodeID, nodeType } });
    onClose();
  }, [rfInstance, getNodeID, addNode, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter')    { if (filtered[activeIdx]) addToCanvas(filtered[activeIdx].type); }
    else if (e.key === 'Escape')   { onClose(); }
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'var(--overlay-bg)',
          backdropFilter: 'blur(4px)',
          animation: 'fade-in 0.12s ease',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '18%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          width: '500px',
          maxWidth: 'calc(100vw - 40px)',
          background: colors.surfaceContainer,
          border: `1px solid ${colors.outlineStrong}`,
          borderRadius: radii.lg,
          boxShadow: `${shadows.panel}, 0 0 80px ${colors.primaryGlow}`,
          overflow: 'hidden',
          animation: 'palette-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Search row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '14px 16px',
          borderBottom: `1px solid ${colors.outline}`,
        }}>
          <span className="material-symbols-outlined" style={{ color: colors.textDim, fontSize: '18px' }}>
            search
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes…"
            style={{
              flex: 1, background: 'transparent',
              border: 'none', outline: 'none',
              color: colors.text,
              fontFamily: typography.fontFamily,
              fontSize: '14px', fontWeight: 400,
            }}
          />
          <Kbd>Esc</Kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 ? (
            <p style={{ ...typography.body, color: colors.textDim, textAlign: 'center', padding: '24px' }}>
              No nodes match "{query}"
            </p>
          ) : (
            filtered.map((node, idx) => (
              <button
                key={node.type}
                onClick={() => addToCanvas(node.type)}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  width: '100%', padding: '10px',
                  background: idx === activeIdx ? `${colors.primary}10` : 'transparent',
                  border: `1px solid ${idx === activeIdx ? `${colors.primary}28` : 'transparent'}`,
                  borderRadius: radii.xs,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.08s, border-color 0.08s',
                  marginBottom: '2px',
                }}
              >
                {/* Icon box */}
                <span style={{
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${node.color}18`,
                  border: `1px solid ${node.color}40`,
                  borderRadius: radii.xs, flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: node.color }}>
                    {node.icon}
                  </span>
                </span>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    ...typography.label,
                    color: idx === activeIdx ? colors.primary : colors.text,
                    fontSize: '11px', display: 'block',
                  }}>
                    {node.label}
                  </span>
                  <span style={{ ...typography.body, color: colors.textDim, fontSize: '11px' }}>
                    {node.desc}
                  </span>
                </div>

                {/* Group badge */}
                <span style={{
                  ...typography.code,
                  background: `${node.color}14`,
                  border: `1px solid ${node.color}30`,
                  borderRadius: radii.xs,
                  padding: '2px 6px',
                  color: node.color, fontSize: '9px', flexShrink: 0,
                }}>
                  {node.group}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px',
          borderTop: `1px solid ${colors.outline}`,
        }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            {filtered.length}/{ALL_NODES.length} NODES · ADDS TO CANVAS CENTER
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Kbd>↑↓</Kbd>
            <span style={{ ...typography.body, color: colors.textDim, fontSize: '10px', marginRight: '8px' }}>navigate</span>
            <Kbd>↵</Kbd>
            <span style={{ ...typography.body, color: colors.textDim, fontSize: '10px' }}>add node</span>
          </div>
        </div>
      </div>
    </>
  );
};

const Kbd = ({ children }) => (
  <kbd style={{
    ...typography.code,
    background: colors.surface,
    border: `1px solid ${colors.outline}`,
    borderRadius: '2px',
    padding: '2px 6px',
    color: colors.textMuted,
    fontSize: '9px',
  }}>
    {children}
  </kbd>
);

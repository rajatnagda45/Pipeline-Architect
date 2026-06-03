import { useEffect } from 'react';
import { colors, typography, radii, shadows } from './styles/theme';

const SHORTCUTS = [
  // Global
  { key: 'Ctrl K',         desc: 'Open command palette',               group: 'Global' },
  { key: '?',              desc: 'Show / hide this modal',             group: 'Global' },
  { key: 'Esc',            desc: 'Close overlay / deselect',           group: 'Global' },
  // Edit
  { key: 'Ctrl Z',         desc: 'Undo last action',                   group: 'Edit'   },
  { key: 'Ctrl Y',         desc: 'Redo (also Ctrl Shift Z)',           group: 'Edit'   },
  { key: 'Ctrl A',         desc: 'Select all nodes',                   group: 'Edit'   },
  { key: 'Ctrl C',         desc: 'Copy selected nodes + edges',        group: 'Edit'   },
  { key: 'Ctrl V',         desc: 'Paste copied graph (+40px offset)',  group: 'Edit'   },
  // Canvas interactions
  { key: 'Drag',           desc: 'Add node from sidebar',              group: 'Canvas' },
  { key: 'Drag handle',    desc: 'Connect two nodes',                  group: 'Canvas' },
  { key: 'Del',            desc: 'Delete selected node or edge',       group: 'Canvas' },
  { key: 'Shift drag',     desc: 'Multi-select nodes',                 group: 'Canvas' },
  { key: 'Right-click node',   desc: 'Duplicate / delete node',        group: 'Canvas' },
  { key: 'Right-click edge',   desc: 'Delete edge / reconnect tip',    group: 'Canvas' },
  { key: 'Right-click canvas', desc: 'Add node · auto-arrange · fit', group: 'Canvas' },
  // View
  { key: 'Ctrl scroll',    desc: 'Zoom in / out',                      group: 'View'   },
  { key: 'Space drag',     desc: 'Pan the canvas',                     group: 'View'   },
];

const GROUPS = ['Global', 'Edit', 'Canvas', 'View'];

export const KeyboardShortcutsModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 399,
          background: 'var(--overlay-bg)',
          backdropFilter: 'blur(4px)',
          animation: 'fade-in 0.12s ease',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 400,
          width: '400px',
          maxWidth: 'calc(100vw - 40px)',
          background: colors.surfaceContainer,
          border: `1px solid ${colors.outlineStrong}`,
          borderRadius: radii.lg,
          boxShadow: shadows.panel,
          overflow: 'hidden',
          animation: 'fade-in 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.outline}`,
          background: colors.surface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: colors.primary, fontSize: '16px' }}>
              keyboard
            </span>
            <div>
              <span style={{ ...typography.label, color: colors.text, fontSize: '10px' }}>
                Keyboard Shortcuts
              </span>
              <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px', marginLeft: '10px' }}>
                Pipeline Architect
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.outline}`,
              borderRadius: radii.xs,
              color: colors.textMuted,
              width: '24px', height: '24px',
              cursor: 'pointer', fontSize: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.1s, color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.danger;
              e.currentTarget.style.color = colors.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.outline;
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcut groups */}
        <div style={{ padding: '8px 0 12px', maxHeight: '420px', overflowY: 'auto' }}>
          {GROUPS.map((group) => (
            <div key={group}>
              <div style={{
                padding: '8px 16px 4px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
                  {group.toUpperCase()}
                </span>
                <div style={{ flex: 1, height: '1px', background: colors.outlineSubtle }} />
              </div>

              {SHORTCUTS.filter((s) => s.group === group).map(({ key, desc }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 16px',
                  }}
                >
                  <span style={{ ...typography.body, color: colors.textMuted, fontSize: '12px' }}>
                    {desc}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                    {key.split(' ').map((k) => (
                      <kbd
                        key={k}
                        style={{
                          ...typography.code,
                          background: colors.surface,
                          border: `1px solid ${colors.outlineStrong}`,
                          borderRadius: '2px',
                          padding: '2px 7px',
                          color: colors.primary,
                          fontSize: '10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: `1px solid ${colors.outline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px',
        }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            Press
          </span>
          <kbd style={{
            ...typography.code,
            background: colors.surface, border: `1px solid ${colors.outline}`,
            borderRadius: '2px', padding: '1px 5px',
            color: colors.primary, fontSize: '9px',
          }}>?</kbd>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>or</span>
          <kbd style={{
            ...typography.code,
            background: colors.surface, border: `1px solid ${colors.outline}`,
            borderRadius: '2px', padding: '1px 5px',
            color: colors.primary, fontSize: '9px',
          }}>Esc</kbd>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>to close</span>
        </div>
      </div>
    </>
  );
};

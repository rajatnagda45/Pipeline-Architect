import { useEffect } from 'react';
import { colors, typography, radii } from './styles/theme';

export const ContextMenu = ({ x, y, nodeId, onDelete, onDuplicate, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const menuStyle = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 170),
    top:  Math.min(y, window.innerHeight - 100),
    zIndex: 500,
    background: colors.surfaceContainer,
    border: `1px solid ${colors.outlineStrong}`,
    borderRadius: radii.sm,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
    minWidth: '160px',
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
    animation: 'fade-in 0.08s ease',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 499 }} />
      <div style={menuStyle}>
        {/* Header */}
        <div style={{
          padding: '6px 12px 5px',
          borderBottom: `1px solid ${colors.outlineSubtle}`,
        }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            NODE · {nodeId?.toUpperCase?.()}
          </span>
        </div>

        {/* Duplicate */}
        <MenuItem
          icon="⧉"
          label="Duplicate"
          color={colors.textMuted}
          hoverBg={`${colors.primary}12`}
          onClick={() => { onDuplicate(nodeId); onClose(); }}
        />

        {/* Divider */}
        <div style={{ height: '1px', background: colors.outlineSubtle, margin: '2px 0' }} />

        {/* Remove */}
        <MenuItem
          icon="✕"
          label="Remove Node"
          color={colors.danger}
          hoverBg={`${colors.danger}14`}
          onClick={() => { onDelete(nodeId); onClose(); }}
        />
      </div>
    </>
  );
};

const MenuItem = ({ icon, label, color, hoverBg, onClick }) => {
  const base = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '9px 14px',
    background: 'transparent',
    border: 'none',
    color,
    cursor: 'pointer',
    textAlign: 'left',
    ...typography.body,
    fontSize: '12px',
    transition: 'background 0.1s',
  };

  return (
    <button
      style={base}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      onClick={onClick}
    >
      <span style={{ fontSize: '13px', lineHeight: 1, opacity: 0.85 }}>{icon}</span>
      {label}
    </button>
  );
};

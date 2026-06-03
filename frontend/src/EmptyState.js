import { colors, typography, radii } from './styles/theme';
import { useTheme } from './ThemeContext';

export const EmptyState = ({ onOpenPalette }) => {
  useTheme();
  return (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 1,
      userSelect: 'none',
    }}
  >
    {/* SVG illustration — abstract pipeline schematic */}
    <svg width="140" height="90" viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Node A */}
      <rect x="8" y="28" width="38" height="24" rx="3"
        stroke={`${colors.primary}50`} strokeWidth="1.2" strokeDasharray="4 2"
        fill={`${colors.primary}06`} />
      <circle cx="27" cy="40" r="4" fill={`${colors.primary}60`} />

      {/* Node B */}
      <rect x="51" y="18" width="38" height="24" rx="3"
        stroke={`${colors.llm}50`} strokeWidth="1.2" strokeDasharray="4 2"
        fill={`${colors.llm}06`} />
      <circle cx="70" cy="30" r="4" fill={`${colors.llm}60`} />

      {/* Node C */}
      <rect x="51" y="48" width="38" height="24" rx="3"
        stroke={`${colors.textNode}50`} strokeWidth="1.2" strokeDasharray="4 2"
        fill={`${colors.textNode}06`} />
      <circle cx="70" cy="60" r="4" fill={`${colors.textNode}60`} />

      {/* Node D */}
      <rect x="94" y="28" width="38" height="24" rx="3"
        stroke={`${colors.output}50`} strokeWidth="1.2" strokeDasharray="4 2"
        fill={`${colors.output}06`} />
      <circle cx="113" cy="40" r="4" fill={`${colors.output}60`} />

      {/* Edges */}
      <path d="M46 40 C49 40 49 30 51 30" stroke={`${colors.outline}90`} strokeWidth="1" fill="none" />
      <path d="M46 40 C49 40 49 60 51 60" stroke={`${colors.outline}90`} strokeWidth="1" fill="none" />
      <path d="M89 30 C91 30 91 40 94 40" stroke={`${colors.outline}90`} strokeWidth="1" fill="none" />
      <path d="M89 60 C91 60 91 40 94 40" stroke={`${colors.outline}90`} strokeWidth="1" fill="none" />

      {/* Handle dots on edges */}
      <circle cx="46" cy="40" r="2" fill={`${colors.primary}80`} />
      <circle cx="89" cy="30" r="2" fill={`${colors.llm}80`} />
      <circle cx="89" cy="60" r="2" fill={`${colors.textNode}80`} />
      <circle cx="94" cy="40" r="2" fill={`${colors.output}80`} />
    </svg>

    <p style={{ ...typography.label, color: colors.textDim, marginTop: '18px', fontSize: '10px', letterSpacing: '0.18em' }}>
      CANVAS EMPTY
    </p>

    <p style={{ ...typography.body, color: colors.textDim, marginTop: '8px', fontSize: '12px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
      Drag a node from the sidebar to begin building your pipeline.
    </p>

    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px' }}>
      <span style={{ ...typography.body, color: colors.textDim, fontSize: '11px' }}>Or press</span>
      <button
        onClick={onOpenPalette}
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: `${colors.primary}12`,
          border: `1px solid ${colors.primary}40`,
          borderRadius: radii.sm,
          color: colors.primary,
          cursor: 'pointer',
          fontFamily: typography.fontMono,
          fontWeight: 700,
          fontSize: '10px',
          letterSpacing: '0.05em',
          transition: 'background 0.12s, border-color 0.12s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${colors.primary}22`;
          e.currentTarget.style.borderColor = `${colors.primary}70`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = `${colors.primary}12`;
          e.currentTarget.style.borderColor = `${colors.primary}40`;
        }}
      >
        <span>⌘</span>K
      </button>
      <span style={{ ...typography.body, color: colors.textDim, fontSize: '11px' }}>to search nodes</span>
    </div>
  </div>
  );
};

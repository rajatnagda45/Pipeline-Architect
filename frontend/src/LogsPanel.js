/**
 * LogsPanel.js — Pipeline execution log drawer.
 *
 * New feature from the Stitch design (Logs button in sidebar footer).
 * Displays the session history of pipeline submissions — each entry shows
 * the timestamp, node/edge counts, and the DAG validation result.
 *
 * Logs are passed in as props (managed by App.js state) so they persist
 * across panel open/close without a separate store slice.
 */

import { colors, typography, radii, shadows } from './styles/theme';

export const LogsPanel = ({ logs, onClose }) => (
  <>
    {/* Backdrop */}
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 299,
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(3px)',
        animation: 'fade-in 0.12s ease',
      }}
    />

    {/* Drawer — slides in from the left, overlaid on the sidebar */}
    <div
      style={{
        position: 'fixed',
        top: '56px',
        left: '280px',
        bottom: 0,
        zIndex: 300,
        width: '340px',
        background: colors.surfaceContainer,
        borderRight: `1px solid ${colors.outlineStrong}`,
        boxShadow: shadows.panel,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slide-in-left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: `1px solid ${colors.outline}`,
        background: colors.surface,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: colors.primary, fontSize: '16px' }}>
            list_alt
          </span>
          <span style={{ ...typography.label, color: colors.text, fontSize: '10px' }}>
            Execution Logs
          </span>
          <span style={{
            ...typography.code,
            background: `${colors.primary}18`,
            border: `1px solid ${colors.primary}33`,
            borderRadius: radii.xs,
            padding: '1px 6px',
            color: colors.primary,
            fontSize: '9px',
          }}>
            {logs.length}
          </span>
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
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.danger; e.currentTarget.style.color = colors.danger; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.outline; e.currentTarget.style.color = colors.textMuted; }}
        >
          ✕
        </button>
      </div>

      {/* Log entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {logs.length === 0 ? (
          <EmptyLogs />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...logs].reverse().map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 14px',
        borderTop: `1px solid ${colors.outline}`,
        flexShrink: 0,
      }}>
        <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
          Session logs · cleared on page refresh
        </span>
      </div>
    </div>
  </>
);

const LogEntry = ({ entry }) => {
  const isSuccess = entry.kind === 'success';
  const accent = isSuccess
    ? (entry.is_dag ? colors.success : colors.warning)
    : colors.danger;

  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.outline}`,
      borderRadius: radii.sm,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Accent left bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px',
        background: accent,
      }} />

      <div style={{ padding: '10px 12px 10px 16px' }}>
        {/* Timestamp + status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            {entry.timestamp}
          </span>
          <span style={{
            ...typography.code,
            color: accent,
            background: `${accent}18`,
            border: `1px solid ${accent}33`,
            borderRadius: radii.xs,
            padding: '1px 6px',
            fontSize: '9px',
          }}>
            {isSuccess ? (entry.is_dag ? 'VALID DAG' : 'CYCLE') : 'ERROR'}
          </span>
        </div>

        {/* KPIs */}
        {isSuccess ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Kpi label="Nodes" value={entry.num_nodes} color={colors.primary} />
            <Kpi label="Edges" value={entry.num_edges} color={colors.llm} />
            <Kpi label="DAG" value={entry.is_dag ? '✓' : '✕'} color={accent} />
          </div>
        ) : (
          <span style={{ ...typography.body, color: colors.textMuted, fontSize: '11px' }}>
            {entry.errorType === 'network' ? 'Backend unreachable' : entry.title || 'Submission failed'}
          </span>
        )}
      </div>
    </div>
  );
};

const Kpi = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span style={{ ...typography.code, color: colors.textDim, fontSize: '8px' }}>{label}</span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '16px', fontWeight: 700, color, lineHeight: 1 }}>
      {value}
    </span>
  </div>
);

const EmptyLogs = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px', gap: '10px', opacity: 0.6,
  }}>
    <span className="material-symbols-outlined" style={{ color: colors.textDim, fontSize: '32px' }}>
      history
    </span>
    <span style={{ ...typography.label, color: colors.textDim, fontSize: '10px' }}>
      No logs yet
    </span>
    <span style={{ ...typography.body, color: colors.textDim, fontSize: '11px', textAlign: 'center', lineHeight: 1.5 }}>
      Submit a pipeline to see execution results here.
    </span>
  </div>
);

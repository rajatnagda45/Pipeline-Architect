/**
 * submit.js — Floating "Submit Pipeline" button + slide-up KPI result panel.
 *
 * onLog(entry) — callback provided by App.js to append each submission result
 * to the session log (visible via the Logs panel in the sidebar footer).
 */

import { useState } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { colors, typography, radii, shadows } from './styles/theme';
import { SIDEBAR_WIDTH } from './toolbar';
import { useTheme } from './ThemeContext';

const ENDPOINT = 'http://localhost:8000/pipelines/parse';
const selector = (state) => ({ nodes: state.nodes, edges: state.edges });

// ── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, accent, mono = true, icon }) => (
  <div
    style={{
      flex: 1, minWidth: 0,
      background: colors.surface,
      border: `1px solid ${colors.outline}`,
      borderRadius: radii.sm,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: '6px',
      position: 'relative', overflow: 'hidden',
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: accent }} />
    <span style={{ ...typography.label, color: colors.textDim, fontSize: '9px' }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {icon && <span style={{ fontSize: '18px', color: accent }}>{icon}</span>}
      <span style={{
        fontFamily: mono ? typography.fontMono : typography.fontFamily,
        fontSize: '24px', fontWeight: 700, color: accent, lineHeight: 1, letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
    </div>
  </div>
);

// ── Result Panel ────────────────────────────────────────────────────────────

const ResultPanel = ({ result, onDismiss }) => {
  if (!result || result.kind === 'loading') return null;

  const isSuccess = result.kind === 'success';
  const dagOk     = isSuccess && result.is_dag;
  const accent    = isSuccess ? (dagOk ? colors.success : colors.danger) : colors.danger;
  const isNetwork = !isSuccess && result.errorType === 'network';

  return (
    <>
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--result-backdrop)',
          backdropFilter: 'blur(2px)',
          zIndex: 99,
          animation: 'fade-in 0.18s ease',
        }}
      />

      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 100,
          display: 'flex', justifyContent: 'center',
          padding: '0 16px 24px',
          animation: 'panel-slide-up 0.32s cubic-bezier(0.2, 0.7, 0.2, 1)',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: '720px',
            background: colors.surfaceContainer,
            border: `1px solid ${accent}55`,
            borderRadius: radii.lg,
            padding: '24px',
            boxShadow: shadows.panel + `, 0 0 60px ${accent}22`,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '3px', height: '32px', background: accent, borderRadius: '2px' }} />
              <div>
                <h3 style={{ ...typography.brand, color: colors.text, fontSize: '13px' }}>
                  {isSuccess ? 'Analysis Complete' : result.title}
                </h3>
                <p style={{ ...typography.code, color: colors.textDim, marginTop: '3px' }}>
                  {isSuccess ? 'PIPELINE_VALIDATION_RESULT' : `ERR_${result.errorType?.toUpperCase()}`}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.outline}`,
                borderRadius: radii.xs,
                color: colors.textMuted,
                width: '28px', height: '28px',
                cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          {isSuccess ? (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <KpiCard label="Active Nodes" value={String(result.num_nodes).padStart(2, '0')} accent={colors.primary} />
                <KpiCard label="Logic Edges"  value={String(result.num_edges).padStart(2, '0')} accent={colors.llm} />
                <KpiCard
                  label="Structure"
                  value={dagOk ? 'Valid DAG' : 'Cycle'}
                  accent={accent}
                  mono={false}
                  icon={dagOk ? '✓' : '✕'}
                />
              </div>
              {!dagOk && (
                <p style={{ ...typography.body, color: colors.danger, fontSize: '12px' }}>
                  Pipeline contains a cycle — execution order is undefined.
                  Remove the cyclic edge before deploying.
                </p>
              )}
            </>
          ) : (
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.outline}`,
              borderRadius: radii.sm,
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <p style={{ ...typography.body, color: colors.textMuted, fontSize: '12px' }}>
                {result.detail}
              </p>
              {isNetwork && (
                <code style={{
                  ...typography.code,
                  display: 'block',
                  background: colors.canvasDeep,
                  border: `1px solid ${colors.outline}`,
                  borderRadius: radii.xs,
                  padding: '8px 12px',
                  color: colors.primary,
                  fontSize: '11px',
                }}>
                  $ uvicorn main:app --reload
                </code>
              )}
            </div>
          )}

          {/* Footer action */}
          <button
            onClick={onDismiss}
            style={{
              width: '100%', marginTop: '20px', height: '44px',
              background: accent,
              color: colors.textOnAccent,
              border: 'none', borderRadius: radii.sm,
              cursor: 'pointer',
              ...typography.label, fontSize: '11px',
              transition: 'filter 0.12s, transform 0.08s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.99)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isSuccess ? 'Continue Editing' : 'Dismiss'}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Floating Submit Button ──────────────────────────────────────────────────

export const SubmitButton = ({ onLog }) => {
  useTheme();
  const { nodes, edges } = useStore(selector, shallow);
  const [result,  setResult]  = useState(null);
  const [hovered, setHovered] = useState(false);
  const loading = result?.kind === 'loading';

  const handleSubmit = async () => {
    setResult({ kind: 'loading' });
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (res.status === 422) {
        const entry = {
          kind: 'error', errorType: 'validation',
          title: 'Request Rejected',
          detail: 'HTTP 422 — Pydantic validation failed.',
        };
        setResult(entry);
        onLog?.(entry);
        return;
      }
      if (!res.ok) {
        const entry = {
          kind: 'error', errorType: 'server',
          title: `Server Error · ${res.status}`,
          detail: 'Check the uvicorn console for a traceback.',
        };
        setResult(entry);
        onLog?.(entry);
        return;
      }
      const { num_nodes, num_edges, is_dag } = await res.json();
      const entry = { kind: 'success', num_nodes, num_edges, is_dag };
      setResult(entry);
      onLog?.(entry);
    } catch {
      const entry = {
        kind: 'error', errorType: 'network',
        title: 'Backend Unreachable',
        detail: 'No response from http://localhost:8000. Start the FastAPI server:',
      };
      setResult(entry);
      onLog?.(entry);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: `${SIDEBAR_WIDTH}px`,
          right: 0,
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            pointerEvents: 'auto',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '0 28px', height: '48px',
            background: loading
              ? colors.surfaceContainer
              : hovered
                ? `${colors.primary}14`
                : 'var(--submit-btn-bg)',
            backdropFilter: 'blur(8px)',
            border: `1.5px solid ${loading ? colors.outline : colors.primary}`,
            borderRadius: radii.sm,
            color: loading ? colors.textMuted : hovered ? colors.primary : colors.text,
            cursor: loading ? 'wait' : 'pointer',
            transition: 'background 0.15s, border-color 0.15s, transform 0.08s',
            boxShadow: hovered && !loading
              ? `0 8px 32px ${colors.primaryGlow}, 0 0 0 1px ${colors.primary}55`
              : shadows.panel,
            minWidth: '280px',
            justifyContent: 'center',
          }}
        >
          {/* Shimmer on hover */}
          {hovered && !loading && (
            <span style={{
              position: 'absolute', top: 0, left: 0,
              width: '40%', height: '100%',
              background: `linear-gradient(90deg, transparent, ${colors.primary}33, transparent)`,
              animation: 'shimmer-sweep 1.4s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}

          {/* Icon */}
          <span className="material-symbols-outlined" style={{
            color: loading ? colors.textMuted : colors.primary,
            fontSize: '18px', lineHeight: 1,
            transition: 'transform 0.18s',
            transform: hovered && !loading ? 'translateX(2px)' : 'translateX(0)',
            zIndex: 1,
          }}>
            {loading ? 'progress_activity' : 'rocket_launch'}
          </span>

          {/* Label */}
          <span style={{ ...typography.label, fontSize: '11px', color: 'inherit', zIndex: 1 }}>
            {loading ? 'Analyzing Pipeline…' : 'Submit Pipeline'}
          </span>

          {/* Right meta */}
          {!loading && (
            <span style={{
              ...typography.code, fontSize: '9px', color: colors.textDim,
              paddingLeft: '12px', borderLeft: `1px solid ${colors.outline}`,
              marginLeft: '4px', zIndex: 1,
            }}>
              {nodes.length}N · {edges.length}E
            </span>
          )}
        </button>
      </div>

      <ResultPanel result={result} onDismiss={() => setResult(null)} />
    </>
  );
};

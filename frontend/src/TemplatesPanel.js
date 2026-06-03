/**
 * TemplatesPanel.js — Pre-built pipeline template selector.
 *
 * New feature from the Stitch design (Templates button in sidebar footer).
 * Allows users to bootstrap common pipeline patterns onto the canvas
 * instead of building them node-by-node from scratch.
 *
 * Each template defines a complete set of nodes + edges. On selection,
 * the current canvas is replaced with the template layout.
 */

import { useCallback } from 'react';
import { useStore } from './store';
import { colors, typography, radii, shadows } from './styles/theme';

// ── Template definitions ─────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'basic-qa',
    title: 'Basic Q&A',
    description: 'Simple question → LLM → answer pipeline.',
    icon: 'question_answer',
    color: '#ff79c6',
    nodes: [
      { id: 'customInput-1', type: 'customInput', position: { x: 80,  y: 160 }, data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'question', inputType: 'Text' } },
      { id: 'llm-1',         type: 'llm',         position: { x: 380, y: 140 }, data: { id: 'llm-1', nodeType: 'llm' } },
      { id: 'customOutput-1',type: 'customOutput', position: { x: 680, y: 160 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'answer', outputType: 'Text' } },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1', sourceHandle: 'customInput-1-value', target: 'llm-1', targetHandle: 'llm-1-prompt', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e2', source: 'llm-1', sourceHandle: 'llm-1-response', target: 'customOutput-1', targetHandle: 'customOutput-1-value', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
    ],
  },
  {
    id: 'template-fill',
    title: 'Template Completion',
    description: 'Input fills a text template, then LLM processes it.',
    icon: 'edit_document',
    color: '#60a5fa',
    nodes: [
      { id: 'customInput-1', type: 'customInput', position: { x: 60,  y: 120 }, data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'topic', inputType: 'Text' } },
      { id: 'text-1',        type: 'text',        position: { x: 360, y: 100 }, data: { id: 'text-1', nodeType: 'text', text: 'Summarize the following topic: {{topic}}' } },
      { id: 'llm-1',         type: 'llm',         position: { x: 660, y: 120 }, data: { id: 'llm-1', nodeType: 'llm' } },
      { id: 'customOutput-1',type: 'customOutput', position: { x: 960, y: 140 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'summary', outputType: 'Text' } },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1', sourceHandle: 'customInput-1-value', target: 'text-1', targetHandle: 'text-1-topic', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e2', source: 'text-1', sourceHandle: 'text-1-output', target: 'llm-1', targetHandle: 'llm-1-prompt', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e3', source: 'llm-1', sourceHandle: 'llm-1-response', target: 'customOutput-1', targetHandle: 'customOutput-1-value', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
    ],
  },
  {
    id: 'api-summarize',
    title: 'API + Summarize',
    description: 'Fetch data from an API, then summarize with an LLM.',
    icon: 'cloud_sync',
    color: '#fb923c',
    nodes: [
      { id: 'customInput-1', type: 'customInput', position: { x: 60,  y: 160 }, data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'url', inputType: 'Text' } },
      { id: 'api-1',         type: 'api',         position: { x: 340, y: 140 }, data: { id: 'api-1', nodeType: 'api', url: 'https://', method: 'GET' } },
      { id: 'llm-1',         type: 'llm',         position: { x: 640, y: 120 }, data: { id: 'llm-1', nodeType: 'llm' } },
      { id: 'customOutput-1',type: 'customOutput', position: { x: 940, y: 140 }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'result', outputType: 'Text' } },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1', sourceHandle: 'customInput-1-value', target: 'api-1', targetHandle: 'api-1-body', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e2', source: 'api-1', sourceHandle: 'api-1-response', target: 'llm-1', targetHandle: 'llm-1-prompt', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e3', source: 'llm-1', sourceHandle: 'llm-1-response', target: 'customOutput-1', targetHandle: 'customOutput-1-value', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
    ],
  },
  {
    id: 'filter-branch',
    title: 'Filter & Branch',
    description: 'Route data through a condition — pass or fail branches.',
    icon: 'alt_route',
    color: '#50fa7b',
    nodes: [
      { id: 'customInput-1', type: 'customInput', position: { x: 60,  y: 200 }, data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'data', inputType: 'Text' } },
      { id: 'filter-1',      type: 'filter',      position: { x: 340, y: 180 }, data: { id: 'filter-1', nodeType: 'filter', condition: 'value !== ""', mode: 'keep' } },
      { id: 'llm-1',         type: 'llm',         position: { x: 640, y: 80  }, data: { id: 'llm-1', nodeType: 'llm' } },
      { id: 'customOutput-1',type: 'customOutput', position: { x: 940, y: 80  }, data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'result', outputType: 'Text' } },
      { id: 'customOutput-2',type: 'customOutput', position: { x: 640, y: 320 }, data: { id: 'customOutput-2', nodeType: 'customOutput', outputName: 'error', outputType: 'Text' } },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1', sourceHandle: 'customInput-1-value', target: 'filter-1', targetHandle: 'filter-1-in', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e2', source: 'filter-1', sourceHandle: 'filter-1-pass', target: 'llm-1', targetHandle: 'llm-1-prompt', type: 'smoothstep', animated: true, style: { stroke: '#50fa7b', strokeWidth: 1.5 } },
      { id: 'e3', source: 'llm-1', sourceHandle: 'llm-1-response', target: 'customOutput-1', targetHandle: 'customOutput-1-value', type: 'smoothstep', animated: true, style: { stroke: '#bd93f9', strokeWidth: 1.5 } },
      { id: 'e4', source: 'filter-1', sourceHandle: 'filter-1-fail', target: 'customOutput-2', targetHandle: 'customOutput-2-value', type: 'smoothstep', animated: true, style: { stroke: '#ff5555', strokeWidth: 1.5 } },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export const TemplatesPanel = ({ onClose }) => {
  const loadTemplate = useStore((s) => s.loadTemplate);

  const handleLoad = useCallback((template) => {
    loadTemplate(template.nodes, template.edges);
    onClose();
  }, [loadTemplate, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'var(--overlay-bg)',
          backdropFilter: 'blur(4px)',
          animation: 'fade-in 0.12s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          width: '600px',
          maxWidth: 'calc(100vw - 40px)',
          background: colors.surfaceContainer,
          border: `1px solid ${colors.outlineStrong}`,
          borderRadius: radii.lg,
          boxShadow: shadows.panel,
          overflow: 'hidden',
          animation: 'palette-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: `1px solid ${colors.outline}`,
          background: colors.surface,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: colors.primary, fontSize: '18px' }}>
              auto_awesome_motion
            </span>
            <div>
              <span style={{ ...typography.label, color: colors.text, fontSize: '11px' }}>
                Pipeline Templates
              </span>
              <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px', marginLeft: '10px' }}>
                {TEMPLATES.length} TEMPLATES
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
              width: '26px', height: '26px',
              cursor: 'pointer', fontSize: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.danger; e.currentTarget.style.color = colors.danger; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.outline; e.currentTarget.style.color = colors.textMuted; }}
          >
            ✕
          </button>
        </div>

        {/* Warning banner */}
        <div style={{
          padding: '8px 16px',
          background: `${colors.warning}14`,
          borderBottom: `1px solid ${colors.warning}33`,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span className="material-symbols-outlined" style={{ color: colors.warning, fontSize: '14px' }}>warning</span>
          <span style={{ ...typography.code, color: colors.warning, fontSize: '9px' }}>
            Loading a template will replace the current canvas
          </span>
        </div>

        {/* Template grid */}
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onLoad={() => handleLoad(template)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: `1px solid ${colors.outline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ ...typography.code, color: colors.textDim, fontSize: '9px' }}>
            Click a template to load it · Existing canvas will be cleared
          </span>
        </div>
      </div>
    </>
  );
};

const TemplateCard = ({ template, onLoad }) => (
  <button
    onClick={onLoad}
    style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      padding: '14px',
      background: colors.surface,
      border: `1px solid ${colors.outline}`,
      borderRadius: radii.sm,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'border-color 0.12s, background 0.12s',
      position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = template.color;
      e.currentTarget.style.background = `${template.color}0a`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = colors.outline;
      e.currentTarget.style.background = colors.surface;
    }}
  >
    {/* Top accent bar */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: template.color }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${template.color}18`,
        border: `1px solid ${template.color}40`,
        borderRadius: radii.xs,
        flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ color: template.color, fontSize: '16px' }}>
          {template.icon}
        </span>
      </span>
      <div>
        <div style={{ ...typography.label, color: colors.text, fontSize: '11px' }}>
          {template.title}
        </div>
        <div style={{ ...typography.code, color: template.color, fontSize: '9px', marginTop: '2px' }}>
          {template.nodes.length} nodes · {template.edges.length} edges
        </div>
      </div>
    </div>

    <p style={{ ...typography.body, color: colors.textMuted, fontSize: '11px', lineHeight: 1.5 }}>
      {template.description}
    </p>
  </button>
);

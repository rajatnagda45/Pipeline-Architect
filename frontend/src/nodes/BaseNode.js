/**
 * BaseNode.js — Universal renderer for every node type.
 *
 * HANDLES — 4-side topology:
 *   Left   target handles (config inputs)   — labeled, auto-hide when full
 *   Right  source handles (config outputs)  — labeled, always visible
 *   Top    universal _top target            — unlabeled utility handle
 *   Bottom universal _bot source            — unlabeled utility handle
 *
 * HANDLE SPACING — even distribution in the body zone:
 *   fraction = (i+1)/(total+1)  →  1→50%  2→33/67%  3→25/50/75%  …
 *   No clustering, no overlap at any count.
 *
 * HANDLE LABELS — HandlePin renders three layers per handle:
 *   1. The dot (Handle component, hides when full)
 *   2. A label chip inside the node body, aligned with the dot
 *   3. A floating tooltip outside the node edge on hover, showing
 *      `label · dataType` so users know the expected data type.
 *
 * VISUAL STATES — all driven from theme tokens via getNodeStyle():
 *   default · hover · selected · connectingSource · connectingTarget · error
 *
 * ICONOGRAPHY — config.icon is a Material Symbols name; rendered in the header.
 * CATEGORY COLOR — config.color is derived from categoryColors[config.category]
 *   in nodeConfigs.js.  One token change updates every node in that category.
 */

import { useState, useMemo } from 'react';
import { Handle, Position, useStore as useRFStore } from 'reactflow';
import { useStore } from '../store';
import { useTheme } from '../ThemeContext';
import { TextField }     from './fields/TextField';
import { SelectField }   from './fields/SelectField';
import { SliderField }   from './fields/SliderField';
import { TextareaField } from './fields/TextareaField';
import { NumberField }   from './fields/NumberField';
import { ToggleField }   from './fields/ToggleField';
import {
  getNodeStyle, getAccentBarStyle, getHeaderStyle,
  headerLeftStyle, headerIconStyle, getHeaderTextStyle,
  getHeaderBadgeStyle, getBodyStyle,
  getDescriptionStyle, getErrorBadgeStyle,
} from '../styles/nodeStyles';
import { colors, typography, radii } from '../styles/theme';

const FIELD_RENDERERS = {
  text:     TextField,
  select:   SelectField,
  slider:   SliderField,
  textarea: TextareaField,
  number:   NumberField,
  toggle:   ToggleField,
};

const HEADER_H = 36;  // px — header strip height, handles start below this

// ── Handle vertical position ──────────────────────────────────────────────────
// Even distribution within the body zone (below the header strip).
// fraction = (i+1)/(total+1)  →  one handle at 50%, two at 33%/67%, etc.
function sideTop(index, total) {
  const f = (index + 1) / (total + 1);
  return `calc(${HEADER_H}px + ${f.toFixed(4)} * (100% - ${HEADER_H}px))`;
}

function formatBadge(id) {
  if (!id) return '';
  const m = /^([a-zA-Z]+)-(\d+)$/.exec(id);
  if (!m) return id.toUpperCase().slice(0, 8);
  return `${m[1].slice(0, 3).toUpperCase()}-${m[2].padStart(2, '0')}`;
}

// ── HandlePin ─────────────────────────────────────────────────────────────────
// Renders the handle dot + inside label chip + hover tooltip as a unit.
// All three share the same computed `top` so they stay vertically aligned.

const HandlePin = ({ nodeId, handle, index, total, side, accentColor, isFull }) => {
  const [tip, setTip] = useState(false);
  const topVal = sideTop(index, total);

  const label   = handle.label || handle.id;
  const tipText = handle.dataType ? `${label} · ${handle.dataType}` : label;

  return (
    <>
      {/* ── Dot handle ── */}
      <Handle
        type={side === 'left' ? 'target' : 'source'}
        position={side === 'left' ? Position.Left : Position.Right}
        id={`${nodeId}-${handle.id}`}
        isConnectable={!isFull}
        style={{
          top:           topVal,
          background:    colors.canvas,
          border:        `2px solid ${accentColor}`,
          opacity:       isFull ? 0 : 1,
          pointerEvents: isFull ? 'none' : 'auto',
          transition:    'opacity 0.2s ease',
        }}
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
      />

      {/* ── Label chip inside node body ── */}
      <span
        style={{
          position:      'absolute',
          top:           topVal,
          ...(side === 'left' ? { left: '14px' } : { right: '14px' }),
          transform:     'translateY(-50%)',
          ...typography.handle,
          color:         colors.textDim,
          pointerEvents: 'none',
          zIndex:        10,
          whiteSpace:    'nowrap',
        }}
      >
        {label}
      </span>

      {/* ── Tooltip — floats outside the node edge on handle hover ── */}
      {tip && (
        <div
          style={{
            position:    'absolute',
            top:         topVal,
            ...(side === 'left'
              ? { right: 'calc(100% + 8px)' }   // left of node
              : { left:  'calc(100% + 8px)' }),  // right of node
            transform:   'translateY(-50%)',
            zIndex:      200,
            pointerEvents: 'none',
            background:  colors.surfaceHighest,
            border:      `1px solid ${accentColor}66`,
            borderRadius: radii.xs,
            padding:     '3px 8px',
            display:     'flex',
            alignItems:  'center',
            gap:         '5px',
            ...typography.code,
            color:       colors.text,
            fontSize:    '10px',
            whiteSpace:  'nowrap',
            boxShadow:   '0 4px 12px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ color: accentColor, fontWeight: 700, lineHeight: 1 }}>
            {side === 'left' ? '→' : '←'}
          </span>
          {tipText}
        </div>
      )}
    </>
  );
};

// ── BaseNode ──────────────────────────────────────────────────────────────────

export const BaseNode = ({ id, data, selected, config }) => {
  useTheme(); // subscribe to theme context — forces re-render on toggle
  const [hovered, setHovered] = useState(false);
  const updateNodeField = useStore((s) => s.updateNodeField);
  const edges           = useStore((s) => s.edges);

  // Connecting state — read from ReactFlow's internal store
  const connectionNodeId = useRFStore((s) => s.connectionNodeId);
  const isConnecting     = connectionNodeId != null;
  const isSource         = connectionNodeId === id;
  const isTarget         = isConnecting && !isSource;

  // Optional per-node validation
  const errorMsg = config.validate ? config.validate(data) : null;

  // Unified handle resolution — supports both array and function forms.
  // Function form lets a node derive its handles from its own data (e.g. TextNode).
  // BaseNode doesn't need to know which nodes use which form.
  const inputs  = typeof config.inputs  === 'function' ? config.inputs(data)  : (config.inputs  || []);
  const outputs = typeof config.outputs === 'function' ? config.outputs(data) : (config.outputs || []);

  const slotCount = Math.max(inputs.length, outputs.length, 1);
  const minHeight = Math.max(config.minHeight || 96, slotCount * 38 + HEADER_H + 20);
  const minWidth  = config.minWidth || 240;

  const badge = useMemo(
    () => (config.badge != null ? config.badge : formatBadge(id)),
    [config.badge, id]
  );

  // Is a given input handle at its connection capacity?
  const isInputFull = (handleId, maxConns = 1) =>
    edges.filter((e) => e.targetHandle === `${id}-${handleId}`).length >= maxConns;

  const topFull = isInputFull('_top', 1);
  const accent  = config.color;

  const universalHandleStyle = {
    background:  colors.canvas,
    border:      `2px solid ${accent}`,
    transition:  'opacity 0.2s ease',
  };

  return (
    <div
      style={getNodeStyle(minWidth, minHeight, {
        selected,
        hovered,
        accentColor:      accent,
        connectingSource: isSource,
        connectingTarget: isTarget,
        hasError:         !!errorMsg,
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Category accent bar — 2px top strip in accent color */}
      <div style={getAccentBarStyle(accent)} />

      {/* Error badge — floats above node when config.validate(data) is non-null */}
      {errorMsg && (
        <div style={getErrorBadgeStyle()}>
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>error</span>
          {errorMsg}
        </div>
      )}

      {/* Universal TOP handle — target, no label (utility for vertical layouts) */}
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-_top`}
        isConnectable={!topFull}
        style={{
          ...universalHandleStyle,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: topFull ? 0 : 1,
          pointerEvents: topFull ? 'none' : 'auto',
        }}
      />

      {/* Left input handles with label chips + tooltips */}
      {inputs.map((handle, i) => (
        <HandlePin
          key={handle.id}
          nodeId={id}
          handle={handle}
          index={i}
          total={inputs.length}
          side="left"
          accentColor={accent}
          isFull={isInputFull(handle.id, handle.maxConnections ?? 1)}
        />
      ))}

      {/* Right output handles with label chips + tooltips */}
      {outputs.map((handle, i) => (
        <HandlePin
          key={handle.id}
          nodeId={id}
          handle={handle}
          index={i}
          total={outputs.length}
          side="right"
          accentColor={accent}
          isFull={false}
        />
      ))}

      {/* Universal BOTTOM handle — source, no label */}
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-_bot`}
        style={{
          ...universalHandleStyle,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Header: Material icon + title + badge */}
      <div style={getHeaderStyle()}>
        <div style={headerLeftStyle}>
          {config.icon && (
            <span className="material-symbols-outlined" style={headerIconStyle(accent)}>
              {config.icon}
            </span>
          )}
          <span style={getHeaderTextStyle()}>{config.title}</span>
        </div>
        {badge && <span style={getHeaderBadgeStyle(accent)}>{badge}</span>}
      </div>

      {/* Body: field inputs padded clear of handle label zones */}
      <div style={getBodyStyle({ hasLeft: inputs.length > 0, hasRight: outputs.length > 0 })}>
        {(config.fields || []).map((field) => {
          const Renderer  = FIELD_RENDERERS[field.kind] || TextField;
          // disabled: static bool OR a function of node data — evaluated once per render
          const isDisabled = typeof field.disabled === 'function'
            ? !!field.disabled(data)
            : !!field.disabled;
          return (
            <Renderer
              key={field.name}
              field={field}
              value={data[field.name] ?? field.default}
              onChange={(val) => !isDisabled && updateNodeField(id, field.name, val)}
              disabled={isDisabled}
            />
          );
        })}
        {config.description && <p style={getDescriptionStyle()}>{config.description}</p>}
      </div>
    </div>
  );
};

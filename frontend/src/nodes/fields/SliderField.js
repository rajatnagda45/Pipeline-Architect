/**
 * SliderField.js — Range slider with live numeric readout.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  USER INTERACTION HEAT MAP                                               │
 * │                                                                          │
 * │  ① User clicks / touches the slider track                               │
 * │       Browser shows the thumb at the cursor position.                   │
 * │       cursor:pointer (style prop) — signals draggability.               │
 * │                                                                          │
 * │  ② User drags the slider thumb                                          │
 * │       onChange(Number(e.target.value))                                  │
 * │       → BaseNode calls updateNodeField(id, name, numericValue)          │
 * │       → store updates node.data → node re-renders                       │
 * │       → the numeric readout in the label updates live                   │
 * │       → the thumb visually moves to the new position                    │
 * │                                                                          │
 * │  ③ User reads the current value                                         │
 * │       The label shows: "{field.label}  {val}"                           │
 * │       e.g. "Duration (ms)  1000"                                        │
 * │       The number is inline (not a separate element) — compact layout.   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * NUMERIC DISPLAY:
 *   The current value is shown inline in the label, to the right of the
 *   field name. This gives immediate visual feedback as the user drags
 *   without needing a separate readout element taking extra vertical space.
 *   Color: colors.text (#f1f5f9) — brighter than the label's textMuted to
 *   visually distinguish the live value from the static label.
 *
 * VALUE RESOLUTION:
 *   `value ?? field.default ?? field.min ?? 0`
 *   Three fallbacks in priority order:
 *     1. Store value (after user interacts)
 *     2. Config default (e.g. 1000ms for Delay)
 *     3. field.min (so slider starts at the valid minimum if no default)
 *     4. 0 (last resort; prevents NaN in the range input)
 *
 * TYPE COERCION:
 *   `onChange(Number(e.target.value))` — range inputs always yield strings.
 *   The explicit Number() coercion ensures the store receives a number, not
 *   a string that would break arithmetic comparisons elsewhere.
 *
 * ACCENT COLOR:
 *   `accentColor: '#6366f1'` — the browser uses this for the thumb and filled
 *   track color. Matches the brand indigo used for edges and focus states.
 *
 * USE CASES IN THIS PROJECT:
 *   • Delay node: duration — 0 to 10000ms in 100ms steps
 */
import { getFieldRowStyle, getLabelStyle } from '../../styles/nodeStyles';
import { colors, typography } from '../../styles/theme';

/**
 * SliderField — a labeled range slider with inline live value display.
 *
 * Props:
 *   field    — FieldConfig ({ name, label, kind, default, min, max, step })
 *   value    — controlled numeric value from node.data in the store
 *   onChange — called with a Number on every drag tick
 */
export const SliderField = ({ field, value, onChange, disabled }) => {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const val = value ?? field.default ?? min;
  const pct = Math.max(0, Math.min(100, ((val - min) / (max - min || 1)) * 100));

  return (
    <div style={getFieldRowStyle(disabled)}>
      <label style={{ ...getLabelStyle(), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{field.label}</span>
        <span style={{
          color:         colors.primary,
          fontFamily:    typography.fontMono,
          fontSize:      '11px',
          letterSpacing: 0,
          textTransform: 'none',
        }}>
          {val}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={field.step ?? 1}
        value={val}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', cursor: disabled ? 'not-allowed' : 'pointer', accentColor: colors.primary, '--val': `${pct}%` }}
      />
    </div>
  );
};

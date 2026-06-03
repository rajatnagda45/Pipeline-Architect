/**
 * SelectField.js — Dropdown selector for fixed-option node fields.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  USER INTERACTION HEAT MAP                                               │
 * │                                                                          │
 * │  ① User clicks the select element                                       │
 * │       Browser opens the native OS dropdown — no custom styling needed.  │
 * │       The cursor:pointer style (from selectStyle) signals interactivity.│
 * │                                                                          │
 * │  ② User picks an option                                                 │
 * │       onChange(e.target.value)                                           │
 * │       → BaseNode's handler: updateNodeField(id, name, val)              │
 * │       → store updates node.data → node re-renders                       │
 * │       → selected option reflects the new value                          │
 * │                                                                          │
 * │  ③ User clicks away / escapes                                           │
 * │       Browser closes dropdown; no React state needed for open/closed.   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * WHY NATIVE <select>?
 *   Custom dropdowns (portals, floating-ui) add complexity and accessibility
 *   burden. Native <select> works on all platforms including mobile, supports
 *   keyboard navigation for free, and respects the OS color scheme.
 *   The selectStyle (dark background, indigo border) makes it blend with
 *   the node body on dark canvases without reimplementing a full dropdown.
 *
 * OPTIONS RENDERING:
 *   `field.options || []` — the fallback guards against misconfigured nodes
 *   that forget to declare options. It renders an empty dropdown rather than
 *   throwing a map-of-undefined error.
 *
 * VALUE INITIALISATION:
 *   Same ?? chain as TextField: store value → field.default → '' fallback.
 *
 * USE CASES IN THIS PROJECT:
 *   • Input node:  inputType  ('Text' | 'File')
 *   • Output node: outputType ('Text' | 'Image')
 *   • Filter node: mode       ('keep' | 'drop')
 *   • Math node:   operation  ('add' | 'subtract' | 'multiply' | 'divide')
 *   • API node:    method     ('GET' | 'POST' | 'PUT' | 'DELETE')
 */
import { getSelectStyle, getFieldRowStyle, getLabelStyle, onFieldFocus, onFieldBlur } from '../../styles/nodeStyles';

/**
 * SelectField — a labeled dropdown for fixed-choice node fields.
 *
 * Props:
 *   field    — FieldConfig ({ name, label, kind, default, options: string[] })
 *   value    — controlled value from node.data in the store
 *   onChange — called with the selected option string on change
 */
export const SelectField = ({ field, value, onChange, disabled }) => (
  <div style={getFieldRowStyle(disabled)}>
    <label style={getLabelStyle()}>{field.label}</label>
    <select
      style={getSelectStyle()}
      value={value ?? field.default ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFieldFocus}
      onBlur={onFieldBlur}
    >
      {(field.options || []).map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

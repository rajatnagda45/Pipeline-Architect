/**
 * TextField.js — Single-line text input field for node bodies.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  USER INTERACTION HEAT MAP                                               │
 * │                                                                          │
 * │  ① User clicks the input                                                │
 * │       onFocus → border turns indigo (#6366f1) — shows which field is   │
 * │       active when multiple fields exist in the same node body.           │
 * │                                                                          │
 * │  ② User types any character                                             │
 * │       onChange(e.target.value)                                           │
 * │       → BaseNode's onChange handler: updateNodeField(id, name, val)     │
 * │       → store immutably updates node.data → node re-renders             │
 * │       → the input reflects the new value on the next render cycle       │
 * │                                                                          │
 * │  ③ User clicks away / tabs out                                          │
 * │       onBlur → border returns to #334155 (resting state)                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * VALUE INITIALISATION:
 *   `value ?? field.default ?? ''`
 *   On first render, node.data has no field values yet (only id + nodeType).
 *   The ?? chain falls back to field.default (e.g. 'input' for inputName).
 *   After the user edits, the store value is used.
 *   The final '' guard prevents React's "uncontrolled → controlled" warning
 *   if both value and field.default are undefined.
 *
 * CONTROLLED COMPONENT:
 *   `value=` + `onChange=` makes this fully controlled — React owns the
 *   displayed value. The store is the single source of truth.
 *
 * USE CASES IN THIS PROJECT:
 *   • Input node: inputName (pipeline variable name)
 *   • Output node: outputName (pipeline sink label)
 *   • Filter node: condition (JS expression string)
 *   • API node: url (endpoint URL)
 */
import { getInputStyle, getFieldRowStyle, getLabelStyle, onFieldFocus, onFieldBlur } from '../../styles/nodeStyles';

/**
 * TextField — a labeled single-line text input.
 *
 * Props:
 *   field    — FieldConfig ({ name, label, kind, default })
 *   value    — controlled value from node.data in the store
 *   onChange — called with the new string value on every keystroke
 */
export const TextField = ({ field, value, onChange, disabled }) => (
  <div style={getFieldRowStyle(disabled)}>
    <label style={getLabelStyle()}>{field.label}</label>
    <input
      type="text"
      style={getInputStyle()}
      value={value ?? field.default ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFieldFocus}
      onBlur={onFieldBlur}
    />
  </div>
);

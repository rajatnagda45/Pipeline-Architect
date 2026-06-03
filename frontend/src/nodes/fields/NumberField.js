/**
 * NumberField.js — Numeric stepper input with optional min/max/step bounds.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  USER INTERACTION HEAT MAP                                               │
 * │                                                                          │
 * │  ① User clicks the input                                                │
 * │       onFocus → border turns indigo (#6366f1) — active focus ring.      │
 * │                                                                          │
 * │  ② User types a number directly                                         │
 * │       onChange(Number(e.target.value))                                  │
 * │       → updateNodeField receives a Number (not string)                  │
 * │       → store updates → node re-renders with new value                  │
 * │                                                                          │
 * │  ③ User clicks the browser's spin buttons (▲ / ▼)                      │
 * │       Same onChange path; browser increments by field.step ?? 1         │
 * │       → value updates in the store on each click                        │
 * │                                                                          │
 * │  ④ User types a value outside the min/max bounds                       │
 * │       Browser's built-in validation highlights the input red (optional) │
 * │       The value is still stored as-is — clamping is the backend's job.  │
 * │                                                                          │
 * │  ⑤ User clicks away / tabs out                                          │
 * │       onBlur → border returns to #334155 (resting state)                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * DIFFERENCE FROM SliderField:
 *   SliderField — visual range bar, suited for continuous values where the
 *     relative position matters (e.g. "50% of max delay").
 *   NumberField — text input with spin buttons, suited for precise discrete
 *     values where the user wants to type an exact number (e.g. "operand = 42").
 *
 * TYPE COERCION:
 *   `onChange(Number(e.target.value))` — same as SliderField.
 *   type="number" inputs still yield strings via e.target.value.
 *   Explicit Number() prevents string accumulation (e.g. '1' + '0' = '10'
 *   but Number('1') + Number('0') = 1 + 0 = 1).
 *
 * VALUE RESOLUTION:
 *   `value ?? field.default ?? 0`
 *   Falls back to 0 rather than '' — an empty number input renders as NaN
 *   which is visually confusing. 0 is always a valid starting number.
 *
 * BOUNDS ATTRIBUTES:
 *   min, max, step are passed as DOM attributes — the browser enforces them
 *   via the built-in constraint validation and spin-button step increments.
 *   They are left undefined when not specified in the config rather than
 *   defaulting (e.g. min=0) to avoid accidentally restricting negative inputs.
 *
 * USE CASES IN THIS PROJECT:
 *   • Math node: operand B — the second operand for the chosen arithmetic op
 */
import { getInputStyle, getFieldRowStyle, getLabelStyle, onFieldFocus, onFieldBlur } from '../../styles/nodeStyles';

/**
 * NumberField — a labeled numeric stepper input.
 *
 * Props:
 *   field    — FieldConfig ({ name, label, kind, default, min?, max?, step? })
 *   value    — controlled numeric value from node.data in the store
 *   onChange — called with a Number on every change (type or spin)
 */
export const NumberField = ({ field, value, onChange, disabled }) => (
  <div style={getFieldRowStyle(disabled)}>
    <label style={getLabelStyle()}>{field.label}</label>
    <input
      type="number"
      style={getInputStyle()}
      min={field.min}           // undefined if not in config → no DOM constraint
      max={field.max}
      step={field.step ?? 1}    // default step of 1 if not specified
      value={value ?? field.default ?? 0}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      onFocus={onFieldFocus}
      onBlur={onFieldBlur}
    />
  </div>
);

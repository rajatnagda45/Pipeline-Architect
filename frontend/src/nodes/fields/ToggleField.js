/**
 * ToggleField.js — Boolean pill-toggle for node body fields.
 *
 * Visual:
 *   [Label]                    [●  ] off
 *   [Label]              [  ●] on
 *
 * The pill uses the node's accent color when on so the "active" state is
 * immediately recognizable even when multiple toggles appear in one node.
 *
 * Accessibility: role="switch" + aria-checked mirrors the HTML checkbox
 * semantics; the button is keyboard-focusable and space/enter triggers it.
 *
 * Focus ring: matches all other field components — `colors.primary` border
 * on focus, cleared on blur, driven by onFieldFocus / onFieldBlur.
 *
 * disabled: inherits opacity + pointer-events from getFieldRowStyle(disabled).
 * The button also gets aria-disabled so screen-readers announce it.
 */

import { getFieldRowStyle, getLabelStyle, onFieldFocus, onFieldBlur } from '../../styles/nodeStyles';
import { colors, radii } from '../../styles/theme';

export const ToggleField = ({ field, value, onChange, disabled }) => {
  const on = value ?? field.default ?? false;

  const trackColor   = on ? colors.primary : colors.outline;
  const thumbColor   = on ? colors.textOnAccent : colors.textMuted;
  const thumbLeft    = on ? '15px' : '2px';

  return (
    <div style={{
      ...getFieldRowStyle(disabled),
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
    }}>
      <label style={getLabelStyle()}>{field.label}</label>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-disabled={disabled}
        onClick={() => !disabled && onChange(!on)}
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
        style={{
          position:     'relative',
          width:        '32px',
          height:       '17px',
          flexShrink:   0,
          borderRadius: radii.full,
          background:   trackColor,
          border:       `1px solid ${on ? colors.primary : colors.outlineStrong}`,
          padding:      0,
          cursor:       disabled ? 'not-allowed' : 'pointer',
          outline:      'none',
          transition:   'background 0.18s ease, border-color 0.18s ease',
        }}
      >
        <span
          style={{
            position:     'absolute',
            top:          '1px',
            left:         thumbLeft,
            width:        '13px',
            height:       '13px',
            borderRadius: '50%',
            background:   thumbColor,
            transition:   'left 0.18s ease, background 0.18s ease',
          }}
        />
      </button>
    </div>
  );
};

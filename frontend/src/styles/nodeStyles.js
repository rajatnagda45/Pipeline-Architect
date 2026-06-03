/**
 * nodeStyles.js — Style factories for node containers and subcomponents.
 *
 * All functions read from the mutable `colors` object at call time so they
 * return correct values after a theme switch + re-render. Static objects
 * that used to be module-level constants have been converted to getter
 * functions for the same reason.
 */

import { colors, radii, shadows, transitions, typography, spacing } from './theme';

export const getNodeStyle = (minWidth = 220, minHeight = 84, opts = {}) => {
  const { selected, hovered, accentColor, connectingSource, connectingTarget, hasError } = opts;

  let borderColor = colors.outline;
  let boxShadow   = shadows.node;
  let background  = colors.surface;

  if (hasError) {
    borderColor = colors.danger;
    boxShadow   = shadows.nodeError;
    background  = `${colors.danger}0a`;
  } else if (selected) {
    borderColor = accentColor;
    boxShadow   = shadows.nodeSelected(accentColor);
  } else if (connectingSource) {
    borderColor = accentColor;
    boxShadow   = shadows.nodeConnectingSource(accentColor);
    background  = `${accentColor}08`;
  } else if (connectingTarget) {
    borderColor = `${accentColor}66`;
    boxShadow   = shadows.nodeConnectingTarget(accentColor);
    background  = `${accentColor}05`;
  } else if (hovered) {
    borderColor = accentColor;
    boxShadow   = shadows.nodeHover(accentColor);
  }

  return {
    background,
    border:        `1px solid ${borderColor}`,
    borderRadius:  radii.sm,
    boxShadow,
    minWidth,
    minHeight,
    fontFamily:    typography.fontFamily,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'visible',
    position:      'relative',
    transition:    transitions.border,
  };
};

export const getAccentBarStyle = (accentColor) => ({
  position:     'absolute',
  top:          0,
  left:         0,
  right:        0,
  height:       '2px',
  background:   accentColor,
  borderTopLeftRadius:  radii.sm,
  borderTopRightRadius: radii.sm,
  pointerEvents: 'none',
  zIndex:       2,
});

export const getHeaderStyle = () => ({
  background:    colors.surfaceHigh,
  borderBottom:  `1px solid ${colors.outline}`,
  borderTopLeftRadius:  radii.sm,
  borderTopRightRadius: radii.sm,
  padding:       '8px 12px',
  display:       'flex',
  alignItems:    'center',
  justifyContent:'space-between',
  gap:           '8px',
  flexShrink:    0,
});

export const headerLeftStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:        '8px',
  minWidth:   0,
};

export const headerIconStyle = (accentColor) => ({
  fontSize:   '16px',
  lineHeight: 1,
  color:      accentColor,
  filter:     `drop-shadow(0 0 4px ${accentColor}55)`,
});

// Converted from static object → getter so it reads colors at call time
export const getHeaderTextStyle = () => ({
  ...typography.title,
  color:     colors.text,
  whiteSpace:'nowrap',
});

export const getHeaderBadgeStyle = (accentColor) => ({
  ...typography.code,
  color:        accentColor,
  background:   `${accentColor}1f`,
  border:       `1px solid ${accentColor}33`,
  borderRadius: radii.xs,
  padding:      '2px 6px',
  whiteSpace:   'nowrap',
});

const HANDLE_PAD = 70;
const BASE_PAD   = 12;

export const getBodyStyle = ({ hasLeft = false, hasRight = false } = {}) => ({
  paddingTop:    '12px',
  paddingBottom: '12px',
  paddingLeft:   `${hasLeft  ? HANDLE_PAD : BASE_PAD}px`,
  paddingRight:  `${hasRight ? HANDLE_PAD : BASE_PAD}px`,
  display:       'flex',
  flexDirection: 'column',
  gap:           spacing.sm,
  flex:          1,
});

export const fieldRowStyle = {
  display:       'flex',
  flexDirection: 'column',
  gap:           '5px',
};

export const getFieldRowStyle = (disabled = false) => ({
  ...fieldRowStyle,
  ...(disabled ? {
    opacity:       0.42,
    pointerEvents: 'none',
    userSelect:    'none',
  } : {}),
});

// Getter — reads colors at call time
export const getLabelStyle = () => ({
  ...typography.label,
  color: colors.textDim,
});

// Getter — reads colors at call time
export const getInputStyle = () => ({
  background:   colors.canvasDeep,
  border:       `1px solid ${colors.outline}`,
  borderRadius: radii.xs,
  color:        colors.text,
  padding:      '6px 9px',
  fontSize:     '12px',
  fontFamily:   typography.fontFamily,
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
  transition:   transitions.border,
});

// Getter — reads colors at call time
export const getSelectStyle = () => ({
  ...getInputStyle(),
  cursor:        'pointer',
  appearance:    'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23a2a695' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
  backgroundRepeat:   'no-repeat',
  backgroundPosition: 'right 9px center',
  paddingRight:       '26px',
});

export const getHandleLabelStyle = (side) => ({
  position:      'absolute',
  ...typography.handle,
  color:         colors.textMuted,
  whiteSpace:    'nowrap',
  pointerEvents: 'none',
  zIndex:        10,
  transform:     'translateY(-50%)',
  ...(side === 'left'  ? { left:  '14px' } : {}),
  ...(side === 'right' ? { right: '14px' } : {}),
});

export const onFieldFocus = (e) => (e.target.style.borderColor = colors.primary);
export const onFieldBlur  = (e) => (e.target.style.borderColor = colors.outline);

// Getter — reads colors at call time
export const getErrorBadgeStyle = () => ({
  position:   'absolute',
  bottom:     'calc(100% + 4px)',
  left:       '50%',
  transform:  'translateX(-50%)',
  background: colors.danger,
  color:      '#ffffff',
  borderRadius: radii.xs,
  padding:    '3px 8px',
  display:    'flex',
  alignItems: 'center',
  gap:        '4px',
  ...typography.code,
  fontSize:   '9px',
  whiteSpace: 'nowrap',
  zIndex:     20,
  boxShadow:  `0 2px 8px ${colors.danger}44`,
  pointerEvents: 'none',
});

// Getter — reads colors at call time
export const getDescriptionStyle = () => ({
  ...typography.body,
  color:      colors.textDim,
  fontSize:   '11.5px',
  lineHeight: 1.55,
  margin:     0,
  padding:    '8px 10px',
  background: colors.canvasDeep,
  border:     `1px dashed ${colors.outline}`,
  borderRadius: radii.xs,
});


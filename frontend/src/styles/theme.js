/**
 * theme.js — Design tokens (Technical Precision System · Stitch Edition).
 *
 * Supports dark (default) and light themes. The `colors` export is a mutable
 * object — call `applyTheme(dark)` to swap it in place, then trigger a React
 * re-render so all consumers pick up the new values.
 *
 * Static style objects in nodeStyles.js are converted to getter functions so
 * they compute fresh color values on every call rather than at module load.
 */

// ── Category accent palette ────────────────────────────────────────────────────
export const categoryColors = {
  input:      '#ff79c6',
  output:     '#ff5555',
  ai:         '#bd93f9',
  processing: '#60a5fa',
  utility:    '#ffb95f',
};

// ── Dark palette ──────────────────────────────────────────────────────────────
const darkColors = {
  canvas:           '#0d0f0a',
  canvasDeep:       '#080a06',
  surface:          '#1a1d14',
  surfaceContainer: '#24281c',
  surfaceHigh:      '#2e3224',
  surfaceHighest:   '#383d2a',

  outline:        '#3d4130',
  outlineStrong:  '#555941',
  outlineSubtle:  '#2a2d20',

  text:        '#e2e4d9',
  textMuted:   '#a2a695',
  textDim:     '#6c7163',
  textOnAccent:'#0d0f0a',

  primary:        '#ff79c6',
  primarySoft:    '#ff5cbf',
  primaryDeep:    '#c9599a',
  primaryGlow:    'rgba(255,121,198,0.22)',

  success:        '#50fa7b',
  successSoft:    '#3dcc62',
  warning:        '#f1fa8c',
  danger:         '#ff5555',
  dangerSoft:     '#9a1515',

  input:    '#ff79c6',
  output:   '#ff5555',
  llm:      '#bd93f9',
  textNode: '#60a5fa',
  filter:   '#50fa7b',
  math:     '#f1fa8c',
  api:      '#fb923c',
  delay:    '#22d3ee',
  note:     '#f0abfc',

  inputBg:     '#080a06',
  textInput:   '#e2e4d9',
  border:      '#3d4130',
  borderHover: '#555941',
};

// ── Light palette ─────────────────────────────────────────────────────────────
// Inspired by Stitch reference design: warm off-white surfaces, Material 3
// outline variants, darker versions of neon accents for WCAG contrast.
const lightColors = {
  canvas:           '#f4f5f0',
  canvasDeep:       '#ecede8',
  surface:          '#ffffff',
  surfaceContainer: '#f0f1ec',
  surfaceHigh:      '#e5e8df',
  surfaceHighest:   '#dadbce',

  outline:        '#c5c9b4',
  outlineStrong:  '#9ea38c',
  outlineSubtle:  '#dde0d2',

  text:        '#1c1e18',
  textMuted:   '#555750',
  textDim:     '#7a7c70',
  textOnAccent:'#ffffff',

  // Pink darkened for contrast on light backgrounds
  primary:        '#c9559a',
  primarySoft:    '#d4669b',
  primaryDeep:    '#a53a7a',
  primaryGlow:    'rgba(201,85,154,0.18)',

  success:        '#1a7a40',
  successSoft:    '#158535',
  warning:        '#8a6c00',
  danger:         '#b83028',
  dangerSoft:     '#f2c0bc',

  // Node type accents — same family, slightly deeper for light-bg contrast
  input:    '#d4197a',
  output:   '#dc2626',
  llm:      '#7c3aed',
  textNode: '#2563eb',
  filter:   '#16a34a',
  math:     '#d97706',
  api:      '#ea580c',
  delay:    '#0891b2',
  note:     '#c026d3',

  inputBg:     '#ecede8',
  textInput:   '#1c1e18',
  border:      '#c5c9b4',
  borderHover: '#9ea38c',
};

// ── Mutable live token set (starts dark) ──────────────────────────────────────
// All consumer modules import `colors` and read keys at render/call time.
// applyTheme() swaps every key in place so no re-import is needed.
export const colors = { ...darkColors };

export function applyTheme(dark) {
  const src = dark ? darkColors : lightColors;
  Object.keys(src).forEach((k) => { colors[k] = src[k]; });
}

// ── Shadows — two sets, matched to surface depth per mode ─────────────────────
const darkShadows = {
  node:                 '0 2px 16px rgba(0,0,0,0.55)',
  nodeHover:            (a) => `0 0 0 1.5px ${a}bb, 0 0 20px ${a}44, 0 4px 20px rgba(0,0,0,0.55)`,
  nodeSelected:         (a) => `0 0 0 2px ${a}, 0 6px 28px ${a}30, 0 2px 16px rgba(0,0,0,0.55)`,
  nodeConnectingSource: (a) => `0 0 0 2px ${a}, 0 0 22px ${a}44, 0 2px 14px rgba(0,0,0,0.55)`,
  nodeConnectingTarget: (a) => `0 0 0 1px ${a}55, 0 0 14px ${a}1a, 0 2px 12px rgba(0,0,0,0.45)`,
  nodeError:            '0 0 0 1.5px #ff5555, 0 0 14px rgba(255,85,85,0.20), 0 2px 14px rgba(0,0,0,0.5)',
  panel:                '0 12px 40px rgba(0,0,0,0.7)',
  topbar:               '0 1px 0 rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,0.5)',
};

const lightShadows = {
  node:                 '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
  nodeHover:            (a) => `0 0 0 1.5px ${a}aa, 0 0 12px ${a}22, 0 3px 10px rgba(0,0,0,0.10)`,
  nodeSelected:         (a) => `0 0 0 2px ${a}, 0 4px 16px ${a}18, 0 2px 8px rgba(0,0,0,0.10)`,
  nodeConnectingSource: (a) => `0 0 0 2px ${a}, 0 0 14px ${a}30, 0 2px 8px rgba(0,0,0,0.10)`,
  nodeConnectingTarget: (a) => `0 0 0 1px ${a}44, 0 0 8px ${a}12, 0 2px 6px rgba(0,0,0,0.08)`,
  nodeError:            '0 0 0 1.5px #b83028, 0 0 8px rgba(184,48,40,0.12), 0 2px 8px rgba(0,0,0,0.08)',
  panel:                '0 4px 24px rgba(0,0,0,0.12)',
  topbar:               '0 1px 0 rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.08)',
};

export const shadows = { ...darkShadows };

export function applyShadows(dark) {
  const src = dark ? darkShadows : lightShadows;
  Object.keys(src).forEach((k) => { shadows[k] = src[k]; });
}

export function applyFullTheme(dark) {
  applyTheme(dark);
  applyShadows(dark);
}

// ── Static tokens (don't vary by theme) ───────────────────────────────────────
export const spacing = {
  xxs: '2px', xs: '4px', sm: '8px',
  md: '12px', lg: '16px', xl: '24px', xxl: '32px',
};

export const radii = {
  xs: '2px', sm: '2px', md: '2px', lg: '4px', full: '9999px',
};

export const transitions = {
  fast:   'all 0.12s ease',
  base:   'all 0.18s ease',
  border: 'border-color 0.12s ease, box-shadow 0.12s ease, background 0.12s ease',
};

export const typography = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  fontMono:   "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",

  brand:    { fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
  title:    { fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' },
  label:    { fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' },
  fieldLbl: { fontSize: '11px', fontWeight: 500, letterSpacing: '0.02em' },
  body:     { fontSize: '12px', fontWeight: 400, lineHeight: 1.5 },
  input:    { fontSize: '12px', fontWeight: 400 },
  handle:   { fontSize: '9px',  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  code:     { fontSize: '10px', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" },
};

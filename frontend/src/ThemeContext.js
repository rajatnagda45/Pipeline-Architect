/**
 * ThemeContext.js — App-wide dark/light theme toggle.
 *
 * Strategy: `applyTheme(dark)` mutates the shared `colors` object in theme.js.
 * ThemeProvider increments a state counter to force a full re-render of every
 * child. On re-render all components read the freshly mutated color values —
 * no prop drilling or useContext calls needed in consumer components.
 *
 * Static style objects in nodeStyles.js (inputStyle, labelStyle, etc.) were
 * computed once at module load time and won't update from the mutation alone —
 * those have been converted to getter functions in nodeStyles.js.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { applyFullTheme } from './styles/theme';

const ThemeCtx = createContext({ dark: true, toggle: () => {} });

export const useTheme = () => useContext(ThemeCtx);

// CSS custom properties applied to :root so index.css can consume them.
// Covers ReactFlow internals, body, and scrollbars — things inline styles can't reach.
function applyCssVars(dark) {
  const r = document.documentElement;
  if (dark) {
    r.style.setProperty('--body-bg',              '#0d0f0a');
    r.style.setProperty('--body-color',           '#e2e4d9');
    r.style.setProperty('--rf-bg',                '#0d0f0a');
    r.style.setProperty('--rf-handle-bg',         '#0d0f0a');
    r.style.setProperty('--rf-controls-bg',       'rgba(26,29,20,0.9)');
    r.style.setProperty('--rf-controls-border',   '#3d4130');
    r.style.setProperty('--rf-controls-icon',     '#a2a695');
    r.style.setProperty('--rf-controls-hover-bg', 'rgba(255,121,198,0.10)');
    r.style.setProperty('--rf-controls-hover-ic', '#ff79c6');
    r.style.setProperty('--rf-minimap-bg',        'rgba(13,15,10,0.94)');
    r.style.setProperty('--rf-minimap-dot',       '#3d4130');
    r.style.setProperty('--rf-minimap-border',    '#555941');
    r.style.setProperty('--rf-minimap-mask',      'rgba(13,15,10,0.52)');
    r.style.setProperty('--rf-minimap-stroke',    'rgba(189,147,249,0.65)');
    r.style.setProperty('--rf-scrollbar',         '#3d4130');
    r.style.setProperty('--rf-scrollbar-hover',   '#555941');
    r.style.setProperty('--rf-range-fill',        '#ff79c6');
    r.style.setProperty('--rf-range-empty',       '#3d4130');
    r.style.setProperty('--submit-btn-bg',        'rgba(26,29,20,0.90)');
    r.style.setProperty('--result-backdrop',      'rgba(13,15,10,0.55)');
    r.style.setProperty('--overlay-bg',           'rgba(13,15,10,0.65)');
  } else {
    r.style.setProperty('--body-bg',              '#f4f5f0');
    r.style.setProperty('--body-color',           '#1c1e18');
    r.style.setProperty('--rf-bg',                '#f4f5f0');
    r.style.setProperty('--rf-handle-bg',         '#ffffff');
    r.style.setProperty('--rf-controls-bg',       'rgba(240,242,235,0.96)');
    r.style.setProperty('--rf-controls-border',   '#c5c9b4');
    r.style.setProperty('--rf-controls-icon',     '#555750');
    r.style.setProperty('--rf-controls-hover-bg', 'rgba(201,85,154,0.08)');
    r.style.setProperty('--rf-controls-hover-ic', '#c9559a');
    r.style.setProperty('--rf-minimap-bg',        'rgba(240,242,235,0.96)');
    r.style.setProperty('--rf-minimap-dot',       '#c5c9b4');
    r.style.setProperty('--rf-minimap-border',    '#c5c9b4');
    r.style.setProperty('--rf-minimap-mask',      'rgba(244,245,240,0.55)');
    r.style.setProperty('--rf-minimap-stroke',    'rgba(201,85,154,0.55)');
    r.style.setProperty('--rf-scrollbar',         '#c5c9b4');
    r.style.setProperty('--rf-scrollbar-hover',   '#9ea38c');
    r.style.setProperty('--rf-range-fill',        '#c9559a');
    r.style.setProperty('--rf-range-empty',       '#c5c9b4');
    r.style.setProperty('--submit-btn-bg',        'rgba(240,242,235,0.96)');
    r.style.setProperty('--result-backdrop',      'rgba(244,245,240,0.65)');
    r.style.setProperty('--overlay-bg',           'rgba(244,245,240,0.72)');
  }
}

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => {
    // Apply dark defaults immediately on first mount
    applyCssVars(true);
    return true;
  });

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      applyFullTheme(next);
      applyCssVars(next);
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
};

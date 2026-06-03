/**
 * TextareaField.js — Autoresizing multiline text input with width measurement.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  USER INTERACTION HEAT MAP                                               │
 * │                                                                          │
 * │  ① User focuses the textarea                                            │
 * │       onFocus → border turns indigo (#6366f1) — visual focus ring       │
 * │                                                                          │
 * │  ② User types a character                                               │
 * │       onChange(e.target.value) → store.updateNodeField                  │
 * │       → `value` prop changes → useEffect([value]) fires                 │
 * │       → mirror measures new width → textarea height measured            │
 * │       → node container may widen / grow taller                          │
 * │       → if text contains {{ var }}: computeInputs runs → handle appears │
 * │                                                                          │
 * │  ③ User types a very long line                                          │
 * │       mirror.scrollWidth grows → clamped to MAX_TA_W=420                │
 * │       onResize(420 + 36) called → TextNode widens to 456px              │
 * │                                                                          │
 * │  ④ User types many lines                                                │
 * │       ta.scrollHeight grows → clamped to MAX_TA_H=320                   │
 * │       ta.style.overflow='auto' → scrollbar appears when past MAX_TA_H   │
 * │                                                                          │
 * │  ⑤ User deletes content                                                 │
 * │       All measurements shrink (but clamp at MIN values, not below)      │
 * │       Node container may shrink back toward MIN_WIDTH                   │
 * │                                                                          │
 * │  ⑥ User blurs the textarea                                              │
 * │       onBlur → border returns to #334155 (resting color)                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  WIDTH MEASUREMENT: THE HIDDEN MIRROR TECHNIQUE                          │
 * │                                                                          │
 * │  Problem: how wide should the textarea be for the current text?         │
 * │                                                                          │
 * │  Option A: textarea.scrollWidth — unreliable; depends on current width  │
 * │  Option B: canvas.measureText — doesn't handle multi-font fallbacks     │
 * │  Option C: hidden mirror div (chosen) — reliable, zero reflow impact    │
 * │                                                                          │
 * │  Mirror setup:                                                           │
 * │    • position:fixed; top:-9999px; left:-9999px — off-screen,            │
 * │      position:fixed means it doesn't affect document layout flow        │
 * │    • visibility:hidden — no paint cost                                  │
 * │    • white-space:pre — preserves spaces; DOES NOT wrap lines            │
 * │    • font, padding, border — EXACTLY matching the textarea's metrics    │
 * │    • pointerEvents:none — can't be accidentally interacted with         │
 * │    • aria-hidden="true" — screen readers skip it                        │
 * │                                                                          │
 * │  Measurement:                                                            │
 * │    mirror.textContent = text + '​'  (zero-width space appended)    │
 * │    '​' prevents the mirror from collapsing to 0px when text is empty.  │
 * │    rawW = mirror.scrollWidth → pixel width of the longest line          │
 * │    clampW = clamp(rawW, MIN_TA_W, MAX_TA_W)                             │
 * │    ta.style.width = clampW + 'px'                                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  HEIGHT MEASUREMENT: scrollHeight TECHNIQUE                              │
 * │                                                                          │
 * │  1. ta.style.height = 'auto' — releases any previous constraint,        │
 * │     allowing the browser to compute the natural content height.         │
 * │  2. rawH = ta.scrollHeight — the pixel height needed to show all text   │
 * │     without a scrollbar (browser reflow happens here, but only once     │
 * │     per effect invocation, not per render).                             │
 * │  3. clampH = clamp(rawH, MIN_TA_H, MAX_TA_H)                           │
 * │  4. ta.style.height = clampH + 'px' — set final height                 │
 * │  5. overflow = rawH > MAX_TA_H ? 'auto' : 'hidden'                     │
 * │     — shows scrollbar only when content exceeds the max height cap.     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  INFINITE LOOP PREVENTION: THE onResizeRef PATTERN                       │
 * │                                                                          │
 * │  The risk:                                                               │
 * │    field.onResize is created inside TextNode's useMemo.                 │
 * │    If onResize were in useEffect's dependency array:                     │
 * │      value changes → effect runs → onResize called → setMinWidth →      │
 * │      TextNode re-renders → useMemo rebuilds config → new field object   │
 * │      → new field.onResize reference → effect re-runs → loop             │
 * │                                                                          │
 * │  Fix: onResizeRef pattern                                               │
 * │    const onResizeRef = useRef(field.onResize)       // stable ref       │
 * │    useEffect(() => { onResizeRef.current = field.onResize })            │
 * │      // always current without being a dep                              │
 * │    Main effect reads onResizeRef.current — not field.onResize directly  │
 * │    Main effect deps: [value] only — not [field.onResize]               │
 * │                                                                          │
 * │  Result: the measurement effect fires only when value changes,          │
 * │  regardless of how many times the parent rebuilds field.onResize.       │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { useRef, useEffect } from 'react';
import { getInputStyle, getFieldRowStyle, getLabelStyle, onFieldFocus, onFieldBlur } from '../../styles/nodeStyles';
import { typography } from '../../styles/theme';

// Font string must match exactly what the textarea renders.
// Used on both the mirror div and implicitly on the textarea (same CSS class).
// Must match the textarea's actual font EXACTLY (global rule in index.css sets
// JetBrains Mono on all textareas, so the mirror has to match for accurate width).
const FONT = '12px "JetBrains Mono","SF Mono",Menlo,Consolas,monospace';

// Textarea content width bounds (px).
// MIN_TA_W: smallest usable width; anything narrower clips the default text.
// MAX_TA_W: prevents the node from growing too wide on large canvases.
const MIN_TA_W = 180;
const MAX_TA_W = 420;

// Textarea height bounds (px).
// MIN_TA_H: ~3 lines — shows a reasonable amount of text on first render.
// MAX_TA_H: ~20 lines — caps height; overflow:auto kicks in beyond this.
const MIN_TA_H = 56;
const MAX_TA_H = 320;

// Extra pixels added to the measured content width when reporting to the
// parent node container. Accounts for body padding (2×14px) + node border
// (2×1px) + a few pixels of slack so content never clips.
const OUTER_PAD = 36;

/**
 * TextareaField — USE CASE: multiline text input that autoresizes in both
 * width and height as the user types.
 *
 * Props:
 *   field    — FieldConfig; field.onResize?(w) is called with desired node width
 *   value    — controlled value from the store
 *   onChange — called with the new string on every keystroke
 */
export const TextareaField = ({ field, value, onChange, disabled }) => {
  const textareaRef = useRef(null);
  const mirrorRef   = useRef(null);

  // Stable ref to field.onResize — see header comment for why this pattern is
  // used instead of including field.onResize in the effect dependency array.
  const onResizeRef = useRef(field.onResize);
  // Sync the ref on every render so it always points to the latest callback
  // without being listed as a dep (which would restart the main effect).
  useEffect(() => { onResizeRef.current = field.onResize; });

  /**
   * Main measurement effect — runs whenever `value` changes.
   *
   * Deps: [value] only.
   * Reads from DOM (scrollWidth, scrollHeight) — one reflow per value change,
   * not one per render. Writing style.width / style.height after the read
   * causes a second reflow, but this is unavoidable for autoresize and only
   * happens when the value actually changed.
   */
  useEffect(() => {
    const ta     = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror) return;

    const text = value ?? '';

    // ── Width via hidden mirror ──────────────────────────────────────────
    // white-space:pre on the mirror ensures no line wrapping → scrollWidth
    // reflects the longest line's pixel width.
    // '​' (zero-width space) is appended so the mirror doesn't collapse
    // to 0px when text is empty string.
    mirror.textContent = text + '​';
    const rawW   = mirror.scrollWidth;
    const clampW = Math.min(MAX_TA_W, Math.max(MIN_TA_W, rawW));
    ta.style.width = clampW + 'px';

    // ── Height via scrollHeight ───────────────────────────────────────────
    // Reset to 'auto' first — without this, scrollHeight would always equal
    // the previously-set height, making height never shrink as lines are deleted.
    ta.style.height   = 'auto';
    const rawH        = ta.scrollHeight;
    const clampH      = Math.min(MAX_TA_H, Math.max(MIN_TA_H, rawH));
    ta.style.height   = clampH + 'px';
    // Show scrollbar only when content exceeds the cap — avoids a permanent
    // scrollbar track taking up space on short text.
    ta.style.overflow = rawH > MAX_TA_H ? 'auto' : 'hidden';

    // Report the required total node width back to TextNode.
    // clampW is content width; OUTER_PAD adds body padding and border overhead.
    onResizeRef.current?.(clampW + OUTER_PAD);
  }, [value]);

  return (
    <div style={getFieldRowStyle(disabled)}>
      {/*
        Hidden mirror div — off-screen (position:fixed at -9999px) so it never
        affects document layout. white-space:pre is the key property: without it
        the mirror would wrap text and report a narrow scrollWidth even for wide
        single-line content.

        aria-hidden: screen readers don't need to announce this measurement aid.
        pointerEvents:none: can't be accidentally focused or clicked.
      */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        style={{
          position:    'fixed',
          top:         '-9999px',
          left:        '-9999px',
          visibility:  'hidden',
          whiteSpace:  'pre',        // no line wrapping — gives max-line width
          font:        FONT,         // must match textarea font exactly
          padding:     '4px 8px',    // must match textarea padding exactly
          border:      '1px solid transparent',
          lineHeight:  '1.5',
          pointerEvents: 'none',
        }}
      />

      <label style={getLabelStyle()}>{field.label}</label>
      <textarea
        ref={textareaRef}
        style={{
          ...getInputStyle(),
          fontFamily: typography.fontMono,
          padding:    '4px 8px',         // must match mirror padding exactly
          width:      MIN_TA_W + 'px',   // initial width; overridden by effect
          minHeight:  MIN_TA_H + 'px',
          maxHeight:  MAX_TA_H + 'px',
          lineHeight: '1.5',
          resize:    'none',            // user must not resize manually; breaks mirror sync
          overflow:  'hidden',          // 'auto' set dynamically when past MAX_TA_H
          display:   'block',
        }}
        value={value ?? field.default ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
        spellCheck={false}  // disable spell-check underlines on template variables
      />
    </div>
  );
};

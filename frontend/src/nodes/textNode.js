/**
 * textNode.js — The only node wrapper thicker than one line.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  WHY TextNode IS DIFFERENT FROM ALL OTHER NODE WRAPPERS                  │
 * │                                                                          │
 * │  Every other node (InputNode, OutputNode, LLMNode, …):                  │
 * │    export const FooNode = (props) => <BaseNode {...props} config={…} /> │
 * │                                                                          │
 * │  TextNode needs local state for minWidth because:                        │
 * │    1. The textarea autoresizes as the user types.                        │
 * │    2. The textarea is inside BaseNode's body — it can't set its parent's │
 * │       width directly (child cannot resize its own ancestor DOM node).    │
 * │    3. The node container's minWidth comes from config.minWidth.          │
 * │    4. So TextareaField must report its measured width UP through an      │
 * │       onResize callback → TextNode state → config.minWidth → BaseNode.  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  WIDTH AUTORESIZE DATA FLOW                                              │
 * │                                                                          │
 * │  User types a long line in the textarea                                 │
 * │    ↓                                                                     │
 * │  TextareaField measures width via hidden mirror div                     │
 * │    mirror.scrollWidth = 320px                                            │
 * │    ↓                                                                     │
 * │  field.onResize(320 + 36 = 356)   [36px = body padding overhead]        │
 * │    ↓                                                                     │
 * │  onResize(w) in TextNode:                                               │
 * │    next = clamp(356, MIN_WIDTH=240, MAX_WIDTH=520) = 356                │
 * │    prev = 240 (initial) → 356 ≠ 240 → setMinWidth(356)                 │
 * │    ↓                                                                     │
 * │  minWidth state changes → useMemo rebuilds config with minWidth=356     │
 * │    ↓                                                                     │
 * │  BaseNode re-renders with new config.minWidth → container widens        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  INFINITE LOOP PREVENTION — THE useRef PATTERN                          │
 * │                                                                          │
 * │  The danger: if onResize were a new function reference on every render, │
 * │    useMemo would rebuild config → new field.onResize ref →              │
 * │    TextareaField's useEffect sees a new dep → re-runs measurement →     │
 * │    calls onResize again → setMinWidth again → re-render → loop.         │
 * │                                                                          │
 * │  Fix: useCallback with empty deps [] stabilises onResize.               │
 * │    - setMinWidth is from useState and never changes reference.           │
 * │    - The functional update (prev => …) reads latest prev from closure;  │
 * │      no stale-closure risk.                                              │
 * │    - useMemo depends on [minWidth, onResize]: onResize never changes,   │
 * │      so config only rebuilds when minWidth actually changes.            │
 * │    - TextareaField stabilises its OWN ref via onResizeRef (see that     │
 * │      file), but the stability starts here.                              │
 * │                                                                          │
 * │  Guard: `return next === prev ? prev : next` — if the new width clamps  │
 * │  to the same value (e.g. 244 → clamped to 240 again), returning prev   │
 * │  tells React the state didn't change → no re-render triggered.          │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { useState, useCallback, useMemo } from 'react';
import { BaseNode } from './BaseNode';
import { textNodeConfig } from './nodeConfigs';

// Width bounds for the TextNode container.
// MIN_WIDTH matches textNodeConfig.minWidth (the initial value shown before
// any typing). MAX_WIDTH prevents the node from growing too wide for the canvas.
const MIN_WIDTH = 240;
const MAX_WIDTH = 520;

/**
 * TextNode — thin stateful wrapper around BaseNode for the Text template node.
 *
 * Props: forwarded directly from ReactFlow (id, data, selected) — TextNode
 * does not destructure them; it spreads them to BaseNode unchanged.
 *
 * Responsibilities:
 *   1. Track minWidth state (grows as the user types long lines)
 *   2. Provide a stable onResize callback to the textarea field
 *   3. Rebuild config (via useMemo) when minWidth changes, injecting onResize
 *
 * Dynamic handles (computeInputs) come for FREE through the config — BaseNode
 * calls computeInputs on every render without any special code here.
 */
export const TextNode = (props) => {
  // minWidth drives the node container's minimum horizontal size.
  // Starts at MIN_WIDTH; grows when TextareaField reports a wider measurement.
  const [minWidth, setMinWidth] = useState(MIN_WIDTH);

  /**
   * onResize(w) — called by TextareaField after every width measurement.
   *
   * w: the desired total node width (textarea content width + OUTER_PAD).
   * Clamps to [MIN_WIDTH, MAX_WIDTH] and only updates state if the value
   * actually changes (avoids spurious re-renders on every keystroke when
   * the text happens to stay the same width).
   *
   * useCallback([], …) — empty deps because setMinWidth is stable and the
   * functional update form avoids capturing stale state.
   */
  const onResize = useCallback(
    (w) => setMinWidth((prev) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
      return next === prev ? prev : next;
    }),
    []
  );

  /**
   * config — derived config that injects the current minWidth and the stable
   * onResize into the textarea field config.
   *
   * Why spread textNodeConfig.fields[0] rather than mutating it?
   *   textNodeConfig is a module-level constant shared across all TextNode
   *   instances. Mutating it would affect every TextNode on the canvas.
   *   Spreading creates a new object per instance, safely isolated.
   *
   * useMemo deps [minWidth, onResize]:
   *   - minWidth changes → config.minWidth must update → rebuild
   *   - onResize is stable (empty useCallback) → never triggers rebuild alone
   */
  const config = useMemo(
    () => ({
      ...textNodeConfig,
      minWidth,
      fields: [{ ...textNodeConfig.fields[0], onResize }],
    }),
    [minWidth, onResize]
  );

  // All ReactFlow props (id, data, selected) pass through unchanged.
  return <BaseNode {...props} config={config} />;
};

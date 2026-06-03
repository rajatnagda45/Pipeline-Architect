/**
 * Node Config Schema
 * ──────────────────
 * Every node config MUST conform to this shape. BaseNode reads it; no node
 * file is allowed to diverge from the contract or reach into DOM styling.
 *
 * @typedef {object} HandleDef
 * @property {string}  id        — unique within this node (e.g. 'prompt')
 * @property {string}  label     — short display label (e.g. 'Prompt')
 * @property {string} [dataType] — semantic type hint shown in the tooltip
 * @property {number} [maxConnections] — default 1 for inputs; unlimited for outputs
 *
 * @typedef {object} FieldDef
 * @property {string}  name     — key in node.data
 * @property {string}  label    — displayed above the control
 * @property {'text'|'select'|'number'|'slider'|'textarea'|'toggle'} kind
 * @property {*}       default  — used when node.data has no value yet
 * @property {string[]|undefined} options  — required for 'select'
 * @property {number|undefined}   min/max/step — for 'number' and 'slider'
 * @property {boolean|((data:object)=>boolean)|undefined} disabled — opt-in
 *
 * @typedef {object} NodeConfig
 * @property {string}   type      — unique node type string, matches nodeTypes key in ui.js
 * @property {string}   title     — header label; MUST match the toolbar chip label for visual parity
 * @property {string}   icon      — Material Symbols name; MUST match the toolbar chip icon
 * @property {'input'|'processing'|'ai'|'output'|'utility'} category
 * @property {string}   color     — derived from categoryColors[category]; MUST match toolbar chip color
 * @property {FieldDef[]} fields
 * @property {HandleDef[]|((data:object)=>HandleDef[])} inputs
 *   — Array for static handles; function for data-driven handles (e.g. TextNode).
 *   This is the seam that lets TextNode derive handles from {{variables}} without
 *   BaseNode needing to know anything special about TextNode.
 * @property {HandleDef[]|((data:object)=>HandleDef[])} outputs
 * @property {number} [minWidth]   — px; computed from geometry in this file
 * @property {number} [minHeight]  — px; computed from field count × 50px
 * @property {string} [description] — faint helper text in the node body
 * @property {string} [badge]       — overrides the auto "TYPE-01" badge
 * @property {((data:object)=>string|null)|undefined} validate
 *   — Returns an error string (shown as a floating badge) or null.
 */

import { parseVariables } from '../lib/parseVariables';
import { categoryColors } from '../styles/theme';

// ── Category → accent color lookup ─────────────────────────────────────────────
// Imported by toolbar, palette, minimap, and canvas context menu so every
// surface that renders a node chip stays in sync — one token change propagates.
export const nodeColorMap = {
  customInput:  categoryColors.input,
  customOutput: categoryColors.output,
  llm:          categoryColors.ai,
  text:         categoryColors.processing,
  filter:       categoryColors.processing,
  math:         categoryColors.utility,
  api:          categoryColors.utility,
  delay:        categoryColors.utility,
  note:         categoryColors.utility,
};

// ── Sizing constants ────────────────────────────────────────────────────────────
//
// minWidth geometry (see getBodyStyle in nodeStyles.js):
//   HANDLE_PAD (70) on sides with handle labels + BASE_PAD (12) on open sides
//   + 2px border + at least 120px for field content
//
//   Both handles : 2 + 70 + 120 + 70 = 262  → NODE_W_BOTH  = 264
//   One handle   : 2 + 70 + 160 + 12 = 244  → NODE_W_ONE   = 244
//   No handles   : 2 + 12 + 200 + 12 = 226  → NODE_W_NONE  = 240 (textarea nodes)
//
// minHeight geometry:
//   HEADER (36) + body-padding (24) + Σ field-rows
//   Each field row ≈ 50px (label 10 + gap 5 + input 28 + inter-row gap 8)
//   Toggle row  ≈ 30px (horizontal layout)
//   Description ≈ 56px (3 wrapped lines + padding in descriptionStyle)
//   Handle slots: slotCount × 38 + HEADER (36) + 20

const NODE_W_BOTH = 264;  // nodes with left AND right handles
const NODE_W_ONE  = 244;  // nodes with only left OR only right handles
const NODE_W_NONE = 240;  // nodes with no body-level handles (textarea nodes)

// ── Node configs ────────────────────────────────────────────────────────────────
//
// PARITY RULE: title + icon + color in every config MUST exactly match the
// corresponding entry in toolbar.js CATEGORIES. Enforced by inspection below.
//
//   Config title   ←→   Toolbar label
//   Config icon    ←→   Toolbar icon (same Material Symbols name)
//   Config color   ←→   nodeColorMap[type] used in toolbar (same object)

// Input — declares the pipeline's named ingress variable; inputType lets
// downstream nodes know whether to expect text or binary content.
export const inputNodeConfig = {
  type:     'customInput',
  title:    'Input',           // toolbar: 'Input'   ✓
  category: 'input',
  color:    categoryColors.input,
  icon:     'login',           // toolbar: 'login'   ✓
  fields: [
    { name: 'inputName', label: 'Name', kind: 'text',   default: 'input' },
    { name: 'inputType', label: 'Type', kind: 'select', default: 'Text', options: ['Text', 'File'] },
  ],
  inputs:    [],
  outputs:   [{ id: 'value', label: 'Value', dataType: 'any' }],
  minWidth:  NODE_W_ONE,
  minHeight: 160,
};

// Output — collects a named pipeline result; mirrors Input symmetrically so
// every pipeline has explicit, visible ingress and egress points.
export const outputNodeConfig = {
  type:     'customOutput',
  title:    'Output',          // toolbar: 'Output'  ✓
  category: 'output',
  color:    categoryColors.output,
  icon:     'logout',          // toolbar: 'logout'  ✓
  fields: [
    { name: 'outputName', label: 'Name', kind: 'text',   default: 'output' },
    { name: 'outputType', label: 'Type', kind: 'select', default: 'Text', options: ['Text', 'Image'] },
  ],
  inputs:    [{ id: 'value', label: 'Value', dataType: 'any' }],
  outputs:   [],
  minWidth:  NODE_W_ONE,
  minHeight: 160,
};

// LLM — splits the standard chat-model context into system and user-prompt
// inputs; Streaming toggle exercises ToggleField without adding UI overhead.
export const llmNodeConfig = {
  type:     'llm',
  title:    'LLM',             // toolbar: 'LLM'     ✓
  category: 'ai',
  color:    categoryColors.ai,
  icon:     'psychology',      // toolbar: 'psychology' ✓
  fields: [
    { name: 'streaming', label: 'Streaming', kind: 'toggle', default: false },
  ],
  description: 'Connect system prompt and user prompt. Use top/bottom handles for vertical layouts.',
  inputs:  [
    { id: 'system', label: 'System', dataType: 'string' },
    { id: 'prompt', label: 'Prompt', dataType: 'string' },
  ],
  outputs: [{ id: 'response', label: 'Response', dataType: 'string' }],
  minWidth:  NODE_W_BOTH,
  minHeight: 150,
};

// Text — the only node whose handle count changes at runtime: each {{variable}}
// token in the textarea becomes a left-side input handle via the function form
// of `inputs`, with no special-casing in BaseNode.
export const textNodeConfig = {
  type:     'text',
  title:    'Text',            // toolbar: 'Text'    ✓
  category: 'processing',
  color:    categoryColors.processing,
  icon:     'description',     // toolbar: 'description' ✓
  fields: [
    { name: 'text', label: 'Text', kind: 'textarea', default: '{{input}}' },
  ],
  inputs: (data) => {
    const vars = parseVariables(data?.text || '');
    return vars.map((v) => ({ id: v, label: v, dataType: 'string' }));
  },
  outputs:   [{ id: 'output', label: 'Output', dataType: 'string' }],
  minWidth:  NODE_W_BOTH,
  minHeight: 120,
};

// Filter — exposes two outputs (pass and fail) to demonstrate multi-output
// routing; a pipeline can branch here without duplicating upstream nodes.
export const filterNodeConfig = {
  type:     'filter',
  title:    'Filter',          // toolbar: 'Filter'  ✓
  category: 'processing',
  color:    categoryColors.processing,
  icon:     'filter_alt',      // toolbar: 'filter_alt' ✓
  fields: [
    { name: 'condition', label: 'Condition', kind: 'text',   default: '' },
    { name: 'mode',      label: 'Mode',      kind: 'select', default: 'keep', options: ['keep', 'drop'] },
  ],
  inputs:  [{ id: 'in',   label: 'In',   dataType: 'any' }],
  outputs: [
    { id: 'pass', label: 'Pass', dataType: 'any' },
    { id: 'fail', label: 'Fail', dataType: 'any' },
  ],
  minWidth:  NODE_W_BOTH,
  minHeight: 164,
};

// Math — single-operand arithmetic (A op constant B) keeps the node focused
// while proving that NumberField and SelectField compose naturally in one body.
export const mathNodeConfig = {
  type:     'math',
  title:    'Math',            // toolbar: 'Math'    ✓
  category: 'utility',
  color:    categoryColors.utility,
  icon:     'calculate',       // toolbar: 'calculate' ✓
  fields: [
    { name: 'operation', label: 'Operation', kind: 'select', default: 'add', options: ['add', 'subtract', 'multiply', 'divide'] },
    { name: 'operand',   label: 'Operand B', kind: 'number', default: 1 },
  ],
  inputs:  [{ id: 'a',      label: 'A',      dataType: 'number' }],
  outputs: [{ id: 'result', label: 'Result', dataType: 'number' }],
  minWidth:  NODE_W_BOTH,
  minHeight: 160,
};

// API — HTTP fetch node; Error output is intentionally separate from Response
// so callers can route failures without inline null-checks in downstream nodes.
export const apiNodeConfig = {
  type:     'api',
  title:    'API',             // toolbar: 'API'     ✓  (was 'API Call' — aligned to toolbar)
  category: 'utility',
  color:    categoryColors.utility,
  icon:     'api',             // toolbar: 'api'     ✓
  fields: [
    { name: 'url',    label: 'URL',    kind: 'text',   default: 'https://' },
    { name: 'method', label: 'Method', kind: 'select', default: 'GET', options: ['GET', 'POST', 'PUT', 'DELETE'] },
  ],
  inputs:  [{ id: 'body',     label: 'Body',     dataType: 'any' }],
  outputs: [
    { id: 'response', label: 'Response', dataType: 'any' },
    { id: 'error',    label: 'Error',    dataType: 'string' },
  ],
  minWidth:  NODE_W_BOTH,
  minHeight: 164,
};

// Delay — rate-limits the pipeline stream; the 0–10 000 ms slider is the
// only range field in the demo, exercising SliderField and its CSS fill-track.
export const delayNodeConfig = {
  type:     'delay',
  title:    'Delay',           // toolbar: 'Delay'   ✓
  category: 'utility',
  color:    categoryColors.utility,
  icon:     'timer',           // toolbar: 'timer'   ✓
  fields: [
    { name: 'duration', label: 'Duration (ms)', kind: 'slider', default: 1000, min: 0, max: 10000, step: 100 },
  ],
  inputs:  [{ id: 'in',  label: 'In',  dataType: 'any' }],
  outputs: [{ id: 'out', label: 'Out', dataType: 'any' }],
  minWidth:  NODE_W_BOTH,
  minHeight: 120,
};

// Note — canvas annotation with no handles and no data flow; proves that a
// zero-handle node still renders correctly through the shared BaseNode path.
export const noteNodeConfig = {
  type:     'note',
  title:    'Note',            // toolbar: 'Note'    ✓
  category: 'utility',
  color:    categoryColors.utility,
  icon:     'sticky_note_2',   // toolbar: 'sticky_note_2' ✓
  fields: [
    { name: 'content', label: 'Content', kind: 'textarea', default: 'Add notes here...' },
  ],
  inputs:   [],
  outputs:  [],
  minWidth:  NODE_W_NONE,
  minHeight: 100,
};

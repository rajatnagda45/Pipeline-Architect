/**
 * parseVariables.js — Extracts {{ variable }} references from template strings.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  USE CASE: LIVE HANDLE GENERATION IN TextNode                           │
 * │                                                                          │
 * │  Called by textNodeConfig.computeInputs(data) on every TextNode render. │
 * │                                                                          │
 * │  Input text:  "Hello {{name}}, your topic is {{topic}} and {{name}}"    │
 * │  Output:      ['name', 'topic']   (deduplicated, insertion-order)       │
 * │                                                                          │
 * │  These strings become HandleConfig ids:                                  │
 * │    [{ id: 'name', label: 'name' }, { id: 'topic', label: 'topic' }]    │
 * │  → BaseNode renders 2 left-edge Handle components                       │
 * │  → User sees 2 labeled circles on the TextNode's left edge              │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  REGEX ANATOMY: /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g           │
 * │                                                                          │
 * │  \{\{              — literal '{{' (braces must be escaped in regex)     │
 * │  \s*               — optional whitespace after '{{' (e.g. '{{ name }}') │
 * │  (                 — start capture group 1                              │
 * │    [a-zA-Z_$]      — FIRST char: letter, underscore, or $ sign         │
 * │                       (matches JS identifier start rules)               │
 * │    [a-zA-Z0-9_$]*  — SUBSEQUENT chars: letter, digit, underscore, $    │
 * │  )                 — end capture group 1                                │
 * │  \s*               — optional whitespace before '}}'                    │
 * │  \}\}              — literal '}}'                                       │
 * │  g                 — global flag: find ALL matches, not just the first  │
 * │                                                                          │
 * │  REJECTED patterns (produce no handle):                                 │
 * │    {{ 123bad }}    — starts with digit, fails [a-zA-Z_$] first char    │
 * │    {{ has space }} — space inside the name, not matched                 │
 * │    {{ }}           — empty, no chars to capture                         │
 * │    {single}        — not double braces                                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  WHY THE REGEX IS CREATED FRESH PER CALL (not a module-level constant) │
 * │                                                                          │
 * │  JavaScript's /g regexes are stateful — they store `lastIndex`.        │
 * │  If the same regex object is reused across calls:                        │
 * │    call 1: regex.exec('{{a}} {{b}}') → finds 'a', lastIndex = 5        │
 * │    regex.lastIndex is now 5 from the previous call                      │
 * │    call 2: regex.exec('{{a}} {{b}}') → starts at index 5, skips 'a'!   │
 * │                                                                          │
 * │  In React (concurrent mode), this function can be called multiple times │
 * │  with different arguments in the same frame. A shared module-level      │
 * │  regex would produce inconsistent, order-dependent results.             │
 * │                                                                          │
 * │  Fix: `const regex = /…/g` inside the function body.                   │
 * │  A new regex object is created per call → lastIndex always starts at 0. │
 * │  Downside: minor garbage collection pressure on every keystroke.        │
 * │  In practice this is negligible — the object is tiny and short-lived.  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * DEDUPLICATION:
 *   A Set is used (not an Array) to deduplicate variable names.
 *   If the user writes '{{name}} {{name}}', only one 'name' handle appears.
 *   Insertion order is preserved by Set (per ES2015 spec), so handles appear
 *   in the order the variables first occur in the text — predictable UX.
 *
 * RETURN TYPE:
 *   string[] — plain JS identifier strings, no wrapping objects.
 *   The caller (textNodeConfig.computeInputs) maps them to HandleConfig objects.
 */

/**
 * parseVariables(text) → string[]
 *
 * USE CASE: extract all unique {{ variable }} names from a template string.
 * Returns variable names in first-occurrence order, deduplicated.
 * Returns [] for null, undefined, empty string, or no valid {{ }} patterns.
 *
 * @param {string} text — the template string (e.g. from a TextNode textarea)
 * @returns {string[]} — unique JS identifier names found inside {{ }}
 */
export function parseVariables(text) {
  if (!text) return [];

  // Fresh regex per call — avoids shared lastIndex state across invocations.
  const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
  const seen = new Set();
  let match;

  // regex.exec(text) with a /g regex advances lastIndex after each match.
  // The while loop continues until exec returns null (no more matches).
  while ((match = regex.exec(text)) !== null) {
    seen.add(match[1]); // match[1] = the captured identifier inside {{ }}
  }

  return Array.from(seen); // preserve insertion order (Set → Array)
}

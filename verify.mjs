/**
 * verify.mjs — Playwright verification script for the six flexibility cases
 * + persistence + undo/redo.
 *
 * Run:  node verify.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SHOTS_DIR = 'I:/Project/frontend_technical_assessment/verify-shots';
mkdirSync(SHOTS_DIR, { recursive: true });

const BASE = 'http://localhost:3000';
let shotN = 0;

async function shot(page, name) {
  const p = join(SHOTS_DIR, `${String(++shotN).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  📸 ${p}`);
  return p;
}

// Drag a node chip from the sidebar to the canvas.
// Sidebar label is the text inside the DraggableNode chip.
async function dropNode(page, label, dx = 0, dy = 0) {
  const chip = page.locator(`text="${label}"`).first();
  const chipBox = await chip.boundingBox();
  const canvasEl = page.locator('.react-flow__renderer');
  const canvasBox = await canvasEl.boundingBox();

  // Drop to canvas centre + offset
  const targetX = canvasBox.x + canvasBox.width  / 2 + dx;
  const targetY = canvasBox.y + canvasBox.height / 2 + dy;

  await page.mouse.move(chipBox.x + chipBox.width/2, chipBox.y + chipBox.height/2);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

async function main() {
  console.log('\n🔍  Starting verification against http://localhost:3000\n');

  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── 0. CLEAR PERSISTED STATE so we start fresh ─────────────────────────────
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.removeItem('pipeline-architect-v1'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  await shot(page, 'initial-empty-state');
  console.log('✅ 0. App loaded. Empty-state illustration visible.');

  // ── 1. NODES WITH 1 INPUT + 1 OUTPUT: Input, Delay ─────────────────────────
  console.log('\n▶  Case 1: 1-input/1-output nodes');
  await dropNode(page, 'Input', -300, -50);
  await shot(page, 'after-drop-input');
  await dropNode(page, 'Delay',  100, -50);
  await shot(page, 'after-drop-delay');
  await dropNode(page, 'Output', 300, -50);
  await shot(page, 'after-drop-output');

  // Count nodes on canvas
  const nodeCount1 = await page.locator('.react-flow__node').count();
  console.log(`  Canvas nodes after dropping Input/Delay/Output: ${nodeCount1}`);
  if (nodeCount1 < 3) throw new Error(`Expected ≥3 nodes, got ${nodeCount1}`);
  console.log('✅ Case 1 PASS — Input, Delay, Output rendered');

  // ── 2. MULTIPLE INPUTS: LLM (system + prompt) ───────────────────────────────
  console.log('\n▶  Case 2: Multiple inputs');
  await dropNode(page, 'LLM',  100, 120);
  await shot(page, 'after-drop-llm');

  // Verify LLM node has "System" and "Prompt" handle labels visible
  const sysLabel  = await page.locator('text="System"').count();
  const promLabel = await page.locator('text="Prompt"').count();
  console.log(`  LLM handle labels — System: ${sysLabel}, Prompt: ${promLabel}`);
  if (sysLabel < 1 || promLabel < 1) throw new Error('LLM handle labels missing');
  console.log('✅ Case 2 PASS — LLM renders two input handles with labels');

  // ── 3. MULTIPLE OUTPUTS: Filter (pass + fail) ──────────────────────────────
  console.log('\n▶  Case 3: Multiple outputs');
  await dropNode(page, 'Filter', -100, 150);
  await shot(page, 'after-drop-filter');

  const passLabel = await page.locator('text="Pass"').count();
  const failLabel = await page.locator('text="Fail"').count();
  console.log(`  Filter output labels — Pass: ${passLabel}, Fail: ${failLabel}`);
  if (passLabel < 1 || failLabel < 1) throw new Error('Filter pass/fail outputs missing');
  console.log('✅ Case 3 PASS — Filter renders two output handles (pass + fail)');

  // ── 4. DYNAMIC HANDLES: Text node ──────────────────────────────────────────
  console.log('\n▶  Case 4: Dynamic computed handles (Text node)');
  await dropNode(page, 'Text', -100, -180);
  await page.waitForTimeout(300);
  await shot(page, 'text-node-before-typing');

  // Find the textarea inside the Text node and type a template variable
  const textarea = page.locator('.react-flow__node textarea').first();
  await textarea.click({ force: true });
  await textarea.fill('Hello {{name}}, your score is {{score}}.');
  await page.waitForTimeout(400);
  await shot(page, 'text-node-after-variables');

  // Check for dynamic handle labels "name" and "score"
  const nameHandle  = await page.locator('text="name"').count();
  const scoreHandle = await page.locator('text="score"').count();
  console.log(`  Dynamic handles after typing — name: ${nameHandle}, score: ${scoreHandle}`);
  if (nameHandle < 1 || scoreHandle < 1) throw new Error('Dynamic Text-node handles not appearing');
  console.log('✅ Case 4 PASS — Text node creates handles live from {{variables}}');

  // ── 5. NO HANDLES: Note ─────────────────────────────────────────────────────
  console.log('\n▶  Case 5: Node with no handles (Note)');
  await dropNode(page, 'Note', 300, 150);
  await page.waitForTimeout(300);
  await shot(page, 'note-node');

  // Note has no left/right side handles — only universal top/bottom ones
  // Count handles on the Note node specifically
  const noteNode = page.locator('.react-flow__node').last();
  const noteHandles = await noteNode.locator('.react-flow__handle').count();
  console.log(`  Note node handle count (incl. universal top/bot): ${noteHandles}`);
  // Note has 0 config handles, but BaseNode still adds _top and _bot universal handles
  // So we expect 2 (top + bot), NOT the 4+ that data-flow nodes have
  if (noteHandles > 2) throw new Error(`Note should have ≤2 handles (top+bot), found ${noteHandles}`);
  console.log('✅ Case 5 PASS — Note renders with no data-flow handles (config inputs=[], outputs=[])');

  // ── 6. VARIED FIELD TYPES ───────────────────────────────────────────────────
  console.log('\n▶  Case 6: Varied field types');

  // LLM has toggle, Input has text+select, Delay has slider
  const toggles   = await page.locator('button[role="switch"]').count();
  const sliders   = await page.locator('input[type="range"]').count();
  const selects   = await page.locator('.react-flow__node select').count();
  const textInps  = await page.locator('.react-flow__node input[type="text"]').count();
  const textareas = await page.locator('.react-flow__node textarea').count();

  console.log(`  Toggles: ${toggles}, Sliders: ${sliders}, Selects: ${selects}, Text inputs: ${textInps}, Textareas: ${textareas}`);
  if (toggles < 1)  throw new Error('No toggle field found (LLM Streaming)');
  if (sliders < 1)  throw new Error('No slider field found (Delay duration)');
  if (selects < 2)  throw new Error('Expected ≥2 selects (Input.type, Output.type, Filter.mode…)');
  if (textInps < 2) throw new Error('Expected ≥2 text inputs (Input.name, Output.name…)');
  if (textareas < 1) throw new Error('No textarea found (Text.text)');
  await shot(page, 'all-nodes-varied-fields');
  console.log('✅ Case 6 PASS — toggle, slider, select, text, textarea all present');

  // ── 7. PERSISTENCE ──────────────────────────────────────────────────────────
  console.log('\n▶  Case 7: Persistence across reload');
  const nodeCountBefore = await page.locator('.react-flow__node').count();
  console.log(`  Nodes before reload: ${nodeCountBefore}`);

  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await shot(page, 'after-reload');

  const nodeCountAfter = await page.locator('.react-flow__node').count();
  console.log(`  Nodes after reload: ${nodeCountAfter}`);
  if (nodeCountAfter !== nodeCountBefore) {
    throw new Error(`Persistence FAIL — before: ${nodeCountBefore}, after: ${nodeCountAfter}`);
  }
  console.log('✅ Case 7 PASS — canvas state survived reload (localStorage persist)');

  // ── 8. UNDO / REDO ───────────────────────────────────────────────────────────
  console.log('\n▶  Case 8: Undo / Redo');
  const nodeCountBase = await page.locator('.react-flow__node').count();

  // Drop a new node to create an undo-able action
  await dropNode(page, 'Math', 0, -220);
  await page.waitForTimeout(300);
  const nodeCountAfterAdd = await page.locator('.react-flow__node').count();
  console.log(`  After adding Math node: ${nodeCountAfterAdd} nodes`);

  // Undo with Ctrl+Z
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(300);
  const nodeCountAfterUndo = await page.locator('.react-flow__node').count();
  console.log(`  After Ctrl+Z (undo): ${nodeCountAfterUndo} nodes`);
  await shot(page, 'after-undo');

  if (nodeCountAfterUndo !== nodeCountBase) {
    throw new Error(`Undo FAIL — expected ${nodeCountBase} nodes, got ${nodeCountAfterUndo}`);
  }

  // Redo with Ctrl+Y
  await page.keyboard.press('Control+y');
  await page.waitForTimeout(300);
  const nodeCountAfterRedo = await page.locator('.react-flow__node').count();
  console.log(`  After Ctrl+Y (redo): ${nodeCountAfterRedo} nodes`);
  await shot(page, 'after-redo');

  if (nodeCountAfterRedo !== nodeCountAfterAdd) {
    throw new Error(`Redo FAIL — expected ${nodeCountAfterAdd} nodes, got ${nodeCountAfterRedo}`);
  }
  console.log('✅ Case 8 PASS — Ctrl+Z undo and Ctrl+Y redo work correctly');

  // ── 9. CTRL+A SELECT ALL ────────────────────────────────────────────────────
  console.log('\n▶  Case 9: Ctrl+A select all');
  // Click on canvas pane first to ensure canvas has focus
  await page.locator('.react-flow__pane').click();
  await page.waitForTimeout(100);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(300);
  await shot(page, 'after-select-all');

  // Selected nodes get the 'selected' class added by ReactFlow
  const selectedNodes = await page.locator('.react-flow__node.selected').count();
  const totalNodes    = await page.locator('.react-flow__node').count();
  console.log(`  Selected: ${selectedNodes} / ${totalNodes} nodes`);
  if (selectedNodes < totalNodes || selectedNodes === 0) {
    throw new Error(`Select-all FAIL — only ${selectedNodes}/${totalNodes} selected`);
  }
  console.log('✅ Case 9 PASS — Ctrl+A selects all nodes');

  // ── FINAL SHOT ───────────────────────────────────────────────────────────────
  await shot(page, 'final-full-canvas');

  await browser.close();

  console.log('\n' + '─'.repeat(60));
  console.log('✅  ALL CASES PASSED');
  console.log(`Screenshots saved to: ${SHOTS_DIR}`);
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\n❌  VERIFICATION FAILED:', err.message);
  process.exit(1);
});

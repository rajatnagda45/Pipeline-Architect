/**
 * dag_random.spec.js — Senior DAG tester
 *
 * Seeds the Zustand store via localStorage before each test, navigates to /app,
 * clicks Submit Pipeline, and asserts the KPI panel shows the correct result.
 *
 * Scenarios
 * ─────────
 *  S1  Linear chain       A→B→C→D              → valid DAG
 *  S2  Diamond            A→B, A→C, B→D, C→D   → valid DAG
 *  S3  Large random DAG   8 nodes, 8 edges      → valid DAG
 *  S4  Simple cycle       A→B→C→A              → CYCLE
 *  S5  Self-loop          A→A                  → CYCLE
 *  S6  Single node        no edges             → valid DAG
 *  S7  Two disconnected   no cycles            → valid DAG
 *  S8  All 9 node types   wired in sequence    → valid DAG
 *  S9  Deep cycle         cycle 5 levels deep  → CYCLE
 *  S10 Parallel paths     fan-out / fan-in     → valid DAG
 */

const { test, expect } = require('@playwright/test');

// ── Graph builder helpers ─────────────────────────────────────────────────────

const DATA_MAP = {
  customInput:  { inputName: 'input',   inputType: 'Text' },
  customOutput: { outputName: 'output', outputType: 'Text' },
  llm:          { model: 'gpt-4', maxTokens: 512, temperature: 0.7, systemPrompt: '' },
  text:         { text: 'Hello {{name}}' },
  filter:       { condition: 'pass_all', caseSensitive: false, invert: false },
  math:         { operation: 'add', operandB: 1 },
  api:          { url: 'https://api.example.com', method: 'GET', headers: '', body: '' },
  delay:        { delayMs: 100, jitterMs: 0 },
  note:         { content: 'A note', pinned: false },
};

function node(id, type, x, y) {
  return { id, type, position: { x, y }, data: DATA_MAP[type] ?? {}, selected: false, dragging: false };
}

function edge(id, src, tgt) {
  return {
    id, source: src, target: tgt,
    sourceHandle: `${src}-output-0`,
    targetHandle: `${tgt}-input-0`,
    type: 'default', animated: false,
    style: { stroke: '#bd93f9', strokeWidth: 1.5 },
  };
}

function seed(nodes, edges) {
  return JSON.stringify({ state: { nodes, edges, nodeIDs: {} }, version: 0 });
}

// ── Scenario definitions ──────────────────────────────────────────────────────

const SCENARIOS = [
  {
    name: 'S1: Linear chain A→B→C→D',
    expectDAG: true,
    nodes: [node('n1','customInput',100,100), node('n2','text',350,100), node('n3','llm',600,100), node('n4','customOutput',850,100)],
    edges: [edge('e1','n1','n2'), edge('e2','n2','n3'), edge('e3','n3','n4')],
  },
  {
    name: 'S2: Diamond A→B, A→C, B→D, C→D',
    expectDAG: true,
    nodes: [node('n1','customInput',300,50), node('n2','filter',100,250), node('n3','math',500,250), node('n4','customOutput',300,450)],
    edges: [edge('e1','n1','n2'), edge('e2','n1','n3'), edge('e3','n2','n4'), edge('e4','n3','n4')],
  },
  {
    name: 'S3: Large random 8-node DAG (all node types)',
    expectDAG: true,
    nodes: [
      node('r1','customInput', 50, 100), node('r2','text',    300, 50),
      node('r3','filter',      300, 200), node('r4','llm',   550, 100),
      node('r5','math',        550, 300), node('r6','api',   800, 100),
      node('r7','delay',       800, 300), node('r8','customOutput',1050,200),
    ],
    edges: [
      edge('re1','r1','r2'), edge('re2','r1','r3'), edge('re3','r2','r4'),
      edge('re4','r3','r5'), edge('re5','r4','r6'), edge('re6','r5','r7'),
      edge('re7','r6','r8'), edge('re8','r7','r8'),
    ],
  },
  {
    name: 'S4: Simple cycle A→B→C→A  (should detect CYCLE)',
    expectDAG: false,
    nodes: [node('c1','customInput',100,100), node('c2','llm',350,100), node('c3','customOutput',600,100)],
    edges: [edge('ce1','c1','c2'), edge('ce2','c2','c3'), edge('ce3','c3','c1')],
  },
  {
    name: 'S5: Self-loop A→A  (should detect CYCLE)',
    expectDAG: false,
    nodes: [node('s1','llm',300,200)],
    edges: [edge('se1','s1','s1')],
  },
  {
    name: 'S6: Single node, no edges (trivial valid DAG)',
    expectDAG: true,
    nodes: [node('solo','customInput',300,300)],
    edges: [],
  },
  {
    name: 'S7: Two disconnected sub-graphs, no cycles',
    expectDAG: true,
    nodes: [node('d1','customInput',100,100), node('d2','text',350,100), node('d3','llm',700,100), node('d4','customOutput',950,100)],
    edges: [edge('de1','d1','d2'), edge('de2','d3','d4')],
  },
  {
    name: 'S8: All 9 node types wired in sequence',
    expectDAG: true,
    nodes: [
      node('a1','customInput',50,200),  node('a2','text',250,200),   node('a3','llm',450,200),
      node('a4','filter',650,200),       node('a5','math',850,200),   node('a6','api',1050,200),
      node('a7','delay',1250,200),       node('a8','note',1450,100),  node('a9','customOutput',1450,300),
    ],
    edges: [
      edge('ae1','a1','a2'), edge('ae2','a2','a3'), edge('ae3','a3','a4'),
      edge('ae4','a4','a5'), edge('ae5','a5','a6'), edge('ae6','a6','a7'),
      edge('ae7','a7','a9'), edge('ae8','a8','a9'),
    ],
  },
  {
    name: 'S9: Deep cycle 5 levels deep  (should detect CYCLE)',
    expectDAG: false,
    nodes: [
      node('x1','customInput',100,200), node('x2','text',300,200), node('x3','llm',500,200),
      node('x4','filter',700,200),       node('x5','math',900,200),
    ],
    edges: [
      edge('xe1','x1','x2'), edge('xe2','x2','x3'), edge('xe3','x3','x4'),
      edge('xe4','x4','x5'), edge('xe5','x5','x2'),  // cycle: x5 → x2
    ],
  },
  {
    name: 'S10: Fan-out / fan-in (parallel paths, valid DAG)',
    expectDAG: true,
    nodes: [
      node('p1','customInput',100,300),
      node('p2','text',350,100),  node('p3','text',350,300),  node('p4','text',350,500),
      node('p5','llm',600,100),   node('p6','llm',600,300),   node('p7','llm',600,500),
      node('p8','customOutput',850,300),
    ],
    edges: [
      edge('pe1','p1','p2'), edge('pe2','p1','p3'), edge('pe3','p1','p4'),
      edge('pe4','p2','p5'), edge('pe5','p3','p6'), edge('pe6','p4','p7'),
      edge('pe7','p5','p8'), edge('pe8','p6','p8'), edge('pe9','p7','p8'),
    ],
  },
];

// ── Shared test logic ─────────────────────────────────────────────────────────

async function runDAGScenario(page, scenario) {
  // Seed store via localStorage before the app boots
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key: 'pipeline-architect-v1', value: seed(scenario.nodes, scenario.edges) });

  await page.goto('/app');
  await page.waitForSelector('.react-flow__pane', { timeout: 12000 });

  // Confirm the seeded node count appears in the submit button label
  const btnText = await page.locator('button', { hasText: /Submit Pipeline/i }).innerText();
  expect(btnText).toMatch(new RegExp(`${scenario.nodes.length}N`));

  // Submit
  await page.click('button:has-text("Submit Pipeline")');

  // Wait for the KPI panel (Valid DAG or Cycle badge)
  await page.waitForFunction(
    () => document.body.innerText.includes('Valid DAG') || document.body.innerText.includes('Cycle'),
    { timeout: 10000 }
  );

  const bodyText = await page.evaluate(() => document.body.innerText);
  return {
    isDAG:   bodyText.includes('Valid DAG'),
    isCycle: bodyText.includes('Cycle'),
    bodyText,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('DAG Validation — random & crafted graphs', () => {
  for (const scenario of SCENARIOS) {
    test(scenario.name, async ({ page }) => {
      const result = await runDAGScenario(page, scenario);

      if (scenario.expectDAG) {
        expect(result.isDAG, `Expected valid DAG for: ${scenario.name}`).toBe(true);
      } else {
        expect(result.isCycle, `Expected cycle detection for: ${scenario.name}`).toBe(true);
      }
    });
  }
});

// ── Additional focused assertions ─────────────────────────────────────────────

test.describe('DAG KPI panel detail checks', () => {
  test('S1 linear: shows correct node and edge counts', async ({ page }) => {
    const sc = SCENARIOS[0]; // S1: 4 nodes, 3 edges
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value),
      { key: 'pipeline-architect-v1', value: seed(sc.nodes, sc.edges) });

    await page.goto('/app');
    await page.waitForSelector('.react-flow__pane', { timeout: 12000 });
    await page.click('button:has-text("Submit Pipeline")');
    await page.waitForFunction(() => document.body.innerText.includes('Valid DAG'), { timeout: 10000 });

    // Active Nodes KPI shows 04, Logic Edges shows 03 (zero-padded inside the KPI panel)
    await expect(page.locator('span', { hasText: /^04$/ }).first()).toBeVisible();
    await expect(page.locator('span', { hasText: /^03$/ }).first()).toBeVisible();
  });

  test('S4 cycle: shows warning message', async ({ page }) => {
    const sc = SCENARIOS[3]; // S4: cycle
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value),
      { key: 'pipeline-architect-v1', value: seed(sc.nodes, sc.edges) });

    await page.goto('/app');
    await page.waitForSelector('.react-flow__pane', { timeout: 12000 });
    await page.click('button:has-text("Submit Pipeline")');
    await page.waitForFunction(() => document.body.innerText.includes('Cycle'), { timeout: 10000 });

    await expect(page.getByText(/Pipeline contains a cycle/i)).toBeVisible();
    await expect(page.getByText(/Continue Editing/i)).toBeVisible();
  });

  test('Submit button shows live node/edge count before submit', async ({ page }) => {
    const sc = SCENARIOS[6]; // S7: 4 nodes, 2 edges (disconnected)
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value),
      { key: 'pipeline-architect-v1', value: seed(sc.nodes, sc.edges) });

    await page.goto('/app');
    await page.waitForSelector('.react-flow__pane', { timeout: 12000 });

    const btn = page.locator('button', { hasText: /Submit Pipeline/i });
    await expect(btn).toContainText('4N');
    await expect(btn).toContainText('2E');
  });

  test('Panel closes when "Continue Editing" is clicked', async ({ page }) => {
    const sc = SCENARIOS[3]; // S4: cycle
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value),
      { key: 'pipeline-architect-v1', value: seed(sc.nodes, sc.edges) });

    await page.goto('/app');
    await page.waitForSelector('.react-flow__pane', { timeout: 12000 });
    await page.click('button:has-text("Submit Pipeline")');
    await page.waitForFunction(() => document.body.innerText.includes('Cycle'), { timeout: 10000 });

    await page.click('button:has-text("Continue Editing")');
    await expect(page.getByText(/Cycle/)).not.toBeVisible({ timeout: 3000 });
  });
});

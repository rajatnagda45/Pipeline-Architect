/**
 * @jest-environment node
 */
/**
 * dag_e2e.test.js  — Senior DAG tester: end-to-end pipeline validation
 *
 * Strategy
 * ────────
 * 1. Seed localStorage with a crafted graph before the page loads
 *    (key: 'pipeline-architect-v1', same as the Zustand persist key).
 * 2. Navigate to /app.  The store rehydrates from localStorage immediately.
 * 3. Click "Submit Pipeline" and read the KPI panel.
 * 4. Assert the backend's response matches the expected outcome.
 *
 * Covered scenarios
 * ─────────────────
 *  S1 Linear chain      A→B→C→D      4 nodes, 3 edges  → valid DAG
 *  S2 Diamond           A→B, A→C, B→D, C→D  → valid DAG
 *  S3 Random large      8-node random DAG    → valid DAG
 *  S4 Simple cycle      A→B→C→A     → CYCLE (invalid)
 *  S5 Self-loop         A→A          → CYCLE (invalid)
 *  S6 Single node       just one Input node  → valid DAG
 *  S7 Disconnected      two isolated sub-graphs, no cycles → valid DAG
 *  S8 Mixed node types  Input·LLM·Text·Filter·Math·API·Delay·Output wired → valid
 */

const { chromium } = require('playwright');

// ── Helpers ───────────────────────────────────────────────────────────────────

const APP_URL      = 'http://localhost:3000/app';
const BACKEND_URL  = 'http://localhost:8000/pipelines/parse';
const LS_KEY       = 'pipeline-architect-v1';
const SUBMIT_BTN   = /Submit Pipeline/i;
const TIMEOUT      = 12000;

/** Build a minimal ReactFlow-compatible node. */
function mkNode(id, type, x, y) {
  const dataMap = {
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
  return {
    id,
    type,
    position: { x, y },
    data: dataMap[type] ?? {},
    selected: false,
    dragging: false,
  };
}

/** Build a ReactFlow-compatible edge. */
function mkEdge(id, source, target, sourceHandle, targetHandle) {
  return {
    id,
    source,
    target,
    sourceHandle: sourceHandle ?? `${source}-output-0`,
    targetHandle: targetHandle ?? `${target}-input-0`,
    type: 'default',
    animated: false,
    style: { stroke: '#bd93f9', strokeWidth: 1.5 },
  };
}

/** Serialize and write the graph to localStorage format used by zustand/persist. */
function persistPayload(nodes, edges) {
  return JSON.stringify({
    state:   { nodes, edges, nodeIDs: {} },
    version: 0,
  });
}

/** Launch a browser, seed localStorage, navigate, click Submit, return result. */
async function runScenario(scenario, browser) {
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  // Seed localStorage before the React app boots
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, value);
  }, { key: LS_KEY, value: persistPayload(scenario.nodes, scenario.edges) });

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  await page.waitForSelector('text=/Submit Pipeline/i', { timeout: TIMEOUT });

  // Click submit and wait for the KPI panel to appear
  await page.click('text=/Submit Pipeline/i');

  let result;
  try {
    // Wait for either a valid or cycle badge
    await page.waitForFunction(
      () => {
        const body = document.body.innerText;
        return body.includes('Valid DAG') || body.includes('Cycle') || body.includes('Backend Unreachable');
      },
      { timeout: TIMEOUT }
    );

    const bodyText = await page.evaluate(() => document.body.innerText);
    result = {
      isDAG:          bodyText.includes('Valid DAG'),
      isCycle:        bodyText.includes('Cycle'),
      backendMissing: bodyText.includes('Backend Unreachable'),
      bodyText,
    };
  } catch (e) {
    result = { isDAG: false, isCycle: false, backendMissing: false, timedOut: true };
  }

  await ctx.close();
  return result;
}

// ── Scenario definitions ───────────────────────────────────────────────────────

const SCENARIOS = {
  S1_linear: {
    label: 'S1: Linear chain A→B→C→D (4 nodes, 3 edges)',
    expectDAG: true,
    nodes: [
      mkNode('n1', 'customInput',  100, 100),
      mkNode('n2', 'text',         350, 100),
      mkNode('n3', 'llm',          600, 100),
      mkNode('n4', 'customOutput', 850, 100),
    ],
    edges: [
      mkEdge('e1', 'n1', 'n2'),
      mkEdge('e2', 'n2', 'n3'),
      mkEdge('e3', 'n3', 'n4'),
    ],
  },

  S2_diamond: {
    label: 'S2: Diamond A→B, A→C, B→D, C→D (4 nodes, 4 edges)',
    expectDAG: true,
    nodes: [
      mkNode('n1', 'customInput',  300, 50),
      mkNode('n2', 'filter',        100, 250),
      mkNode('n3', 'math',          500, 250),
      mkNode('n4', 'customOutput',  300, 450),
    ],
    edges: [
      mkEdge('e1', 'n1', 'n2'),
      mkEdge('e2', 'n1', 'n3'),
      mkEdge('e3', 'n2', 'n4'),
      mkEdge('e4', 'n3', 'n4'),
    ],
  },

  S3_random_large: {
    label: 'S3: Random 8-node DAG (all node types, no cycles)',
    expectDAG: true,
    nodes: [
      mkNode('r1', 'customInput',  50,  100),
      mkNode('r2', 'text',         300, 50),
      mkNode('r3', 'filter',       300, 200),
      mkNode('r4', 'llm',          550, 100),
      mkNode('r5', 'math',         550, 300),
      mkNode('r6', 'api',          800, 100),
      mkNode('r7', 'delay',        800, 300),
      mkNode('r8', 'customOutput', 1050, 200),
    ],
    edges: [
      mkEdge('re1', 'r1', 'r2'),
      mkEdge('re2', 'r1', 'r3'),
      mkEdge('re3', 'r2', 'r4'),
      mkEdge('re4', 'r3', 'r5'),
      mkEdge('re5', 'r4', 'r6'),
      mkEdge('re6', 'r5', 'r7'),
      mkEdge('re7', 'r6', 'r8'),
      mkEdge('re8', 'r7', 'r8'),
    ],
  },

  S4_simple_cycle: {
    label: 'S4: Simple cycle A→B→C→A (should FAIL DAG check)',
    expectDAG: false,
    nodes: [
      mkNode('c1', 'customInput',  100, 100),
      mkNode('c2', 'llm',          350, 100),
      mkNode('c3', 'customOutput', 600, 100),
    ],
    edges: [
      mkEdge('ce1', 'c1', 'c2'),
      mkEdge('ce2', 'c2', 'c3'),
      mkEdge('ce3', 'c3', 'c1'),   // ← cycle back to start
    ],
  },

  S5_self_loop: {
    label: 'S5: Self-loop A→A (should FAIL DAG check)',
    expectDAG: false,
    nodes: [
      mkNode('s1', 'llm', 300, 200),
    ],
    edges: [
      mkEdge('se1', 's1', 's1'),   // ← self-loop
    ],
  },

  S6_single_node: {
    label: 'S6: Single node, no edges (valid trivial DAG)',
    expectDAG: true,
    nodes: [
      mkNode('solo', 'customInput', 300, 300),
    ],
    edges: [],
  },

  S7_disconnected: {
    label: 'S7: Two disconnected sub-graphs, no cycles',
    expectDAG: true,
    nodes: [
      mkNode('d1', 'customInput',  100, 100),
      mkNode('d2', 'text',         350, 100),
      mkNode('d3', 'llm',          700, 100),
      mkNode('d4', 'customOutput', 950, 100),
    ],
    edges: [
      mkEdge('de1', 'd1', 'd2'),   // sub-graph 1
      mkEdge('de2', 'd3', 'd4'),   // sub-graph 2 — disconnected from 1
    ],
  },

  S8_all_types: {
    label: 'S8: All 9 node types wired in sequence',
    expectDAG: true,
    nodes: [
      mkNode('a1', 'customInput',  50,  200),
      mkNode('a2', 'text',         250, 200),
      mkNode('a3', 'llm',          450, 200),
      mkNode('a4', 'filter',       650, 200),
      mkNode('a5', 'math',         850, 200),
      mkNode('a6', 'api',          1050, 200),
      mkNode('a7', 'delay',        1250, 200),
      mkNode('a8', 'note',         1450, 100),
      mkNode('a9', 'customOutput', 1450, 300),
    ],
    edges: [
      mkEdge('ae1', 'a1', 'a2'),
      mkEdge('ae2', 'a2', 'a3'),
      mkEdge('ae3', 'a3', 'a4'),
      mkEdge('ae4', 'a4', 'a5'),
      mkEdge('ae5', 'a5', 'a6'),
      mkEdge('ae6', 'a6', 'a7'),
      mkEdge('ae7', 'a7', 'a9'),
      mkEdge('ae8', 'a8', 'a9'),
    ],
  },
};

// ── Test runner ───────────────────────────────────────────────────────────────

async function runAll() {
  const browser = await chromium.launch({ headless: true });
  const results  = [];
  let passed = 0, failed = 0;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        DAG END-TO-END TEST SUITE  (Pipeline Architect)       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  for (const [key, scenario] of Object.entries(SCENARIOS)) {
    process.stdout.write(`  ${scenario.label}\n  → running... `);
    const result = await runScenario(scenario, browser);

    let status, detail;

    if (result.backendMissing) {
      status = 'SKIP'; detail = 'backend not reachable';
    } else if (result.timedOut) {
      status = 'FAIL'; detail = 'timed out waiting for result panel';
      failed++;
    } else if (scenario.expectDAG) {
      if (result.isDAG) { status = 'PASS'; detail = 'valid DAG confirmed'; passed++; }
      else               { status = 'FAIL'; detail = `expected valid DAG but got: cycle=${result.isCycle}`; failed++; }
    } else {
      if (result.isCycle) { status = 'PASS'; detail = 'cycle correctly detected'; passed++; }
      else                { status = 'FAIL'; detail = `expected cycle but got: isDAG=${result.isDAG}`; failed++; }
    }

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${status}  — ${detail}\n`);
    results.push({ key, status, detail, ...result });
  }

  await browser.close();

  console.log('──────────────────────────────────────────────────────────────');
  console.log(`  Total: ${Object.keys(SCENARIOS).length}  |  Passed: ${passed}  |  Failed: ${failed}`);
  console.log('──────────────────────────────────────────────────────────────\n');

  return { passed, failed, results };
}

// ── Jest wrapper ──────────────────────────────────────────────────────────────

describe('DAG E2E — Random & crafted graphs via frontend submit', () => {
  let browser;
  let backendAvailable = false;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });

    // Quick probe: is the backend up?
    try {
      const { default: http } = await import('http');
      backendAvailable = await new Promise((resolve) => {
        const req = http.request(
          { hostname: 'localhost', port: 8000, path: '/docs', method: 'GET', timeout: 2000 },
          (res) => resolve(res.statusCode < 500)
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });
    } catch { backendAvailable = false; }

    if (!backendAvailable) {
      console.warn('\n  ⚠️  Backend not running — tests will be skipped.\n     Start with: uvicorn main:app --reload (in /backend)\n');
    }
  }, 15000);

  afterAll(() => browser?.close());

  // ── One Jest test per scenario ──────────────────────────────────────────────

  for (const [key, scenario] of Object.entries(SCENARIOS)) {
    it(scenario.label, async () => {
      if (!backendAvailable) {
        console.warn(`     SKIP (backend offline)`);
        return;
      }

      const result = await runScenario(scenario, browser);
      expect(result.timedOut).toBeFalsy();
      expect(result.backendMissing).toBeFalsy();

      if (scenario.expectDAG) {
        expect(result.isDAG).toBe(true);
      } else {
        expect(result.isCycle).toBe(true);
      }
    }, 20000);
  }
});

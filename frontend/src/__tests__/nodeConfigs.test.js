import {
  inputNodeConfig,
  outputNodeConfig,
  llmNodeConfig,
  textNodeConfig,
  filterNodeConfig,
  mathNodeConfig,
  apiNodeConfig,
  delayNodeConfig,
  noteNodeConfig,
  nodeColorMap,
} from '../nodes/nodeConfigs';

const ALL_CONFIGS = [
  inputNodeConfig,
  outputNodeConfig,
  llmNodeConfig,
  textNodeConfig,
  filterNodeConfig,
  mathNodeConfig,
  apiNodeConfig,
  delayNodeConfig,
  noteNodeConfig,
];

const VALID_CATEGORIES = ['input', 'output', 'ai', 'processing', 'utility'];
const VALID_FIELD_KINDS = ['text', 'select', 'number', 'slider', 'textarea', 'toggle'];

// ── Contract validation (runs for every config) ───────────────────────────────
describe.each(ALL_CONFIGS.map((c) => [c.type, c]))('nodeConfig: %s', (_, config) => {
  it('has a non-empty type string', () => {
    expect(typeof config.type).toBe('string');
    expect(config.type.length).toBeGreaterThan(0);
  });

  it('has a non-empty title string', () => {
    expect(typeof config.title).toBe('string');
    expect(config.title.length).toBeGreaterThan(0);
  });

  it('has a valid category', () => {
    expect(VALID_CATEGORIES).toContain(config.category);
  });

  it('has a color string', () => {
    expect(typeof config.color).toBe('string');
    expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('has an icon string', () => {
    expect(typeof config.icon).toBe('string');
    expect(config.icon.length).toBeGreaterThan(0);
  });

  it('has a minWidth number', () => {
    expect(typeof config.minWidth).toBe('number');
    expect(config.minWidth).toBeGreaterThan(0);
  });

  it('has a minHeight number', () => {
    expect(typeof config.minHeight).toBe('number');
    expect(config.minHeight).toBeGreaterThan(0);
  });

  it('inputs is an array or function', () => {
    expect(Array.isArray(config.inputs) || typeof config.inputs === 'function').toBe(true);
  });

  it('outputs is an array or function', () => {
    expect(Array.isArray(config.outputs) || typeof config.outputs === 'function').toBe(true);
  });

  it('fields is an array', () => {
    expect(Array.isArray(config.fields)).toBe(true);
  });

  it('every field has a valid kind', () => {
    config.fields.forEach((f) => {
      expect(VALID_FIELD_KINDS).toContain(f.kind);
    });
  });

  it('every field has a name and label', () => {
    config.fields.forEach((f) => {
      expect(typeof f.name).toBe('string');
      expect(typeof f.label).toBe('string');
    });
  });

  it('select fields have options array', () => {
    config.fields.filter((f) => f.kind === 'select').forEach((f) => {
      expect(Array.isArray(f.options)).toBe(true);
      expect(f.options.length).toBeGreaterThan(0);
    });
  });
});

// ── Static handle arrays ──────────────────────────────────────────────────────
describe('inputNodeConfig handles', () => {
  it('has no inputs', () => expect(inputNodeConfig.inputs).toEqual([]));
  it('has one output with id "value"', () => {
    expect(inputNodeConfig.outputs).toHaveLength(1);
    expect(inputNodeConfig.outputs[0].id).toBe('value');
  });
});

describe('outputNodeConfig handles', () => {
  it('has one input with id "value"', () => {
    expect(outputNodeConfig.inputs).toHaveLength(1);
    expect(outputNodeConfig.inputs[0].id).toBe('value');
  });
  it('has no outputs', () => expect(outputNodeConfig.outputs).toEqual([]));
});

describe('llmNodeConfig handles', () => {
  it('has system and prompt inputs', () => {
    const ids = llmNodeConfig.inputs.map((h) => h.id);
    expect(ids).toContain('system');
    expect(ids).toContain('prompt');
  });
  it('has response output', () => {
    expect(llmNodeConfig.outputs[0].id).toBe('response');
  });
});

describe('filterNodeConfig', () => {
  it('has pass and fail outputs', () => {
    const ids = filterNodeConfig.outputs.map((h) => h.id);
    expect(ids).toContain('pass');
    expect(ids).toContain('fail');
  });
});

describe('noteNodeConfig', () => {
  it('has zero handles (canvas annotation)', () => {
    expect(noteNodeConfig.inputs).toEqual([]);
    expect(noteNodeConfig.outputs).toEqual([]);
  });
});

// ── textNodeConfig dynamic inputs ─────────────────────────────────────────────
describe('textNodeConfig.inputs (dynamic)', () => {
  it('is a function', () => {
    expect(typeof textNodeConfig.inputs).toBe('function');
  });

  it('returns [] when data has no text', () => {
    expect(textNodeConfig.inputs({})).toEqual([]);
    expect(textNodeConfig.inputs({ text: '' })).toEqual([]);
  });

  it('returns one handle per unique variable', () => {
    const handles = textNodeConfig.inputs({ text: 'Hello {{name}}, topic: {{topic}}' });
    expect(handles).toHaveLength(2);
    expect(handles[0]).toMatchObject({ id: 'name', label: 'name' });
    expect(handles[1]).toMatchObject({ id: 'topic', label: 'topic' });
  });

  it('deduplicates repeated variables', () => {
    const handles = textNodeConfig.inputs({ text: '{{x}} {{x}} {{y}}' });
    expect(handles).toHaveLength(2);
  });

  it('falls back gracefully when data is null', () => {
    expect(textNodeConfig.inputs(null)).toEqual([]);
  });
});

// ── nodeColorMap ──────────────────────────────────────────────────────────────
describe('nodeColorMap', () => {
  const EXPECTED_TYPES = [
    'customInput', 'customOutput', 'llm', 'text',
    'filter', 'math', 'api', 'delay', 'note',
  ];

  it('has an entry for every node type', () => {
    EXPECTED_TYPES.forEach((t) => {
      expect(nodeColorMap).toHaveProperty(t);
    });
  });

  it('all values are hex colors', () => {
    Object.values(nodeColorMap).forEach((v) => {
      expect(v).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

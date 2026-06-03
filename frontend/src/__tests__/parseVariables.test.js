import { parseVariables } from '../lib/parseVariables';

describe('parseVariables', () => {
  // ── Falsy inputs ────────────────────────────────────────────────────────────
  it('returns [] for null', () => expect(parseVariables(null)).toEqual([]));
  it('returns [] for undefined', () => expect(parseVariables(undefined)).toEqual([]));
  it('returns [] for empty string', () => expect(parseVariables('')).toEqual([]));

  // ── No matches ──────────────────────────────────────────────────────────────
  it('returns [] for plain text with no braces', () => {
    expect(parseVariables('hello world')).toEqual([]);
  });
  it('returns [] for single braces {single}', () => {
    expect(parseVariables('{single}')).toEqual([]);
  });
  it('returns [] for empty double braces {{}}', () => {
    expect(parseVariables('{{}}')).toEqual([]);
  });
  it('returns [] when identifier starts with a digit {{123bad}}', () => {
    expect(parseVariables('{{123bad}}')).toEqual([]);
  });
  it('returns [] when identifier contains a space {{has space}}', () => {
    expect(parseVariables('{{has space}}')).toEqual([]);
  });

  // ── Single match ─────────────────────────────────────────────────────────────
  it('extracts a single variable', () => {
    expect(parseVariables('Hello {{name}}')).toEqual(['name']);
  });
  it('handles whitespace inside braces {{ name }}', () => {
    expect(parseVariables('{{ name }}')).toEqual(['name']);
  });
  it('handles underscore-prefixed identifiers', () => {
    expect(parseVariables('{{_private}}')).toEqual(['_private']);
  });
  it('handles dollar-prefixed identifiers', () => {
    expect(parseVariables('{{$value}}')).toEqual(['$value']);
  });

  // ── Multiple matches ─────────────────────────────────────────────────────────
  it('extracts multiple distinct variables in order', () => {
    expect(parseVariables('{{a}} and {{b}}')).toEqual(['a', 'b']);
  });
  it('deduplicates repeated variable names', () => {
    expect(parseVariables('{{name}} {{name}}')).toEqual(['name']);
  });
  it('deduplicates and preserves first-occurrence order', () => {
    expect(parseVariables('{{z}} {{a}} {{z}}')).toEqual(['z', 'a']);
  });

  // ── Realistic TextNode template ───────────────────────────────────────────────
  it('parses a real template string', () => {
    const text = 'Hello {{name}}, your topic is {{topic}} and {{name}}';
    expect(parseVariables(text)).toEqual(['name', 'topic']);
  });

  // ── Re-entrancy: calling with different strings back-to-back ─────────────────
  it('is stateless — two consecutive calls produce independent results', () => {
    expect(parseVariables('{{a}} {{b}}')).toEqual(['a', 'b']);
    expect(parseVariables('{{x}}')).toEqual(['x']);
  });
});

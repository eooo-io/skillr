import { describe, it, expect } from 'vitest';
import { resolve, extractVariables, getMissing } from './TemplateResolver.js';

describe('resolve', () => {
  it('replaces known variables', () => {
    expect(resolve('Hello {{name}}!', { name: 'World' })).toBe('Hello World!');
  });

  it('replaces multiple occurrences', () => {
    expect(resolve('{{x}} and {{x}}', { x: 'A' })).toBe('A and A');
  });

  it('replaces multiple different variables', () => {
    expect(resolve('{{a}} {{b}}', { a: '1', b: '2' })).toBe('1 2');
  });

  it('leaves unknown variables as-is', () => {
    expect(resolve('Hello {{unknown}}!', {})).toBe('Hello {{unknown}}!');
  });

  it('handles body with no variables', () => {
    expect(resolve('No variables here.', { x: 'unused' })).toBe('No variables here.');
  });

  it('handles empty body', () => {
    expect(resolve('', { x: 'val' })).toBe('');
  });
});

describe('extractVariables', () => {
  it('finds all unique variable names', () => {
    const vars = extractVariables('{{a}} {{b}} {{a}}');
    expect(vars).toContain('a');
    expect(vars).toContain('b');
    expect(vars).toHaveLength(2);
  });

  it('returns empty array when no variables', () => {
    expect(extractVariables('no vars')).toEqual([]);
  });

  it('does not match non-word chars inside braces', () => {
    expect(extractVariables('{{foo-bar}}')).toEqual([]);
  });
});

describe('getMissing', () => {
  it('returns variables with no value', () => {
    expect(getMissing('{{a}} {{b}}', { a: 'val' })).toEqual(['b']);
  });

  it('returns empty when all provided', () => {
    expect(getMissing('{{a}}', { a: 'val' })).toEqual([]);
  });

  it('returns empty when no variables in body', () => {
    expect(getMissing('plain text', {})).toEqual([]);
  });
});

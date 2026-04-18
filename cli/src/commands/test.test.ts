import { describe, it, expect } from 'vitest';
import { detectProvider } from './test.js';

describe('detectProvider', () => {
  it('returns null when nothing resolves', () => {
    expect(detectProvider(undefined, undefined, {})).toBeNull();
  });

  it('honors explicit --provider over everything', () => {
    expect(detectProvider('anthropic', 'gpt-4o', { OPENAI_API_KEY: '1' })).toBe('anthropic');
    expect(detectProvider('openai', 'claude-opus-4-7', { ANTHROPIC_API_KEY: '1' })).toBe('openai');
  });

  it('accepts claude and oai as aliases', () => {
    expect(detectProvider('claude', undefined, {})).toBe('anthropic');
    expect(detectProvider('oai', undefined, {})).toBe('openai');
  });

  it('returns null for an unknown --provider value', () => {
    expect(detectProvider('cohere', 'claude-opus-4-7', {})).toBeNull();
  });

  it('falls back to model prefix when no explicit provider', () => {
    expect(detectProvider(undefined, 'claude-opus-4-7', {})).toBe('anthropic');
    expect(detectProvider(undefined, 'anthropic-foo', {})).toBe('anthropic');
    expect(detectProvider(undefined, 'gpt-4o', {})).toBe('openai');
    expect(detectProvider(undefined, 'o3-mini', {})).toBe('openai');
  });

  it('falls back to env vars when model does not match', () => {
    expect(detectProvider(undefined, 'mystery', { ANTHROPIC_API_KEY: '1' })).toBe('anthropic');
    expect(detectProvider(undefined, 'mystery', { OPENAI_API_KEY: '1' })).toBe('openai');
  });

  it('prefers Anthropic when both env vars set and no other signal', () => {
    expect(
      detectProvider(undefined, undefined, { ANTHROPIC_API_KEY: '1', OPENAI_API_KEY: '1' }),
    ).toBe('anthropic');
  });
});

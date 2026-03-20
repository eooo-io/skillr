import { describe, it, expect } from 'vitest';
import { resolve, validateIncludes } from './SkillCompositionService.js';
import type { ParsedSkill } from '../types.js';

function skill(slug: string, body: string, includes: string[] = []): ParsedSkill {
  return {
    slug,
    body,
    frontmatter: { id: slug, name: slug, includes },
  };
}

describe('resolve', () => {
  it('returns body as-is when no includes', () => {
    const s = skill('a', 'Body A');
    const result = resolve(s, new Map());
    expect(result).toBe('Body A');
  });

  it('prepends included skill bodies', () => {
    const base = skill('base', 'Base instructions.');
    const main = skill('main', 'Main instructions.', ['base']);
    const map = new Map([['base', base], ['main', main]]);

    const result = resolve(main, map);
    expect(result).toContain('Base instructions.');
    expect(result).toContain('Main instructions.');
    // Base should come before main
    expect(result.indexOf('Base')).toBeLessThan(result.indexOf('Main'));
  });

  it('resolves nested includes', () => {
    const a = skill('a', 'A body.');
    const b = skill('b', 'B body.', ['a']);
    const c = skill('c', 'C body.', ['b']);
    const map = new Map([['a', a], ['b', b], ['c', c]]);

    const result = resolve(c, map);
    expect(result).toContain('A body.');
    expect(result).toContain('B body.');
    expect(result).toContain('C body.');
  });

  it('handles missing includes with comment', () => {
    const main = skill('main', 'Main.', ['nonexistent']);
    const result = resolve(main, new Map([['main', main]]));
    expect(result).toContain('<!-- Include not found: nonexistent -->');
    expect(result).toContain('Main.');
  });

  it('handles circular includes with comment', () => {
    const a = skill('a', 'A.', ['b']);
    const b = skill('b', 'B.', ['a']);
    const map = new Map([['a', a], ['b', b]]);

    const result = resolve(a, map);
    expect(result).toContain('<!-- Circular include skipped: a -->');
    expect(result).toContain('B.');
    expect(result).toContain('A.');
  });

  it('respects max depth limit', () => {
    // Create a chain deeper than 5
    const skills: ParsedSkill[] = [];
    for (let i = 0; i <= 7; i++) {
      const includes = i > 0 ? [`s${i - 1}`] : [];
      skills.push(skill(`s${i}`, `Body ${i}.`, includes));
    }
    const map = new Map(skills.map((s) => [s.slug, s]));

    const result = resolve(skills[7], map);
    expect(result).toContain('<!-- Include depth limit exceeded -->');
  });
});

describe('validateIncludes', () => {
  it('returns no errors for valid includes', () => {
    const base = skill('base', 'Base.');
    const main = skill('main', 'Main.', ['base']);
    const map = new Map([['base', base], ['main', main]]);

    expect(validateIncludes(main, map)).toEqual([]);
  });

  it('reports self-include', () => {
    const s = skill('self', 'Body.', ['self']);
    const map = new Map([['self', s]]);

    const errors = validateIncludes(s, map);
    expect(errors).toContain('Skill cannot include itself: self');
  });

  it('reports missing include', () => {
    const s = skill('main', 'Body.', ['ghost']);
    const errors = validateIncludes(s, new Map([['main', s]]));
    expect(errors).toContain('Included skill not found: ghost');
  });

  it('detects circular dependency', () => {
    const a = skill('a', 'A.', ['b']);
    const b = skill('b', 'B.', ['a']);
    const map = new Map([['a', a], ['b', b]]);

    const errors = validateIncludes(a, map);
    expect(errors.some((e) => e.includes('Circular dependency'))).toBe(true);
  });

  it('returns no errors when no includes', () => {
    const s = skill('solo', 'Solo.');
    expect(validateIncludes(s, new Map())).toEqual([]);
  });
});

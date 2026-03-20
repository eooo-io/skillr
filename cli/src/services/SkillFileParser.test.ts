import { describe, it, expect } from 'vitest';
import { parseContent, renderFile, validateFrontmatter, slugify, parseSkillContent } from './SkillFileParser.js';

describe('parseContent', () => {
  it('parses YAML frontmatter and markdown body', () => {
    const content = `---
id: test-skill
name: Test Skill
---

This is the body.`;

    const result = parseContent(content);
    expect(result.frontmatter.id).toBe('test-skill');
    expect(result.frontmatter.name).toBe('Test Skill');
    expect(result.body).toBe('This is the body.');
  });

  it('returns empty frontmatter when no delimiters', () => {
    const content = 'Just a plain body with no frontmatter.';
    const result = parseContent(content);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('Just a plain body with no frontmatter.');
  });

  it('returns empty frontmatter when closing delimiter is missing', () => {
    const content = `---
id: broken
name: Broken

This never closes.`;

    const result = parseContent(content);
    expect(result.frontmatter).toEqual({});
  });

  it('handles frontmatter with arrays and nested fields', () => {
    const content = `---
id: complex
name: Complex Skill
tags: [a, b, c]
template_variables:
  - name: lang
    default: English
---

Body here.`;

    const result = parseContent(content);
    expect(result.frontmatter.tags).toEqual(['a', 'b', 'c']);
    expect(result.frontmatter.template_variables).toEqual([
      { name: 'lang', default: 'English' },
    ]);
    expect(result.body).toBe('Body here.');
  });

  it('handles leading whitespace before frontmatter', () => {
    const content = `
---
id: spaced
name: Spaced
---

Body.`;

    const result = parseContent(content);
    expect(result.frontmatter.id).toBe('spaced');
    expect(result.body).toBe('Body.');
  });

  it('handles empty body after frontmatter', () => {
    const content = `---
id: empty-body
name: Empty Body
---`;

    const result = parseContent(content);
    expect(result.frontmatter.id).toBe('empty-body');
    expect(result.body).toBe('');
  });
});

describe('renderFile', () => {
  it('renders frontmatter and body into a skill file', () => {
    const result = renderFile({ id: 'test', name: 'Test' }, 'Body content.');
    expect(result).toContain('---\n');
    expect(result).toContain('id: test');
    expect(result).toContain('name: Test');
    expect(result).toContain('---\n\nBody content.\n');
  });

  it('roundtrips through parse and render', () => {
    const original = { id: 'roundtrip', name: 'Roundtrip Skill', tags: ['a', 'b'] };
    const body = 'This is the instruction body.';
    const rendered = renderFile(original, body);
    const parsed = parseContent(rendered);
    expect(parsed.frontmatter.id).toBe('roundtrip');
    expect(parsed.frontmatter.name).toBe('Roundtrip Skill');
    expect(parsed.frontmatter.tags).toEqual(['a', 'b']);
    expect(parsed.body).toBe(body);
  });
});

describe('validateFrontmatter', () => {
  it('returns no errors for valid frontmatter', () => {
    expect(validateFrontmatter({ id: 'x', name: 'X' })).toEqual([]);
  });

  it('returns error for missing id', () => {
    const errors = validateFrontmatter({ name: 'X' } as any);
    expect(errors).toContain('Missing required field: id');
  });

  it('returns error for missing name', () => {
    const errors = validateFrontmatter({ id: 'x' } as any);
    expect(errors).toContain('Missing required field: name');
  });

  it('returns both errors when both missing', () => {
    const errors = validateFrontmatter({});
    expect(errors).toHaveLength(2);
  });
});

describe('slugify', () => {
  it('converts to lowercase kebab-case', () => {
    expect(slugify('My Skill Name')).toBe('my-skill-name');
  });

  it('strips special characters', () => {
    expect(slugify('Hello, World! (v2)')).toBe('hello-world-v2');
  });

  it('trims leading and trailing dashes', () => {
    expect(slugify('---test---')).toBe('test');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('collapses multiple separators', () => {
    expect(slugify('a   b___c')).toBe('a-b-c');
  });
});

describe('parseSkillContent', () => {
  it('uses filename as slug (without .md)', () => {
    const content = `---
id: my-skill
name: My Skill
---

Body.`;

    const result = parseSkillContent(content, 'my-skill.md');
    expect(result.slug).toBe('my-skill');
    expect(result.frontmatter.id).toBe('my-skill');
    expect(result.frontmatter.name).toBe('My Skill');
    expect(result.body).toBe('Body.');
  });

  it('defaults id and name from filename when frontmatter omits them', () => {
    const result = parseSkillContent('Just a body.', 'fallback-skill.md');
    expect(result.slug).toBe('fallback-skill');
    expect(result.frontmatter.id).toBe('fallback-skill');
    expect(result.frontmatter.name).toBe('fallback-skill');
    expect(result.body).toBe('Just a body.');
  });
});

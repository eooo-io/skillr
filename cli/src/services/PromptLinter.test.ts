import { describe, it, expect } from 'vitest';
import { lint } from './PromptLinter.js';
import type { ParsedSkill } from '../types.js';

function makeSkill(body: string, overrides: Partial<ParsedSkill['frontmatter']> = {}): ParsedSkill {
  return {
    slug: 'test-skill',
    body,
    frontmatter: {
      id: 'test-skill',
      name: 'Test Skill',
      ...overrides,
    },
  };
}

// Helper to generate a body of N estimated tokens (~4 chars per token)
function bodyOfTokens(n: number): string {
  return 'x'.repeat(n * 4);
}

describe('lint', () => {
  it('returns empty_body warning for empty skill', () => {
    const issues = lint(makeSkill(''));
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('empty_body');
    expect(issues[0].severity).toBe('warning');
  });

  it('returns empty_body warning for whitespace-only skill', () => {
    const issues = lint(makeSkill('   \n\n  '));
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('empty_body');
  });

  it('detects vague instructions', () => {
    const issues = lint(makeSkill('Do your best to complete the task.'));
    const vague = issues.find((i) => i.rule === 'vague_instructions');
    expect(vague).toBeDefined();
    expect(vague!.severity).toBe('warning');
    expect(vague!.line).toBeDefined();
  });

  it('detects weak constraints', () => {
    const issues = lint(makeSkill('You should always format output.'));
    const weak = issues.find((i) => i.rule === 'weak_constraints');
    expect(weak).toBeDefined();
    expect(weak!.severity).toBe('suggestion');
  });

  it('detects conflicting directives', () => {
    const issues = lint(makeSkill('Be concise in your response.\n\nBe thorough in your analysis.'));
    const conflict = issues.find((i) => i.rule === 'conflicting_directives');
    expect(conflict).toBeDefined();
  });

  it('suggests output format for long skills without one', () => {
    const body = bodyOfTokens(250); // >200 tokens, no format section
    const issues = lint(makeSkill(body));
    const format = issues.find((i) => i.rule === 'missing_output_format');
    expect(format).toBeDefined();
  });

  it('does not flag output format when present', () => {
    const body = bodyOfTokens(250) + '\n\n## Output Format\nReturn JSON.';
    const issues = lint(makeSkill(body));
    const format = issues.find((i) => i.rule === 'missing_output_format');
    expect(format).toBeUndefined();
  });

  it('does not flag output format when code block present', () => {
    const body = bodyOfTokens(250) + '\n\n```json\n{"key": "val"}\n```';
    const issues = lint(makeSkill(body));
    const format = issues.find((i) => i.rule === 'missing_output_format');
    expect(format).toBeUndefined();
  });

  it('warns on excessive length', () => {
    const body = bodyOfTokens(8500);
    const issues = lint(makeSkill(body));
    const excessive = issues.find((i) => i.rule === 'excessive_length');
    expect(excessive).toBeDefined();
    expect(excessive!.severity).toBe('warning');
  });

  it('detects role confusion', () => {
    const issues = lint(makeSkill('You are a user who needs help.'));
    const role = issues.find((i) => i.rule === 'role_confusion');
    expect(role).toBeDefined();
  });

  it('suggests examples for substantial skills', () => {
    const body = bodyOfTokens(350);
    const issues = lint(makeSkill(body));
    const examples = issues.find((i) => i.rule === 'missing_examples');
    expect(examples).toBeDefined();
  });

  it('does not flag examples when present', () => {
    const body = bodyOfTokens(350) + '\n\nFor example, return JSON.';
    const issues = lint(makeSkill(body));
    const examples = issues.find((i) => i.rule === 'missing_examples');
    expect(examples).toBeUndefined();
  });

  it('detects duplicate headings', () => {
    const body = '## Setup\nDo X.\n\n## Setup\nDo Y.';
    const issues = lint(makeSkill(body));
    const dup = issues.find((i) => i.rule === 'redundancy');
    expect(dup).toBeDefined();
  });

  it('suggests gotchas for complex skills without them', () => {
    const body = bodyOfTokens(550);
    const issues = lint(makeSkill(body));
    const gotchas = issues.find((i) => i.rule === 'missing_gotchas');
    expect(gotchas).toBeDefined();
  });

  it('does not flag gotchas when frontmatter has them', () => {
    const body = bodyOfTokens(550);
    const issues = lint(makeSkill(body, { gotchas: 'Watch out for X.' }));
    const gotchas = issues.find((i) => i.rule === 'missing_gotchas');
    expect(gotchas).toBeUndefined();
  });

  it('warns on vague description', () => {
    const issues = lint(makeSkill('Body.', { description: 'Helps with stuff' }));
    const desc = issues.find((i) => i.rule === 'vague_description');
    expect(desc).toBeDefined();
  });

  it('warns on short description', () => {
    const issues = lint(makeSkill('Body.', { description: 'Short' }));
    const desc = issues.find((i) => i.rule === 'vague_description');
    expect(desc).toBeDefined();
  });

  it('does not flag a specific description', () => {
    const issues = lint(makeSkill('Body.', { description: 'Validates API responses against the OpenAPI schema and reports mismatches.' }));
    const desc = issues.find((i) => i.rule === 'vague_description');
    expect(desc).toBeUndefined();
  });

  it('suggests skill_type for non-trivial skills', () => {
    const body = bodyOfTokens(250);
    const issues = lint(makeSkill(body));
    const st = issues.find((i) => i.rule === 'missing_skill_type');
    expect(st).toBeDefined();
  });

  it('does not flag skill_type when set', () => {
    const body = bodyOfTokens(250);
    const issues = lint(makeSkill(body, { skill_type: 'capability-uplift' }));
    const st = issues.find((i) => i.rule === 'missing_skill_type');
    expect(st).toBeUndefined();
  });

  it('returns no issues for a well-formed short skill', () => {
    const issues = lint(makeSkill('Always return JSON.'));
    expect(issues).toEqual([]);
  });
});

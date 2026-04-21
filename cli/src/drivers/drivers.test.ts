import { describe, it, expect } from 'vitest';
import { getDriver, getAllDrivers, getDriverSlugs } from './index.js';
import type { ResolvedSkill } from '../types.js';

function makeSkill(overrides: Partial<ResolvedSkill> = {}): ResolvedSkill {
  return {
    slug: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill.',
    body: 'You must always return JSON.',
    category: 'general',
    skill_type: null,
    gotchas: null,
    tags: [],
    conditions: null,
    supplementary_files: [],
    ...overrides,
  };
}

describe('driver registry', () => {
  it('returns all 11 drivers', () => {
    expect(getAllDrivers()).toHaveLength(11);
  });

  it('returns all 11 slugs', () => {
    const slugs = getDriverSlugs();
    expect(slugs).toEqual(
      expect.arrayContaining([
        'claude', 'cursor', 'copilot', 'windsurf', 'cline', 'codex', 'openai',
        'zed', 'aider', 'continue', 'junie',
      ]),
    );
  });

  it('throws for unknown provider', () => {
    expect(() => getDriver('unknown')).toThrow('Unknown provider: unknown');
  });
});

describe('claude driver', () => {
  const driver = getDriver('claude');

  it('generates a single CLAUDE.md file', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.claude/CLAUDE.md');
  });

  it('includes skill name as H2 heading', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files[0].content).toContain('## Test Skill');
  });

  it('includes body content', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files[0].content).toContain('You must always return JSON.');
  });

  it('includes gotchas when present', () => {
    const files = driver.generate([makeSkill({ gotchas: 'Watch out!' })], '/project');
    expect(files[0].content).toContain('### Common Gotchas');
    expect(files[0].content).toContain('Watch out!');
  });

  it('includes conditions as blockquote', () => {
    const files = driver.generate([makeSkill({ conditions: { file_patterns: ['*.ts', '*.tsx'] } })], '/project');
    expect(files[0].content).toContain('**Applies to:**');
    expect(files[0].content).toContain('*.ts, *.tsx');
  });

  it('handles multiple skills', () => {
    const skills = [makeSkill({ slug: 'a', name: 'Skill A' }), makeSkill({ slug: 'b', name: 'Skill B' })];
    const files = driver.generate(skills, '/project');
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain('## Skill A');
    expect(files[0].content).toContain('## Skill B');
  });
});

describe('cursor driver', () => {
  const driver = getDriver('cursor');

  it('generates one .mdc file per skill', () => {
    const skills = [makeSkill({ slug: 'a' }), makeSkill({ slug: 'b' })];
    const files = driver.generate(skills, '/project');
    expect(files).toHaveLength(2);
    expect(files[0].path).toContain('.cursor/rules/a.mdc');
    expect(files[1].path).toContain('.cursor/rules/b.mdc');
  });

  it('sets alwaysApply true when no conditions', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files[0].content).toContain('alwaysApply: true');
  });

  it('sets alwaysApply false and adds globs when conditions present', () => {
    const files = driver.generate([makeSkill({ conditions: { file_patterns: ['*.py'] } })], '/project');
    expect(files[0].content).toContain('alwaysApply: false');
    expect(files[0].content).toContain('*.py');
  });

  it('includes tags in frontmatter', () => {
    const files = driver.generate([makeSkill({ tags: ['python', 'api'] })], '/project');
    expect(files[0].content).toContain('python');
    expect(files[0].content).toContain('api');
  });
});

describe('copilot driver', () => {
  const driver = getDriver('copilot');

  it('generates a single copilot-instructions.md', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.github/copilot-instructions.md');
  });

  it('includes all skills with H2 headings', () => {
    const files = driver.generate([makeSkill({ name: 'My Skill' })], '/project');
    expect(files[0].content).toContain('## My Skill');
  });
});

describe('windsurf driver', () => {
  const driver = getDriver('windsurf');

  it('generates one .md file per skill', () => {
    const files = driver.generate([makeSkill({ slug: 'ws-skill' })], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.windsurf/rules/ws-skill.md');
  });

  it('uses H1 heading for skill name', () => {
    const files = driver.generate([makeSkill({ name: 'Wind Skill' })], '/project');
    expect(files[0].content).toContain('# Wind Skill');
  });
});

describe('cline driver', () => {
  const driver = getDriver('cline');

  it('generates a single .clinerules file', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.clinerules');
  });
});

describe('openai driver (deprecated)', () => {
  const driver = getDriver('openai');

  it('generates a single instructions.md', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.openai/instructions.md');
  });

  it('emits a deprecation header pointing at the codex provider', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files[0].content).toContain('DEPRECATED');
    expect(files[0].content).toContain('codex');
    expect(files[0].content).toContain('AGENTS.md');
  });
});

describe('codex driver', () => {
  const driver = getDriver('codex');

  it('generates AGENTS.md at the project root', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('/project/AGENTS.md');
  });

  it('includes the AGENTS.md H1 heading and skill names as H2', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files[0].content).toContain('# AGENTS.md');
    expect(files[0].content).toContain('## Test Skill');
  });

  it('includes conditions as a blockquote', () => {
    const files = driver.generate(
      [makeSkill({ conditions: { file_patterns: ['*.ts', '*.tsx'] } })],
      '/project',
    );
    expect(files[0].content).toContain('**Applies to:**');
    expect(files[0].content).toContain('*.ts, *.tsx');
  });

  it('handles multiple skills in a single file', () => {
    const skills = [makeSkill({ slug: 'a', name: 'Skill A' }), makeSkill({ slug: 'b', name: 'Skill B' })];
    const files = driver.generate(skills, '/project');
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain('## Skill A');
    expect(files[0].content).toContain('## Skill B');
  });
});

describe('all single-file drivers produce consistent format', () => {
  for (const slug of ['copilot', 'cline', 'codex', 'openai'] as const) {
    it(`${slug} includes H2 heading, body, and separator`, () => {
      const driver = getDriver(slug);
      const files = driver.generate([makeSkill({ name: 'Fmt Test', body: 'Format body.' })], '/project');
      expect(files[0].content).toContain('## Fmt Test');
      expect(files[0].content).toContain('Format body.');
      expect(files[0].content).toContain('---');
    });

    it(`${slug} includes gotchas section`, () => {
      const driver = getDriver(slug);
      const files = driver.generate([makeSkill({ gotchas: 'Edge case here.' })], '/project');
      expect(files[0].content).toContain('### Common Gotchas');
      expect(files[0].content).toContain('Edge case here.');
    });
  }
});

describe('zed driver', () => {
  const driver = getDriver('zed');
  it('writes to .rules', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.rules');
    expect(files[0].content).toContain('## Test Skill');
  });
});

describe('aider driver', () => {
  const driver = getDriver('aider');
  it('writes CONVENTIONS.md and .aider.conf.yml', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.path.endsWith('CONVENTIONS.md'))).toBe(true);
    expect(files.some((f) => f.path.endsWith('.aider.conf.yml'))).toBe(true);
    const conv = files.find((f) => f.path.endsWith('CONVENTIONS.md'))!;
    expect(conv.content).toContain('## Test Skill');
  });

  it('aider config references CONVENTIONS.md', () => {
    const files = driver.generate([makeSkill()], '/project');
    const config = files.find((f) => f.path.endsWith('.aider.conf.yml'))!;
    expect(config.content).toContain('CONVENTIONS.md');
  });
});

describe('continue driver', () => {
  const driver = getDriver('continue');
  it('writes one .md file per skill under .continue/rules', () => {
    const files = driver.generate(
      [makeSkill({ slug: 'a' }), makeSkill({ slug: 'b', name: 'Skill B' })],
      '/project',
    );
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.path.includes('.continue/rules'))).toBe(true);
  });
});

describe('junie driver', () => {
  const driver = getDriver('junie');
  it('writes a single .junie/guidelines.md', () => {
    const files = driver.generate([makeSkill()], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].path).toContain('.junie/guidelines.md');
    expect(files[0].content).toContain('# Project Guidelines');
  });
});

describe('supplementary files', () => {
  const supplementary = [{ path: 'examples/good.md', content: 'Good example body.' }];

  it('claude appends supplementary files as sections in the main file', () => {
    const driver = getDriver('claude');
    const files = driver.generate([makeSkill({ supplementary_files: supplementary })], '/project');
    expect(files).toHaveLength(1);
    expect(files[0].content).toContain('### examples/good.md');
    expect(files[0].content).toContain('Good example body.');
  });

  for (const slug of ['copilot', 'cline', 'codex', 'openai']) {
    it(`${slug} appends supplementary files as sections`, () => {
      const driver = getDriver(slug);
      const files = driver.generate([makeSkill({ supplementary_files: supplementary })], '/project');
      expect(files).toHaveLength(1);
      expect(files[0].content).toContain('### examples/good.md');
      expect(files[0].content).toContain('Good example body.');
    });
  }

  for (const { slug, dir, mainExt } of [
    { slug: 'cursor', dir: '.cursor/rules', mainExt: '.mdc' },
    { slug: 'windsurf', dir: '.windsurf/rules', mainExt: '.md' },
  ]) {
    it(`${slug} writes supplementary files as companion files`, () => {
      const driver = getDriver(slug);
      const files = driver.generate([makeSkill({ supplementary_files: supplementary })], '/project');
      expect(files.some((f) => f.path.endsWith(`test-skill${mainExt}`))).toBe(true);
      const companion = files.find((f) => f.path.endsWith('examples/good.md'));
      expect(companion).toBeDefined();
      expect(companion!.path).toContain(`${dir}/test-skill.d/examples/good.md`);
      expect(companion!.content).toBe('Good example body.');
    });
  }
});

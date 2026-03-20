import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { scaffoldProject, writeManifest, readManifest } from './ManifestService.js';
import { renderFile } from './SkillFileParser.js';
import { resolveSkills, sync, preview } from './SyncService.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillr-sync-'));
  await scaffoldProject(tmpDir, 'Sync Test', ['claude', 'cursor']);

  // Write a test skill
  const skillContent = renderFile(
    { id: 'greet', name: 'Greeting Skill', tags: ['test'] },
    'Always greet the user warmly.',
  );
  await fs.writeFile(path.join(tmpDir, '.skillr', 'skills', 'greet.md'), skillContent);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('resolveSkills', () => {
  it('resolves skills from a project', async () => {
    const { skills, manifest } = await resolveSkills(tmpDir);
    expect(manifest.name).toBe('Sync Test');
    expect(skills).toHaveLength(1);
    expect(skills[0].slug).toBe('greet');
    expect(skills[0].body).toBe('Always greet the user warmly.');
  });

  it('throws when no manifest exists', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillr-no-manifest-'));
    try {
      await expect(resolveSkills(emptyDir)).rejects.toThrow('No .skillr/manifest.json found');
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });

  it('resolves template variables with defaults', async () => {
    const skillContent = renderFile(
      {
        id: 'tmpl',
        name: 'Template Skill',
        template_variables: [{ name: 'lang', default: 'English' }],
      },
      'Write in {{lang}}.',
    );
    await fs.writeFile(path.join(tmpDir, '.skillr', 'skills', 'tmpl.md'), skillContent);

    const { skills } = await resolveSkills(tmpDir);
    const tmpl = skills.find((s) => s.slug === 'tmpl');
    expect(tmpl!.body).toBe('Write in English.');
  });

  it('overrides defaults with provided variables', async () => {
    const skillContent = renderFile(
      {
        id: 'tmpl2',
        name: 'Template Skill 2',
        template_variables: [{ name: 'lang', default: 'English' }],
      },
      'Write in {{lang}}.',
    );
    await fs.writeFile(path.join(tmpDir, '.skillr', 'skills', 'tmpl2.md'), skillContent);

    const { skills } = await resolveSkills(tmpDir, { lang: 'French' });
    const tmpl = skills.find((s) => s.slug === 'tmpl2');
    expect(tmpl!.body).toBe('Write in French.');
  });
});

describe('sync', () => {
  it('writes provider files and updates synced_at', async () => {
    const results = await sync(tmpDir);

    // Should sync to both claude and cursor
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.provider)).toEqual(expect.arrayContaining(['claude', 'cursor']));

    // Claude file should exist
    const claudeFile = await fs.readFile(path.join(tmpDir, '.claude', 'CLAUDE.md'), 'utf-8');
    expect(claudeFile).toContain('Greeting Skill');

    // Cursor file should exist
    const cursorFile = await fs.readFile(
      path.join(tmpDir, '.cursor', 'rules', 'greet.mdc'),
      'utf-8',
    );
    expect(cursorFile).toContain('Always greet the user warmly.');

    // Manifest should have synced_at updated
    const manifest = await readManifest(tmpDir);
    expect(manifest.synced_at).not.toBeNull();
    expect(manifest.skills).toContain('greet');
  });

  it('filters to a single provider', async () => {
    const results = await sync(tmpDir, {}, 'claude');
    expect(results).toHaveLength(1);
    expect(results[0].provider).toBe('claude');
  });
});

describe('preview', () => {
  it('shows files as added when they do not exist', async () => {
    const results = await preview(tmpDir);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.status === 'added')).toBe(true);
  });

  it('shows files as unchanged after sync', async () => {
    await sync(tmpDir);
    const results = await preview(tmpDir);
    expect(results.every((r) => r.status === 'unchanged')).toBe(true);
  });

  it('shows files as modified after content change', async () => {
    await sync(tmpDir);

    // Modify the skill
    const newContent = renderFile(
      { id: 'greet', name: 'Greeting Skill', tags: ['test'] },
      'Greet the user with a joke.',
    );
    await fs.writeFile(path.join(tmpDir, '.skillr', 'skills', 'greet.md'), newContent);

    const results = await preview(tmpDir);
    const modified = results.filter((r) => r.status === 'modified');
    expect(modified.length).toBeGreaterThan(0);
  });

  it('filters by provider', async () => {
    const results = await preview(tmpDir, {}, 'cursor');
    expect(results.every((r) => r.provider === 'cursor')).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  scanProject,
  scaffoldProject,
  readManifest,
  writeManifest,
  writeSkillFile,
  hasSkillrDir,
  slugify,
} from './ManifestService.js';
import { renderFile } from './SkillFileParser.js';
import type { Manifest, SkillFrontmatter } from '../types.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillr-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('scaffoldProject', () => {
  it('creates .skillr/ with manifest.json and skills/ directory', async () => {
    await scaffoldProject(tmpDir, 'Test Project', ['claude', 'cursor']);

    const manifest = JSON.parse(
      await fs.readFile(path.join(tmpDir, '.skillr', 'manifest.json'), 'utf-8'),
    );
    expect(manifest.name).toBe('Test Project');
    expect(manifest.providers).toEqual(['claude', 'cursor']);
    expect(manifest.spec_version).toBe(1);
    expect(manifest.skills).toEqual([]);
    expect(manifest.id).toBeDefined();

    const stat = await fs.stat(path.join(tmpDir, '.skillr', 'skills'));
    expect(stat.isDirectory()).toBe(true);
  });
});

describe('hasSkillrDir', () => {
  it('returns false when no .skillr/', async () => {
    expect(await hasSkillrDir(tmpDir)).toBe(false);
  });

  it('returns true after scaffolding', async () => {
    await scaffoldProject(tmpDir, 'Test');
    expect(await hasSkillrDir(tmpDir)).toBe(true);
  });
});

describe('readManifest / writeManifest', () => {
  it('roundtrips manifest data', async () => {
    await scaffoldProject(tmpDir, 'Test');
    const manifest = await readManifest(tmpDir);
    manifest.skills = ['skill-a', 'skill-b'];
    manifest.synced_at = '2026-01-01T00:00:00Z';
    await writeManifest(tmpDir, manifest);

    const reread = await readManifest(tmpDir);
    expect(reread.skills).toEqual(['skill-a', 'skill-b']);
    expect(reread.synced_at).toBe('2026-01-01T00:00:00Z');
  });
});

describe('writeSkillFile', () => {
  beforeEach(async () => {
    await scaffoldProject(tmpDir, 'Test');
  });

  it('writes flat .md file for simple skills', async () => {
    const fm: SkillFrontmatter = { id: 'my-skill', name: 'My Skill' };
    await writeSkillFile(tmpDir, fm, 'Instructions here.');

    const content = await fs.readFile(
      path.join(tmpDir, '.skillr', 'skills', 'my-skill.md'),
      'utf-8',
    );
    expect(content).toContain('id: my-skill');
    expect(content).toContain('Instructions here.');
  });

  it('writes folder format for skills with gotchas', async () => {
    const fm: SkillFrontmatter = {
      id: 'gotcha-skill',
      name: 'Gotcha Skill',
      gotchas: 'Watch out for edge cases.',
    };
    await writeSkillFile(tmpDir, fm, 'Body.');

    const skillMd = await fs.readFile(
      path.join(tmpDir, '.skillr', 'skills', 'gotcha-skill', 'skill.md'),
      'utf-8',
    );
    expect(skillMd).toContain('id: gotcha-skill');
    expect(skillMd).not.toContain('gotchas');

    const gotchas = await fs.readFile(
      path.join(tmpDir, '.skillr', 'skills', 'gotcha-skill', 'gotchas.md'),
      'utf-8',
    );
    expect(gotchas).toBe('Watch out for edge cases.');
  });

  it('writes supplementary files in folder format', async () => {
    const fm: SkillFrontmatter = {
      id: 'supp-skill',
      name: 'Supp Skill',
      supplementary_files: [{ path: 'examples/example.json', content: '{"key":"val"}' }],
    };
    await writeSkillFile(tmpDir, fm, 'Body.');

    const supp = await fs.readFile(
      path.join(tmpDir, '.skillr', 'skills', 'supp-skill', 'examples', 'example.json'),
      'utf-8',
    );
    expect(supp).toBe('{"key":"val"}');
  });
});

describe('scanProject', () => {
  beforeEach(async () => {
    await scaffoldProject(tmpDir, 'Scan Test', ['claude']);
  });

  it('returns null manifest and empty skills when no .skillr/', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillr-empty-'));
    try {
      const result = await scanProject(emptyDir);
      expect(result.manifest).toBeNull();
      expect(result.skills).toEqual([]);
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });

  it('discovers flat skill files', async () => {
    const skillContent = renderFile({ id: 'flat-skill', name: 'Flat Skill' }, 'Flat body.');
    await fs.writeFile(
      path.join(tmpDir, '.skillr', 'skills', 'flat-skill.md'),
      skillContent,
    );

    const result = await scanProject(tmpDir);
    expect(result.manifest).not.toBeNull();
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].slug).toBe('flat-skill');
    expect(result.skills[0].body).toBe('Flat body.');
  });

  it('discovers folder-based skills with gotchas', async () => {
    const skillDir = path.join(tmpDir, '.skillr', 'skills', 'folder-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'skill.md'),
      renderFile({ id: 'folder-skill', name: 'Folder Skill' }, 'Folder body.'),
    );
    await fs.writeFile(path.join(skillDir, 'gotchas.md'), 'Gotcha content.');

    const result = await scanProject(tmpDir);
    const folderSkill = result.skills.find((s) => s.slug === 'folder-skill');
    expect(folderSkill).toBeDefined();
    expect(folderSkill!.frontmatter.gotchas).toBe('Gotcha content.');
  });
});

describe('slugify (re-export)', () => {
  it('works via ManifestService re-export', () => {
    expect(slugify('Test Skill')).toBe('test-skill');
  });
});

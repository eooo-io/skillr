import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { registerDriver, loadPlugins, getDriver, getDriverSlugs } from './index.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillr-plugins-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('registerDriver', () => {
  it('registers a valid plugin and makes it available via getDriver', () => {
    const plugin = {
      name: 'Unit Test Registered',
      slug: 'unit-test-registered',
      generate: () => [],
    };
    registerDriver(plugin);
    expect(getDriver('unit-test-registered')).toBe(plugin);
    expect(getDriverSlugs()).toContain('unit-test-registered');
  });

  it('throws when missing slug', () => {
    expect(() => registerDriver({ name: 'x', generate: () => [] } as any)).toThrow(/slug/);
  });

  it('throws when missing name', () => {
    expect(() => registerDriver({ slug: 'x', generate: () => [] } as any)).toThrow(/name/);
  });

  it('throws when missing generate()', () => {
    expect(() => registerDriver({ name: 'x', slug: 'x' } as any)).toThrow(/generate/);
  });
});

describe('loadPlugins', () => {
  it('returns empty when .skillr/plugins does not exist', async () => {
    const loaded = await loadPlugins(tmpDir);
    expect(loaded).toEqual([]);
  });

  it('loads and registers a plugin file', async () => {
    const pluginsDir = path.join(tmpDir, '.skillr', 'plugins');
    await fs.mkdir(pluginsDir, { recursive: true });
    await fs.writeFile(
      path.join(pluginsDir, 'custom-tool.mjs'),
      `export default {
        name: 'Custom Tool',
        slug: 'custom-tool-${Date.now()}',
        generate() { return []; },
      };`,
    );

    const loaded = await loadPlugins(tmpDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatch(/^custom-tool-/);
  });

  it('throws with context when a plugin is malformed', async () => {
    const pluginsDir = path.join(tmpDir, '.skillr', 'plugins');
    await fs.mkdir(pluginsDir, { recursive: true });
    await fs.writeFile(
      path.join(pluginsDir, 'bad.mjs'),
      `export default { name: 'Bad' };`,
    );

    await expect(loadPlugins(tmpDir)).rejects.toThrow(/bad\.mjs/);
  });
});

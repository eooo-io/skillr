import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { evaluateConditions } from './ConditionEvaluator.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillr-cond-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('evaluateConditions', () => {
  it('passes when conditions are null', async () => {
    const r = await evaluateConditions(null, tmpDir);
    expect(r.passed).toBe(true);
  });

  it('passes when conditions are empty', async () => {
    const r = await evaluateConditions({}, tmpDir);
    expect(r.passed).toBe(true);
  });

  it('passes when a file_pattern matches', async () => {
    await fs.writeFile(path.join(tmpDir, 'app.tsx'), 'export {}');
    const r = await evaluateConditions({ file_patterns: ['**/*.tsx'] }, tmpDir);
    expect(r.passed).toBe(true);
    expect(r.reason).toContain('file_patterns matched');
  });

  it('fails when no file_pattern matches', async () => {
    await fs.writeFile(path.join(tmpDir, 'app.js'), '');
    const r = await evaluateConditions({ file_patterns: ['**/*.tsx'] }, tmpDir);
    expect(r.passed).toBe(false);
    expect(r.reason).toContain('no file_patterns');
  });

  it('passes when a path_prefix exists', async () => {
    await fs.mkdir(path.join(tmpDir, 'src', 'api'), { recursive: true });
    const r = await evaluateConditions({ path_prefixes: ['src/api'] }, tmpDir);
    expect(r.passed).toBe(true);
    expect(r.reason).toContain('src/api');
  });

  it('fails when no path_prefix exists', async () => {
    const r = await evaluateConditions({ path_prefixes: ['src/api'] }, tmpDir);
    expect(r.passed).toBe(false);
    expect(r.reason).toContain('no path_prefixes');
  });

  it('passes if any condition is met across patterns and prefixes', async () => {
    await fs.mkdir(path.join(tmpDir, 'src', 'api'), { recursive: true });
    const r = await evaluateConditions(
      { file_patterns: ['**/*.tsx'], path_prefixes: ['src/api'] },
      tmpDir,
    );
    expect(r.passed).toBe(true);
  });

  it('ignores node_modules when matching file_patterns', async () => {
    await fs.mkdir(path.join(tmpDir, 'node_modules', 'foo'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'node_modules', 'foo', 'index.tsx'), '');
    const r = await evaluateConditions({ file_patterns: ['**/*.tsx'] }, tmpDir);
    expect(r.passed).toBe(false);
  });
});

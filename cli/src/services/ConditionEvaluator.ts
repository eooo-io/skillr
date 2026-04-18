import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import type { SkillConditions } from '../types.js';

export interface ConditionResult {
  passed: boolean;
  reason: string;
}

const IGNORE = ['node_modules/**', '.git/**', 'dist/**', 'build/**'];

/**
 * Evaluate whether a skill's conditions are met for the given project.
 * A skill with no conditions always passes.
 * A skill with conditions passes if ANY file_pattern matches OR ANY path_prefix exists.
 */
export async function evaluateConditions(
  conditions: SkillConditions | null | undefined,
  projectPath: string,
): Promise<ConditionResult> {
  if (!conditions) return { passed: true, reason: 'no conditions' };

  const patterns = conditions.file_patterns ?? [];
  const prefixes = conditions.path_prefixes ?? [];

  if (patterns.length === 0 && prefixes.length === 0) {
    return { passed: true, reason: 'empty conditions' };
  }

  if (patterns.length > 0) {
    const matches = await fg(patterns, {
      cwd: projectPath,
      ignore: IGNORE,
      onlyFiles: true,
      suppressErrors: true,
    });
    if (matches.length > 0) {
      return { passed: true, reason: `file_patterns matched (e.g. ${matches[0]})` };
    }
  }

  if (prefixes.length > 0) {
    for (const prefix of prefixes) {
      try {
        const stat = await fs.stat(path.join(projectPath, prefix));
        if (stat.isDirectory()) {
          return { passed: true, reason: `path_prefix exists: ${prefix}` };
        }
      } catch {
        // keep looking
      }
    }
  }

  const parts: string[] = [];
  if (patterns.length > 0) parts.push(`no file_patterns matched (${patterns.join(', ')})`);
  if (prefixes.length > 0) parts.push(`no path_prefixes exist (${prefixes.join(', ')})`);
  return { passed: false, reason: parts.join('; ') };
}

import path from 'node:path';
import type { SupplementaryFile, FileOutput, ResolvedSkill } from '../types.js';

/**
 * Format supplementary files as appended markdown sections.
 * For single-file providers (Claude, Copilot, Cline, OpenAI).
 */
export function appendSupplementary(content: string, files: SupplementaryFile[]): string {
  if (!files.length) return content;
  let out = content;
  if (!out.endsWith('\n')) out += '\n';
  for (const file of files) {
    out += `\n### ${file.path}\n\n${file.content.trimEnd()}\n`;
  }
  return out;
}

/**
 * Emit supplementary files as companion files in a per-skill subdirectory.
 * For multi-file providers (Cursor, Windsurf).
 */
export function companionFiles(
  skill: ResolvedSkill,
  baseDir: string,
): FileOutput[] {
  if (!skill.supplementary_files.length) return [];
  const outputs: FileOutput[] = [];
  const subdir = path.join(baseDir, `${skill.slug}.d`);
  for (const file of skill.supplementary_files) {
    outputs.push({
      path: path.join(subdir, file.path),
      content: file.content,
    });
  }
  return outputs;
}

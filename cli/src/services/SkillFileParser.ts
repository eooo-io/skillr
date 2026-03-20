import yaml from 'js-yaml';
import type { SkillFrontmatter, ParsedSkill } from '../types.js';

/**
 * Parse a skill file (YAML frontmatter + Markdown body) into its components.
 */
export function parseContent(content: string): { frontmatter: Partial<SkillFrontmatter>; body: string } {
  const trimmed = content.trimStart();

  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: trimmed.trim() };
  }

  const endPos = trimmed.indexOf('\n---', 3);

  if (endPos === -1) {
    return { frontmatter: {}, body: trimmed.trim() };
  }

  const yamlBlock = trimmed.slice(4, endPos);
  const body = trimmed.slice(endPos + 4);

  const frontmatter = (yaml.load(yamlBlock.trim()) as Partial<SkillFrontmatter>) ?? {};

  return { frontmatter, body: body.trim() };
}

/**
 * Render a skill file from frontmatter and body.
 */
export function renderFile(frontmatter: Partial<SkillFrontmatter>, body: string): string {
  const yamlStr = yaml.dump(frontmatter, { lineWidth: -1, quotingType: '"', forceQuotes: false });
  return `---\n${yamlStr}---\n\n${body}\n`;
}

/**
 * Validate frontmatter and return an array of errors (empty = valid).
 */
export function validateFrontmatter(data: Partial<SkillFrontmatter>): string[] {
  const errors: string[] = [];

  if (!data.id) {
    errors.push('Missing required field: id');
  }
  if (!data.name) {
    errors.push('Missing required field: name');
  }

  return errors;
}

/**
 * Generate a slug from a name.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse a skill file and return a fully-typed ParsedSkill.
 */
export function parseSkillContent(content: string, filename: string): ParsedSkill {
  const { frontmatter, body } = parseContent(content);
  const slug = filename.replace(/\.md$/, '');

  return {
    frontmatter: {
      id: frontmatter.id ?? slug,
      name: frontmatter.name ?? slug,
      ...frontmatter,
    } as SkillFrontmatter,
    body,
    slug,
  };
}

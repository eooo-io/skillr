import path from 'node:path';
import yaml from 'js-yaml';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';
import { companionFiles } from './supplementary.js';

export const cursorDriver: ProviderDriver = {
  name: 'Cursor',
  slug: 'cursor',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    const dir = path.join(projectPath, '.cursor', 'rules');
    const files: FileOutput[] = [];

    for (const skill of skills) {
      const hasConditions = !!skill.conditions?.file_patterns?.length;
      const frontmatter: Record<string, unknown> = {
        description: skill.description ?? '',
        alwaysApply: !hasConditions,
      };

      if (hasConditions) {
        frontmatter.globs = skill.conditions!.file_patterns;
      }

      if (skill.tags.length > 0) {
        frontmatter.tags = skill.tags;
      }

      const yamlStr = yaml.dump(frontmatter, { lineWidth: -1 });
      let content = `---\n${yamlStr}---\n\n${skill.body}\n`;

      if (skill.gotchas) {
        content += `\n## Common Gotchas\n\n${skill.gotchas}\n`;
      }

      files.push({
        path: path.join(dir, `${skill.slug}.mdc`),
        content,
      });

      files.push(...companionFiles(skill, dir));
    }

    return files;
  },
};

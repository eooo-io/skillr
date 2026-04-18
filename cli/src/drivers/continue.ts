import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';
import { companionFiles } from './supplementary.js';

export const continueDriver: ProviderDriver = {
  name: 'Continue',
  slug: 'continue',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    const dir = path.join(projectPath, '.continue', 'rules');
    const files: FileOutput[] = [];

    for (const skill of skills) {
      let content = `# ${skill.name}\n\n`;
      if (skill.description) {
        content += `> ${skill.description}\n\n`;
      }
      content += `${skill.body}\n`;
      if (skill.gotchas) {
        content += `\n## Common Gotchas\n\n${skill.gotchas}\n`;
      }

      files.push({
        path: path.join(dir, `${skill.slug}.md`),
        content,
      });

      files.push(...companionFiles(skill, dir));
    }

    return files;
  },
};

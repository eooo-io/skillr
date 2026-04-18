import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';
import { appendSupplementary } from './supplementary.js';

export const junieDriver: ProviderDriver = {
  name: 'JetBrains AI (Junie)',
  slug: 'junie',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    let output = '# Project Guidelines\n\n';

    for (const skill of skills) {
      output += `## ${skill.name}\n\n`;
      output += `${skill.body}\n\n`;
      if (skill.gotchas) {
        output += `### Common Gotchas\n\n${skill.gotchas}\n\n`;
      }
      output = appendSupplementary(output, skill.supplementary_files) + '\n---\n\n';
    }

    return [{
      path: path.join(projectPath, '.junie', 'guidelines.md'),
      content: output.trimEnd() + '\n',
    }];
  },
};

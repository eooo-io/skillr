import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';

export const copilotDriver: ProviderDriver = {
  name: 'GitHub Copilot',
  slug: 'copilot',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    let output = '';

    for (const skill of skills) {
      output += `## ${skill.name}\n\n`;
      output += `${skill.body}\n\n`;
      if (skill.gotchas) {
        output += `### Common Gotchas\n\n${skill.gotchas}\n\n`;
      }
      output += '---\n\n';
    }

    return [{
      path: path.join(projectPath, '.github', 'copilot-instructions.md'),
      content: output.trimEnd() + '\n',
    }];
  },
};

import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';

export const claudeDriver: ProviderDriver = {
  name: 'Claude',
  slug: 'claude',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    let output = '# CLAUDE.md\n\n';

    for (const skill of skills) {
      output += `## ${skill.name}\n\n`;

      if (skill.conditions?.file_patterns?.length) {
        const patterns = skill.conditions.file_patterns.join(', ');
        output += `> **Applies to:** \`${patterns}\`\n\n`;
      }

      output += `${skill.body}\n\n`;

      if (skill.gotchas) {
        output += `### Common Gotchas\n\n${skill.gotchas}\n\n`;
      }

      output += '---\n\n';
    }

    return [{
      path: path.join(projectPath, '.claude', 'CLAUDE.md'),
      content: output.trimEnd() + '\n',
    }];
  },
};

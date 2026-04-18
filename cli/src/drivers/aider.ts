import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';
import { appendSupplementary } from './supplementary.js';

export const aiderDriver: ProviderDriver = {
  name: 'Aider',
  slug: 'aider',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    let output = '# Conventions\n\n';

    for (const skill of skills) {
      output += `## ${skill.name}\n\n`;
      output += `${skill.body}\n\n`;
      if (skill.gotchas) {
        output += `### Common Gotchas\n\n${skill.gotchas}\n\n`;
      }
      output = appendSupplementary(output, skill.supplementary_files) + '\n---\n\n';
    }

    const conventionsPath = path.join(projectPath, 'CONVENTIONS.md');
    const configContent = "read: ['CONVENTIONS.md']\n";

    return [
      { path: conventionsPath, content: output.trimEnd() + '\n' },
      { path: path.join(projectPath, '.aider.conf.yml'), content: configContent },
    ];
  },
};

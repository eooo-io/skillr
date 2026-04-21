import path from 'node:path';
import type { ProviderDriver, ResolvedSkill, FileOutput } from '../types.js';
import { appendSupplementary } from './supplementary.js';

export const codexDriver: ProviderDriver = {
  name: 'OpenAI Codex',
  slug: 'codex',

  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[] {
    let output = '# AGENTS.md\n\n';

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

      output = appendSupplementary(output, skill.supplementary_files) + '\n---\n\n';
    }

    return [{
      path: path.join(projectPath, 'AGENTS.md'),
      content: output.trimEnd() + '\n',
    }];
  },
};
